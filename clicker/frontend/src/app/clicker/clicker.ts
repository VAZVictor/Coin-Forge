import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  computed,
  inject,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GameStateService } from '../core/services/gameState.service';
import { NumberFormatService } from '../core/services/numberFormat.service';
import { AuthService } from '../core/services/auth.service';

const SHAKE_EVERY_N_CLICKS = 10;
const FLOAT_TEXT_LIFETIME_MS = 800;
const PARTICLE_LIFETIME_MS = 600;
const MIN_PARTICLES = 6;
const MAX_PARTICLES = 8;

// Bonus orb: a small "double your next click" button that appears inside
// the main button every so often, stays up briefly, then vanishes again.
const BONUS_ORB_VISIBLE_MS = 4500;
const BONUS_ORB_MIN_DELAY_MS = 7000;
const BONUS_ORB_MAX_DELAY_MS = 15000;
const BONUS_ORB_MIN_RADIUS_PX = 18;
const BONUS_ORB_MAX_RADIUS_PX = 56;

@Component({
  selector: 'app-clicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clicker.html',
  styleUrl: './clicker.scss',
  host: {
    class: 'clicker-host'
  },
  animations: [
    trigger('squish', [
      state('idle', style({ transform: 'scale(1)' })),
      state('pressed', style({ transform: 'scale(0.9)' })),
      transition('idle => pressed', animate('90ms cubic-bezier(0.4, 0, 0.6, 1)')),
      transition('pressed => idle', animate('320ms cubic-bezier(0.34, 1.56, 0.64, 1)'))
    ])
  ]
})
export class Clicker {
  protected readonly gameState = inject(GameStateService);
  protected readonly numberFormat = inject(NumberFormatService);
  protected readonly authService = inject(AuthService);

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly squishState = signal<'idle' | 'pressed'>('idle');
  protected readonly isShaking = signal<boolean>(false);
  protected readonly clickCount = signal<number>(0);

  protected readonly bonusOrbVisible = signal<boolean>(false);
  protected readonly bonusOrbOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  private bonusOrbSpawnHandle: ReturnType<typeof setTimeout> | null = null;
  private bonusOrbHideHandle: ReturnType<typeof setTimeout> | null = null;

  protected readonly coinsDisplay = computed(() => this.numberFormat.format(this.gameState.coins()));
  protected readonly cpsDisplay = computed(() => this.numberFormat.format(this.gameState.cps()));
  protected readonly clickPowerDisplay = computed(() =>
    this.numberFormat.format(this.gameState.clickPower())
  );

  protected readonly comboMultiplier = this.gameState.comboMultiplier;
  protected readonly comboProgress = this.gameState.comboProgress;

  protected readonly comboMultiplierDisplay = computed(() => {
    const multiplier = this.gameState.comboMultiplier();
    return multiplier.toFixed(2);
  });

  protected readonly isComboActive = computed(() => this.gameState.comboCount() > 0);

  protected get isVip(): boolean {
    return this.authService.currentUser()?.isVip === true;
  }

  constructor() {
    if (this.isBrowser) {
      this.scheduleNextBonusOrb();
    }

    this.destroyRef.onDestroy(() => {
      if (this.bonusOrbSpawnHandle !== null) clearTimeout(this.bonusOrbSpawnHandle);
      if (this.bonusOrbHideHandle !== null) clearTimeout(this.bonusOrbHideHandle);
    });
  }

  private scheduleNextBonusOrb(): void {
    const delay =
      BONUS_ORB_MIN_DELAY_MS + Math.random() * (BONUS_ORB_MAX_DELAY_MS - BONUS_ORB_MIN_DELAY_MS);
    this.bonusOrbSpawnHandle = setTimeout(() => this.spawnBonusOrb(), delay);
  }

  private spawnBonusOrb(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius =
      BONUS_ORB_MIN_RADIUS_PX + Math.random() * (BONUS_ORB_MAX_RADIUS_PX - BONUS_ORB_MIN_RADIUS_PX);

    this.bonusOrbOffset.set({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
    this.bonusOrbVisible.set(true);

    this.bonusOrbHideHandle = setTimeout(() => {
      this.bonusOrbVisible.set(false);
      this.scheduleNextBonusOrb();
    }, BONUS_ORB_VISIBLE_MS);
  }

  protected onBonusOrbClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this.bonusOrbHideHandle !== null) {
      clearTimeout(this.bonusOrbHideHandle);
      this.bonusOrbHideHandle = null;
    }

    this.bonusOrbVisible.set(false);
    this.gameState.armBonusClick();
    this.scheduleNextBonusOrb();
  }

  protected onButtonClick(event: MouseEvent): void {
    const gained = this.gameState.click();

    this.triggerSquish();
    this.spawnFloatingText(event.clientX, event.clientY, gained);
    this.spawnParticles(event.clientX, event.clientY);
    this.registerClickForShake();
  }

  private triggerSquish(): void {
    this.squishState.set('pressed');
    setTimeout(() => this.squishState.set('idle'), 90);
  }

  private registerClickForShake(): void {
    this.clickCount.update(count => count + 1);
    if (this.clickCount() % SHAKE_EVERY_N_CLICKS === 0) {
      this.isShaking.set(true);
      setTimeout(() => this.isShaking.set(false), 300);
    }
  }

  private getFeedbackLayer(): HTMLElement {
    const clickerContainer = this.hostRef.nativeElement.querySelector('.clickerContainer') as HTMLElement | null;
    return clickerContainer ?? this.hostRef.nativeElement;
  }

  private spawnFloatingText(clientX: number, clientY: number, amount: number): void {
    const feedbackLayer = this.getFeedbackLayer();
    const feedbackRect = feedbackLayer.getBoundingClientRect();
    const localX = clientX - feedbackRect.left;
    const localY = clientY - feedbackRect.top;

    const el = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.addClass(el, 'floatingText');
    this.renderer.setStyle(el, 'left', `${localX}px`);
    this.renderer.setStyle(el, 'top', `${localY}px`);

    const textNode = this.renderer.createText(`+${this.numberFormat.format(amount)}`);
    this.renderer.appendChild(el, textNode);
    this.renderer.appendChild(feedbackLayer, el);

    setTimeout(() => {
      if (el.parentNode) {
        this.renderer.removeChild(feedbackLayer, el);
      }
    }, FLOAT_TEXT_LIFETIME_MS);
  }

  private spawnParticles(clientX: number, clientY: number): void {
    const feedbackLayer = this.getFeedbackLayer();
    const feedbackRect = feedbackLayer.getBoundingClientRect();
    const localX = clientX - feedbackRect.left;
    const localY = clientY - feedbackRect.top;

    const particleCount =
      Math.floor(Math.random() * (MAX_PARTICLES - MIN_PARTICLES + 1)) + MIN_PARTICLES;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const distance = 40 + Math.random() * 30;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      const particle = this.renderer.createElement('span') as HTMLSpanElement;
      this.renderer.addClass(particle, 'particle');
      this.renderer.addClass(particle, i % 2 === 0 ? 'particleSky' : 'particleBloom');
      this.renderer.setStyle(particle, 'left', `${localX}px`);
      this.renderer.setStyle(particle, 'top', `${localY}px`);
      this.renderer.setStyle(particle, '--dx', `${dx}px`);
      this.renderer.setStyle(particle, '--dy', `${dy}px`);

      this.renderer.appendChild(feedbackLayer, particle);

      setTimeout(() => {
        if (particle.parentNode) {
          this.renderer.removeChild(feedbackLayer, particle);
        }
      }, PARTICLE_LIFETIME_MS);
    }
  }
}

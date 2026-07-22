import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  computed,
  inject,
  signal
} from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GameStateService } from '../core/services/gameState.service';
import { NumberFormatService } from '../core/services/numberFormat.service';

const SHAKE_EVERY_N_CLICKS = 10;
const FLOAT_TEXT_LIFETIME_MS = 800;
const PARTICLE_LIFETIME_MS = 600;
const MIN_PARTICLES = 6;
const MAX_PARTICLES = 8;

@Component({
  selector: 'app-clicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clicker.html',
  styleUrl: './clicker.css',
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

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  protected readonly squishState = signal<'idle' | 'pressed'>('idle');
  protected readonly isShaking = signal<boolean>(false);
  protected readonly clickCount = signal<number>(0);

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

  private spawnFloatingText(clientX: number, clientY: number, amount: number): void {
    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    const localX = clientX - hostRect.left;
    const localY = clientY - hostRect.top;

    const el = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.addClass(el, 'floatingText');
    this.renderer.setStyle(el, 'left', `${localX}px`);
    this.renderer.setStyle(el, 'top', `${localY}px`);

    const textNode = this.renderer.createText(`+${this.numberFormat.format(amount)}`);
    this.renderer.appendChild(el, textNode);
    this.renderer.appendChild(this.hostRef.nativeElement, el);

    setTimeout(() => {
      if (el.parentNode) {
        this.renderer.removeChild(this.hostRef.nativeElement, el);
      }
    }, FLOAT_TEXT_LIFETIME_MS);
  }

  private spawnParticles(clientX: number, clientY: number): void {
    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    const localX = clientX - hostRect.left;
    const localY = clientY - hostRect.top;

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

      this.renderer.appendChild(this.hostRef.nativeElement, particle);

      setTimeout(() => {
        if (particle.parentNode) {
          this.renderer.removeChild(this.hostRef.nativeElement, particle);
        }
      }, PARTICLE_LIFETIME_MS);
    }
  }
}

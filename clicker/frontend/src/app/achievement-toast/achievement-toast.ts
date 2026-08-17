import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { AchievementsService } from '../core/services/achievements.service';
import { AchievementTier } from '../core/models/achievement.model';

/** How long each tier stays on screen before auto-dismissing, in ms. */
const DISPLAY_DURATION_MS: Record<AchievementTier, number> = {
  bronze: 3200,
  silver: 4200,
  gold: 5600
};

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  colorClass: string;
}

const CONFETTI_COLOR_CLASSES = ['confettiSky', 'confettiBloom', 'confettiCoin'];

@Component({
  selector: 'app-achievement-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievement-toast.html',
  styleUrl: './achievement-toast.css',
  host: {
    class: 'achievement-toast-host'
  }
})
export class AchievementToast {
  protected readonly achievementsService = inject(AchievementsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly current = computed(() => this.achievementsService.hypeQueue()[0] ?? null);

  protected readonly isGold = computed(() => this.current()?.tier === 'gold');

  protected readonly confetti = signal<ConfettiPiece[]>([]);

  private dismissHandle: ReturnType<typeof setTimeout> | null = null;
  private lastShownId: string | null = null;

  constructor() {
    effect(() => {
      const achievement = this.current();

      if (!achievement || achievement.id === this.lastShownId) {
        return;
      }
      this.lastShownId = achievement.id;

      if (this.dismissHandle !== null) {
        clearTimeout(this.dismissHandle);
      }

      if (achievement.tier === 'gold') {
        this.spawnConfetti();
      } else {
        this.confetti.set([]);
      }

      const duration = DISPLAY_DURATION_MS[achievement.tier];
      this.dismissHandle = setTimeout(() => {
        this.dismissHandle = null;
        this.lastShownId = null;
        this.achievementsService.dismissNextHype();
      }, duration);
    });

    this.destroyRef.onDestroy(() => {
      if (this.dismissHandle !== null) {
        clearTimeout(this.dismissHandle);
      }
    });
  }

  protected dismissNow(): void {
    if (this.dismissHandle !== null) {
      clearTimeout(this.dismissHandle);
      this.dismissHandle = null;
    }
    this.lastShownId = null;
    this.achievementsService.dismissNextHype();
  }

  private spawnConfetti(): void {
    const pieces: ConfettiPiece[] = Array.from({ length: 24 }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 220,
      duration: 900 + Math.random() * 500,
      drift: (Math.random() - 0.5) * 120,
      colorClass: CONFETTI_COLOR_CLASSES[index % CONFETTI_COLOR_CLASSES.length]
    }));
    this.confetti.set(pieces);
  }
}

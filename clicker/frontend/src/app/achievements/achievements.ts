import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AchievementsService } from '../core/services/achievements.service';

@Component({
  selector: 'app-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievements.html',
  styleUrl: './achievements.scss'
})
export class Achievements {
  protected readonly achievementsService = inject(AchievementsService);
}

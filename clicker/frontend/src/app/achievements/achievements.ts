import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AchievementsService } from '../core/services/achievements.service';

@Component({
  selector: 'app-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievements.html',
  styleUrl: './achievements.css'
})
export class Achievements {
  protected readonly achievementsService = inject(AchievementsService);
}

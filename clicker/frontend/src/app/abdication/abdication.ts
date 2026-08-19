import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-abdication',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe],
  templateUrl: './abdication.html',
  styleUrl: './abdication.scss'
})
export class Abdication {
  protected readonly gameState = inject(GameStateService);

  protected onAbdicate(): void {
    this.gameState.performAbdication();
  }
}

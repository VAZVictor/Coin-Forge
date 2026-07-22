import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-ascension',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe],
  templateUrl: './ascension.html',
  styleUrl: './ascension.css'
})
export class Ascension {
  protected readonly gameState = inject(GameStateService);

  protected onAscend(): void {
    this.gameState.performAscension();
  }
}

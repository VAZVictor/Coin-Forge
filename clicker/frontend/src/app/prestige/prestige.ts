import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-prestige',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe, DecimalPipe],
  templateUrl: './prestige.html',
  styleUrl: './prestige.css'
})
export class Prestige {
  protected readonly gameState = inject(GameStateService);

  protected onPrestige(): void {
    this.gameState.performPrestige();
  }
}

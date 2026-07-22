import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-reincarnation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe, DecimalPipe],
  templateUrl: './reincarnation.html',
  styleUrl: './reincarnation.css'
})
export class Reincarnation {
  protected readonly gameState = inject(GameStateService);

  protected onReincarnate(): void {
    this.gameState.performReincarnation();
  }
}

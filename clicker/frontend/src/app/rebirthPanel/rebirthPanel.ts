import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-rebirth-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe, DecimalPipe],
  templateUrl: './rebirthPanel.html',
  styleUrl: './rebirthPanel.scss'
})
export class RebirthPanel {
  protected readonly gameState = inject(GameStateService);

  protected onRebirth(): void {
    this.gameState.performRebirth();
  }
}

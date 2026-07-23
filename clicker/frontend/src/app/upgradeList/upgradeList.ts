import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

@Component({
  selector: 'app-upgrade-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe],
  templateUrl: './upgradeList.html',
  styleUrl: './upgradeList.css'
})
export class UpgradeList {
  protected readonly gameState = inject(GameStateService);

  protected getCost(id: string): number {
    const upgrade = this.gameState.upgrades().find(item => item.id === id);
    return upgrade ? this.gameState.getUpgradeCost(upgrade) : 0;
  }

  protected canAfford(id: string): boolean {
    const upgrade = this.gameState.upgrades().find(item => item.id === id);
    return upgrade ? this.gameState.canAffordUpgrade(upgrade) : false;
  }

  protected onBuy(id: string): void {
    this.gameState.buyUpgrade(id);
  }
}
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GameStateService } from '../core/services/gameState.service';
import { GameNumberPipe } from '../shared/pipes/gameNumber.pipe';

export type BuyAmount = 1 | 10 | 25 | 'max';

const BUY_AMOUNT_CYCLE: BuyAmount[] = [1, 10, 25, 'max'];

@Component({
  selector: 'app-upgrade-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameNumberPipe],
  templateUrl: './upgradeList.html',
  styleUrl: './upgradeList.css'
})
export class UpgradeList {
  protected readonly gameState = inject(GameStateService);

  protected readonly buyAmount = signal<BuyAmount>(1);

  protected readonly autoBuyEnabled = this.gameState.autoBuyEnabled;

  protected cycleBuyAmount(): void {
    const currentIndex = BUY_AMOUNT_CYCLE.indexOf(this.buyAmount());
    const nextIndex = (currentIndex + 1) % BUY_AMOUNT_CYCLE.length;
    this.buyAmount.set(BUY_AMOUNT_CYCLE[nextIndex]);
  }

  protected buyAmountLabel(): string {
    const amount = this.buyAmount();
    return amount === 'max' ? 'Max' : `x${amount}`;
  }

  private resolveAmount(id: string): number {
    const amount = this.buyAmount();
    if (amount !== 'max') return amount;

    const upgrade = this.gameState.upgrades().find(item => item.id === id);
    return upgrade ? this.gameState.getMaxAffordableCount(upgrade) : 0;
  }

  protected getCost(id: string): number {
    const upgrade = this.gameState.upgrades().find(item => item.id === id);
    if (!upgrade) return 0;

    const amount = this.resolveAmount(id);
    return amount > 0 ? this.gameState.getBulkCost(upgrade, amount) : this.gameState.getUpgradeCost(upgrade);
  }

  protected getAmountToBuy(id: string): number {
    return Math.max(1, this.resolveAmount(id));
  }

  protected canAfford(id: string): boolean {
    const upgrade = this.gameState.upgrades().find(item => item.id === id);
    if (!upgrade) return false;

    if (this.buyAmount() === 'max') {
      return this.gameState.getMaxAffordableCount(upgrade) > 0;
    }
    return this.gameState.canAffordUpgrade(upgrade);
  }

  protected onBuy(id: string): void {
    const amount = this.buyAmount();
    if (amount === 'max') {
      this.gameState.buyMaxUpgrade(id);
    } else {
      this.gameState.buyUpgrades(id, amount);
    }
  }

  protected onToggleAutoBuy(): void {
    this.gameState.toggleAutoBuy();
  }
}

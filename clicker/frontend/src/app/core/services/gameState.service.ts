import { Injectable, computed, signal } from '@angular/core';
import { UpgradeState } from '../models/upgrade.model';

const INITIAL_UPGRADES: UpgradeState[] = [
  {
    id: 'autoClicker',
    name: 'Auto Clicker',
    description: 'A small mechanical finger that clicks for you.',
    baseCost: 15,
    baseCps: 0.1,
    icon: 'touch_app',
    owned: 0
  },
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'Hires someone to click on your behalf.',
    baseCost: 100,
    baseCps: 1,
    icon: 'support_agent',
    owned: 0
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'A small workshop dedicated to coin production.',
    baseCost: 1100,
    baseCps: 8,
    icon: 'construction',
    owned: 0
  },
  {
    id: 'factory',
    name: 'Factory',
    description: 'Industrial scale coin manufacturing.',
    baseCost: 12000,
    baseCps: 47,
    icon: 'factory',
    owned: 0
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    description: 'Synthesizes coins at a molecular level.',
    baseCost: 130000,
    baseCps: 260,
    icon: 'science',
    owned: 0
  },
  {
    id: 'bank',
    name: 'Bank',
    description: 'Generates interest on your existing wealth.',
    baseCost: 1400000,
    baseCps: 1400,
    icon: 'account_balance',
    owned: 0
  }
];

const REBIRTH_THRESHOLD = 1e6;
const LOOP_INTERVAL_MS = 100;
const COST_SCALING = 1.15;

const COMBO_WINDOW_MS = 900;
const COMBO_CAP = 50;
const COMBO_MAX_BONUS = 1;

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  readonly coins = signal<number>(0);
  readonly clickPowerBase = signal<number>(1);
  readonly upgrades = signal<UpgradeState[]>(INITIAL_UPGRADES);

  readonly rebirthTokens = signal<number>(0);

  readonly rebirthMultiplier = computed(() => 1 + this.rebirthTokens() * 0.05);

  readonly comboCount = signal<number>(0);

  readonly comboProgress = computed(() => this.comboCount() / COMBO_CAP);

  readonly comboMultiplier = computed(() => 1 + this.comboProgress() * COMBO_MAX_BONUS);

  readonly baseCps = computed(() =>
    this.upgrades().reduce((sum, upgrade) => sum + upgrade.owned * upgrade.baseCps, 0)
  );

  readonly cps = computed(() => this.baseCps() * this.rebirthMultiplier());

  readonly clickPower = computed(
    () => this.clickPowerBase() * this.rebirthMultiplier() * this.comboMultiplier()
  );

  readonly isRebirthUnlocked = computed(() => this.coins() >= REBIRTH_THRESHOLD);

  readonly projectedRebirthTokens = computed(() => {
    const coinValue = this.coins();
    if (coinValue < REBIRTH_THRESHOLD) {
      return 0;
    }
    return Math.floor(Math.pow(coinValue, 0.4) / 1000);
  });

  private loopHandle: ReturnType<typeof setInterval> | null = null;
  private comboResetHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.startGameLoop();
  }

  private startGameLoop(): void {
    this.loopHandle = setInterval(() => {
      const gain = this.cps() / 10;
      if (gain > 0) {
        this.coins.update(current => current + gain);
      }
    }, LOOP_INTERVAL_MS);
  }

  stopGameLoop(): void {
    if (this.loopHandle !== null) {
      clearInterval(this.loopHandle);
      this.loopHandle = null;
    }
    if (this.comboResetHandle !== null) {
      clearTimeout(this.comboResetHandle);
      this.comboResetHandle = null;
    }
  }

  click(): number {
    this.registerComboClick();
    const gained = this.clickPower();
    this.coins.update(current => current + gained);
    return gained;
  }

  private registerComboClick(): void {
    this.comboCount.update(count => Math.min(count + 1, COMBO_CAP));

    if (this.comboResetHandle !== null) {
      clearTimeout(this.comboResetHandle);
    }

    this.comboResetHandle = setTimeout(() => {
      this.comboCount.set(0);
      this.comboResetHandle = null;
    }, COMBO_WINDOW_MS);
  }

  getUpgradeCost(upgrade: UpgradeState): number {
    return upgrade.baseCost * Math.pow(COST_SCALING, upgrade.owned);
  }

  canAffordUpgrade(upgrade: UpgradeState): boolean {
    return this.coins() >= this.getUpgradeCost(upgrade);
  }

  buyUpgrade(id: string): void {
    const target = this.upgrades().find(upgrade => upgrade.id === id);
    if (!target) {
      return;
    }

    const cost = this.getUpgradeCost(target);
    if (this.coins() < cost) {
      return;
    }

    this.coins.update(current => current - cost);
    this.upgrades.update(list =>
      list.map(upgrade =>
        upgrade.id === id ? { ...upgrade, owned: upgrade.owned + 1 } : upgrade
      )
    );
  }

  performRebirth(): void {
    if (!this.isRebirthUnlocked()) {
      return;
    }

    const tokensGained = this.projectedRebirthTokens();

    this.rebirthTokens.update(current => current + tokensGained);
    this.coins.set(0);
    this.upgrades.update(list => list.map(upgrade => ({ ...upgrade, owned: 0 })));
  }
}

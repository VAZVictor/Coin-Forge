import { Injectable, computed, signal } from '@angular/core';
import { UpgradeState } from '../models/upgrade.model';
import { GameSavePayload } from '../models/save.model';

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

const LOOP_INTERVAL_MS = 100;
const COST_SCALING = 1.15;

const COMBO_WINDOW_MS = 900;
const COMBO_CAP = 50;
const COMBO_MAX_BONUS = 1;

// Prestige layer unlock thresholds, taken directly from the design brief.
const REBIRTH_THRESHOLD = 1e6;
const PRESTIGE_THRESHOLD = 1e12;
const REINCARNATION_THRESHOLD = 1e20;
const ASCENSION_THRESHOLD = 1e35;
const ABDICATION_THRESHOLD = 1e60;

// Offline progress is capped so a save file left untouched for months
// cannot be used to skip years of production in one load.
const MAX_OFFLINE_SECONDS = 24 * 60 * 60;

/**
 * Reward formulas for layers 2 through 5 are not fully pinned down by the
 * design brief (only Rebirth's floor(coins^0.4 / 1000) is specified), so
 * these are original balancing choices calibrated so that reaching each
 * layer's unlock threshold yields a small, non zero reward, and going an
 * order of magnitude beyond it yields a modestly larger one. Each layer's
 * multiplier compounds on the ones below it, so exponents were kept small
 * and shrink at higher layers to avoid runaway values.
 */
function rewardFromCoins(coins: number, exponent: number, divisor: number): number {
  return Math.floor(Math.pow(coins, exponent) / divisor);
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  readonly coins = signal<number>(0);
  readonly clickPowerBase = signal<number>(1);
  readonly upgrades = signal<UpgradeState[]>(INITIAL_UPGRADES);

  readonly rebirthTokens = signal<number>(0);
  readonly worldShards = signal<number>(0);
  readonly souls = signal<number>(0);
  readonly divinity = signal<number>(0);
  readonly legacy = signal<number>(0);

  // Lifetime stats. These never reset, even across prestige layers, since
  // they exist purely to track achievements and total playtime progress.
  readonly totalClicksAllTime = signal<number>(0);
  readonly totalCoinsEarnedAllTime = signal<number>(0);
  readonly totalUpgradesPurchasedAllTime = signal<number>(0);
  readonly totalPlaytimeSeconds = signal<number>(0);
  readonly rebirthCount = signal<number>(0);
  readonly prestigeCount = signal<number>(0);
  readonly reincarnationCount = signal<number>(0);
  readonly ascensionCount = signal<number>(0);
  readonly abdicationCount = signal<number>(0);

  readonly comboCount = signal<number>(0);
  readonly comboProgress = computed(() => this.comboCount() / COMBO_CAP);
  readonly comboMultiplier = computed(() => 1 + this.comboProgress() * COMBO_MAX_BONUS);

  readonly rebirthMultiplier = computed(() => 1 + this.rebirthTokens() * 0.05);
  readonly shardMultiplier = computed(() => Math.pow(1.5, this.worldShards()));
  readonly soulMultiplier = computed(() => 1 + this.souls() * 0.25);
  readonly divinityMultiplier = computed(() => Math.pow(2, this.divinity()));
  readonly legacyMultiplier = computed(() => Math.pow(10, this.legacy()));

  // The combined multiplier from every prestige layer, applied to both
  // passive production and click power. Order does not affect the total
  // since every term is a product, but this mirrors the layer order.
  readonly prestigeMultiplier = computed(
    () =>
      this.rebirthMultiplier() *
      this.shardMultiplier() *
      this.soulMultiplier() *
      this.divinityMultiplier() *
      this.legacyMultiplier()
  );

  readonly baseCps = computed(() =>
    this.upgrades().reduce((sum, upgrade) => sum + upgrade.owned * upgrade.baseCps, 0)
  );

  readonly cps = computed(() => this.baseCps() * this.prestigeMultiplier());

  readonly clickPower = computed(
    () => this.clickPowerBase() * this.prestigeMultiplier() * this.comboMultiplier()
  );

  readonly isRebirthUnlocked = computed(() => this.coins() >= REBIRTH_THRESHOLD);
  readonly isPrestigeUnlocked = computed(() => this.coins() >= PRESTIGE_THRESHOLD);
  readonly isReincarnationUnlocked = computed(() => this.coins() >= REINCARNATION_THRESHOLD);
  readonly isAscensionUnlocked = computed(() => this.coins() >= ASCENSION_THRESHOLD);
  readonly isAbdicationUnlocked = computed(() => this.coins() >= ABDICATION_THRESHOLD);

  readonly projectedRebirthTokens = computed(() => {
    const coinValue = this.coins();
    if (coinValue < REBIRTH_THRESHOLD) {
      return 0;
    }
    return rewardFromCoins(coinValue, 0.4, 1000);
  });

  readonly projectedWorldShards = computed(() => {
    const coinValue = this.coins();
    if (coinValue < PRESTIGE_THRESHOLD) {
      return 0;
    }
    return rewardFromCoins(coinValue, 0.14, 50);
  });

  readonly projectedSouls = computed(() => {
    const coinValue = this.coins();
    if (coinValue < REINCARNATION_THRESHOLD) {
      return 0;
    }
    return rewardFromCoins(coinValue, 0.1, 20);
  });

  readonly projectedDivinity = computed(() => {
    const coinValue = this.coins();
    if (coinValue < ASCENSION_THRESHOLD) {
      return 0;
    }
    return rewardFromCoins(coinValue, 0.03, 5);
  });

  readonly projectedLegacy = computed(() => {
    const coinValue = this.coins();
    if (coinValue < ABDICATION_THRESHOLD) {
      return 0;
    }
    return rewardFromCoins(coinValue, 0.02, 5);
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
        this.addCoins(gain);
      }
      // Track active playtime: add 0.1 seconds (100ms) per loop iteration
      this.totalPlaytimeSeconds.update(current => current + (LOOP_INTERVAL_MS / 1000));
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

  private addCoins(amount: number): void {
    this.coins.update(current => current + amount);
    this.totalCoinsEarnedAllTime.update(current => current + amount);
  }

  click(): number {
    this.registerComboClick();
    const gained = this.clickPower();
    this.addCoins(gained);
    this.totalClicksAllTime.update(count => count + 1);
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
    this.totalUpgradesPurchasedAllTime.update(count => count + 1);
  }

  private resetBaseProgress(): void {
    this.coins.set(0);
    this.upgrades.update(list => list.map(upgrade => ({ ...upgrade, owned: 0 })));
  }

  performRebirth(): void {
    if (!this.isRebirthUnlocked()) {
      return;
    }

    const tokensGained = this.projectedRebirthTokens();

    this.rebirthTokens.update(current => current + tokensGained);
    this.resetBaseProgress();
    this.rebirthCount.update(count => count + 1);
  }

  performPrestige(): void {
    if (!this.isPrestigeUnlocked()) {
      return;
    }

    const shardsGained = this.projectedWorldShards();

    this.worldShards.update(current => current + shardsGained);
    this.rebirthTokens.set(0);
    this.resetBaseProgress();
    this.prestigeCount.update(count => count + 1);
  }

  performReincarnation(): void {
    if (!this.isReincarnationUnlocked()) {
      return;
    }

    const soulsGained = this.projectedSouls();

    this.souls.update(current => current + soulsGained);
    this.worldShards.set(0);
    this.rebirthTokens.set(0);
    this.resetBaseProgress();
    this.reincarnationCount.update(count => count + 1);
  }

  performAscension(): void {
    if (!this.isAscensionUnlocked()) {
      return;
    }

    const divinityGained = this.projectedDivinity();

    this.divinity.update(current => current + divinityGained);
    this.souls.set(0);
    this.worldShards.set(0);
    this.rebirthTokens.set(0);
    this.resetBaseProgress();
    this.ascensionCount.update(count => count + 1);
  }

  performAbdication(): void {
    if (!this.isAbdicationUnlocked()) {
      return;
    }

    const legacyGained = this.projectedLegacy();

    // Legacy is the one currency that is never reset, by anything,
    // including a future abdication. It only ever accumulates.
    this.legacy.update(current => current + legacyGained);
    this.divinity.set(0);
    this.souls.set(0);
    this.worldShards.set(0);
    this.rebirthTokens.set(0);
    this.resetBaseProgress();
    this.abdicationCount.update(count => count + 1);
  }

  /** Applies passive production earned while the tab or app was closed. */
  applyOfflineProgress(elapsedSeconds: number): number {
    const cappedSeconds = Math.max(0, Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS));
    const gained = this.cps() * cappedSeconds;
    if (gained > 0) {
      this.addCoins(gained);
    }
    return gained;
  }

    serializeState(): GameSavePayload {
    return {
      coins: this.coins(),
      upgrades: this.upgrades().map(upgrade => ({ id: upgrade.id, owned: upgrade.owned })),
      rebirthTokens: this.rebirthTokens(),
      worldShards: this.worldShards(),
      souls: this.souls(),
      divinity: this.divinity(),
      legacy: this.legacy(),
      totalClicksAllTime: this.totalClicksAllTime(),
      totalCoinsEarnedAllTime: this.totalCoinsEarnedAllTime(),
      totalUpgradesPurchasedAllTime: this.totalUpgradesPurchasedAllTime(),
      totalPlaytimeSeconds: this.totalPlaytimeSeconds(),
      rebirthCount: this.rebirthCount(),
      prestigeCount: this.prestigeCount(),
      reincarnationCount: this.reincarnationCount(),
      ascensionCount: this.ascensionCount(),
      abdicationCount: this.abdicationCount()
    };
  }

    loadState(payload: GameSavePayload): void {
    this.coins.set(payload.coins);
    this.upgrades.update(list =>
      list.map(upgrade => {
        const saved = payload.upgrades.find(entry => entry.id === upgrade.id);
        return saved ? { ...upgrade, owned: saved.owned } : upgrade;
      })
    );
    this.rebirthTokens.set(payload.rebirthTokens);
    this.worldShards.set(payload.worldShards);
    this.souls.set(payload.souls);
    this.divinity.set(payload.divinity);
    this.legacy.set(payload.legacy);
    this.totalClicksAllTime.set(payload.totalClicksAllTime);
    this.totalCoinsEarnedAllTime.set(payload.totalCoinsEarnedAllTime);
    this.totalUpgradesPurchasedAllTime.set(payload.totalUpgradesPurchasedAllTime);
    this.totalPlaytimeSeconds.set(payload.totalPlaytimeSeconds ?? 0);
    this.rebirthCount.set(payload.rebirthCount);
    this.prestigeCount.set(payload.prestigeCount);
    this.reincarnationCount.set(payload.reincarnationCount);
    this.ascensionCount.set(payload.ascensionCount);
    this.abdicationCount.set(payload.abdicationCount);
  }
}

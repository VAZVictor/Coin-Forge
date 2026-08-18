import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GameStateService } from './gameState.service';
import { AchievementDefinition } from '../models/achievement.model';

const DEFINITIONS: AchievementDefinition[] = [
  // Clicks
  { id: 'firstClick', name: 'First Click', description: 'Click the button once.', icon: 'touch_app', tier: 'bronze' },
  { id: 'clickNovice', name: 'Click Novice', description: 'Click the button 100 times.', icon: 'ads_click', tier: 'bronze' },
  { id: 'clickMaster', name: 'Click Master', description: 'Click the button 10,000 times.', icon: 'bolt', tier: 'silver' },
  { id: 'ripMouse', name: 'RIP Mouse', description: 'Click the button 1,000,000 times. Your mouse is crying.', icon: 'mouse', tier: 'gold' },

  // Coins
  { id: 'firstFortune', name: 'First Fortune', description: 'Earn 1,000 coins in total.', icon: 'paid', tier: 'bronze' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 1,000,000 coins in total.', icon: 'account_balance_wallet', tier: 'bronze' },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn 1,000,000,000 coins in total.', icon: 'diamond', tier: 'silver' },
  { id: 'sapceBaron', name: 'Space Baron', description: 'Earn 1,000,000,000,000 coins in total. You are now the richest Person on the Planet (Cannot use the actual name for legal reasons)', icon: 'savings', tier: 'gold' },
  { id: 'nice', name: 'Nice.', description: 'Earn 69,420 coins in total. Nice.', icon: 'sentiment_satisfied', tier: 'bronze' },
  { id: 'numberGoUp', name: 'Number Go Up', description: 'Earn 1,000,000,000,000,000 coins in total. The number went up.', icon: 'trending_up', tier: 'gold' },
  { id: 'existentialDread', name: 'Existential Dread', description: 'Earn 1e50 coins. You have more money than atoms in the universe. What now?', icon: 'cloud', tier: 'gold' },

  // Upgrades
  { id: 'firstUpgrade', name: 'First Upgrade', description: 'Buy your first upgrade.', icon: 'upgrade', tier: 'bronze' },
  { id: 'upgradeEnthusiast', name: 'Upgrade Enthusiast', description: 'Buy 50 upgrades in total.', icon: 'construction', tier: 'bronze' },
  { id: 'upgradeTycoon', name: 'Upgrade Tycoon', description: 'Buy 200 upgrades in total.', icon: 'factory', tier: 'silver' },
  { id: 'upgradeBeast', name: 'Upgrade Beast', description: 'Buy 1,000 upgrades in total.', icon: 'pets', tier: 'gold' },
  { id: 'hodl', name: 'HODL', description: 'Reach 1,000,000 current coins without buying a single upgrade.', icon: 'shield', tier: 'gold' },

  // Resets (Rebirth, Prestige, etc.)
  { id: 'reborn', name: 'Reborn', description: 'Perform your first Rebirth.', icon: 'autorenew', tier: 'bronze' },
  { id: 'worldBreaker', name: 'World Breaker', description: 'Perform your first Prestige.', icon: 'public_off', tier: 'silver' },
  { id: 'soulCollector', name: 'Soul Collector', description: 'Perform your first Reincarnation.', icon: 'auto_awesome', tier: 'silver' },
  { id: 'divineBeing', name: 'Divine Being', description: 'Perform your first Ascension.', icon: 'brightness_7', tier: 'silver' },
  { id: 'theAbdicator', name: 'The Abdicator', description: 'Perform your first Abdication.', icon: 'workspace_premium', tier: 'gold' },
  { id: 'isThisStillFun', name: 'Is This Still Fun?', description: 'Perform 25 total resets. Are you still having fun?', icon: 'psychology', tier: 'gold' },
  { id: 'whyAreYouLikeThis', name: 'Why Are You Like This?', description: 'Perform 100 total resets. Seek help.', icon: 'question_mark', tier: 'gold' },

  // Time / Meta
  { id: 'touchGrass', name: 'Touch Grass', description: 'Play the game for 10 hours. The grass outside is very green.', icon: 'park', tier: 'silver' }
];

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  private readonly gameState = inject(GameStateService);

  private readonly unlockChecks: Record<string, () => boolean> = {
    // Clicks
    firstClick: () => this.gameState.totalClicksAllTime() >= 1,
    clickNovice: () => this.gameState.totalClicksAllTime() >= 100,
    clickMaster: () => this.gameState.totalClicksAllTime() >= 10000,
    ripMouse: () => this.gameState.totalClicksAllTime() >= 1_000_000,

    // Coins
    firstFortune: () => this.gameState.totalCoinsEarnedAllTime() >= 1000,
    millionaire: () => this.gameState.totalCoinsEarnedAllTime() >= 1e6,
    billionaire: () => this.gameState.totalCoinsEarnedAllTime() >= 1e9,
    spaceBaron: () => this.gameState.totalCoinsEarnedAllTime() >= 1e12,
    nice: () => this.gameState.totalCoinsEarnedAllTime() >= 69_420,
    numberGoUp: () => this.gameState.totalCoinsEarnedAllTime() >= 1e15,
    existentialDread: () => this.gameState.totalCoinsEarnedAllTime() >= 1e50,

    // Upgrades
    firstUpgrade: () => this.gameState.totalUpgradesPurchasedAllTime() >= 1,
    upgradeEnthusiast: () => this.gameState.totalUpgradesPurchasedAllTime() >= 50,
    upgradeTycoon: () => this.gameState.totalUpgradesPurchasedAllTime() >= 200,
    upgradeBeast: () => this.gameState.totalUpgradesPurchasedAllTime() >= 1000,
    hodl: () => this.gameState.coins() >= 1_000_000 && this.gameState.totalUpgradesPurchasedAllTime() === 0,

    // Resets
    reborn: () => this.gameState.rebirthCount() >= 1,
    worldBreaker: () => this.gameState.prestigeCount() >= 1,
    soulCollector: () => this.gameState.reincarnationCount() >= 1,
    divineBeing: () => this.gameState.ascensionCount() >= 1,
    theAbdicator: () => this.gameState.abdicationCount() >= 1,
    isThisStillFun: () => this.getTotalResets() >= 25,
    whyAreYouLikeThis: () => this.getTotalResets() >= 100,

    // Time / Meta
    touchGrass: () => this.gameState.totalPlaytimeSeconds() >= (10 * 60 * 60)
  };

  private getTotalResets(): number {
    return (
      this.gameState.rebirthCount() +
      this.gameState.prestigeCount() +
      this.gameState.reincarnationCount() +
      this.gameState.ascensionCount() +
      this.gameState.abdicationCount()
    );
  }

  readonly achievements = computed(() =>
    DEFINITIONS.map(definition => ({
      ...definition,
      unlocked: this.unlockChecks[definition.id]()
    }))
  );

  readonly unlockedCount = computed(
    () => this.achievements().filter(achievement => achievement.unlocked).length
  );

  readonly totalCount = DEFINITIONS.length;

  // --- Hype / toast queue ---------------------------------------------
  // Achievements the player has unlocked at least once, so we only ever
  // hype an id the first time it flips true. Seeded silently from a
  // loaded save (see the `hasSeeded` gate below) so old saves don't spawn
  // a toast avalanche on login.
  private readonly seenUnlockedIds = new Set<string>();
  private hasSeeded = false;

  /** Queue of unlocks waiting to be shown, oldest first. */
  readonly hypeQueue = signal<AchievementDefinition[]>([]);

  constructor() {
    effect(() => {
      const current = this.achievements();
      const saveResolved = this.gameState.saveResolved();
      const newlyUnlocked: AchievementDefinition[] = [];

      for (const achievement of current) {
        if (achievement.unlocked && !this.seenUnlockedIds.has(achievement.id)) {
          this.seenUnlockedIds.add(achievement.id);
          if (this.hasSeeded) {
            newlyUnlocked.push(achievement);
          }
        }
      }

      if (saveResolved) {
        this.hasSeeded = true;
      }

      if (newlyUnlocked.length > 0) {
        this.hypeQueue.update(queue => [...queue, ...newlyUnlocked]);
      }
    });
  }

  /** Called by the toast UI once it's done showing the front of the queue. */
  dismissNextHype(): void {
    this.hypeQueue.update(queue => queue.slice(1));
  }
}
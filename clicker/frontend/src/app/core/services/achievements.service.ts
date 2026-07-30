import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from './gameState.service';
import { AchievementDefinition } from '../models/achievement.model';

const DEFINITIONS: AchievementDefinition[] = [
  // Clicks
  { id: 'firstClick', name: 'First Click', description: 'Click the button once.', icon: 'touch_app' },
  { id: 'clickNovice', name: 'Click Novice', description: 'Click the button 100 times.', icon: 'ads_click' },
  { id: 'clickMaster', name: 'Click Master', description: 'Click the button 10,000 times.', icon: 'bolt' },
  { id: 'ripMouse', name: 'RIP Mouse', description: 'Click the button 1,000,000 times. Your mouse is crying.', icon: 'mouse' },

  // Coins
  { id: 'firstFortune', name: 'First Fortune', description: 'Earn 1,000 coins in total.', icon: 'paid' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 1,000,000 coins in total.', icon: 'account_balance_wallet' },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn 1,000,000,000 coins in total.', icon: 'diamond' },
  { id: 'elonMusk', name: 'Elon Musk', description: 'Earn 1,000,000,000,000 coins in total. You are now the richest Person on the Planet', icon: 'savings' },
  { id: 'nice', name: 'Nice.', description: 'Earn 69,420 coins in total. Nice.', icon: 'sentiment_satisfied' },
  { id: 'numberGoUp', name: 'Number Go Up', description: 'Earn 1,000,000,000,000,000 coins in total. The number went up.', icon: 'trending_up' },
  { id: 'existentialDread', name: 'Existential Dread', description: 'Earn 1e50 coins. You have more money than atoms in the universe. What now?', icon: 'cloud' },

  // Upgrades
  { id: 'firstUpgrade', name: 'First Upgrade', description: 'Buy your first upgrade.', icon: 'upgrade' },
  { id: 'upgradeEnthusiast', name: 'Upgrade Enthusiast', description: 'Buy 50 upgrades in total.', icon: 'construction' },
  { id: 'upgradeTycoon', name: 'Upgrade Tycoon', description: 'Buy 200 upgrades in total.', icon: 'factory' },
  { id: 'upgradeBeast', name: 'Upgrade Beast', description: 'Buy 1,000 upgrades in total.', icon: 'pets' },
  { id: 'hodl', name: 'HODL', description: 'Reach 1,000,000 current coins without buying a single upgrade.', icon: 'shield' },

  // Resets (Rebirth, Prestige, etc.)
  { id: 'reborn', name: 'Reborn', description: 'Perform your first Rebirth.', icon: 'autorenew' },
  { id: 'worldBreaker', name: 'World Breaker', description: 'Perform your first Prestige.', icon: 'public_off' },
  { id: 'soulCollector', name: 'Soul Collector', description: 'Perform your first Reincarnation.', icon: 'auto_awesome' },
  { id: 'divineBeing', name: 'Divine Being', description: 'Perform your first Ascension.', icon: 'brightness_7' },
  { id: 'theAbdicator', name: 'The Abdicator', description: 'Perform your first Abdication.', icon: 'workspace_premium' },
  { id: 'isThisStillFun', name: 'Is This Still Fun?', description: 'Perform 25 total resets. Are you still having fun?', icon: 'psychology' },
  { id: 'whyAreYouLikeThis', name: 'Why Are You Like This?', description: 'Perform 100 total resets. Seek help.', icon: 'question_mark' },

  // Time / Meta
  { id: 'touchGrass', name: 'Touch Grass', description: 'Play the game for 10 hours. The grass outside is very green.', icon: 'park' }
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
    elonMusk: () => this.gameState.totalCoinsEarnedAllTime() >= 1e12,
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
}
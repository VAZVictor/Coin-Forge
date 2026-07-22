import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from './gameState.service';
import { AchievementDefinition } from '../models/achievement.model';

const DEFINITIONS: AchievementDefinition[] = [
  { id: 'firstClick', name: 'First Click', description: 'Click the button once.', icon: 'touch_app' },
  { id: 'clickNovice', name: 'Click Novice', description: 'Click the button 100 times.', icon: 'ads_click' },
  { id: 'clickMaster', name: 'Click Master', description: 'Click the button 10,000 times.', icon: 'bolt' },
  { id: 'firstFortune', name: 'First Fortune', description: 'Earn 1,000 coins in total.', icon: 'paid' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 1,000,000 coins in total.', icon: 'account_balance_wallet' },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn 1,000,000,000 coins in total.', icon: 'diamond' },
  { id: 'firstUpgrade', name: 'First Upgrade', description: 'Buy your first upgrade.', icon: 'upgrade' },
  { id: 'upgradeEnthusiast', name: 'Upgrade Enthusiast', description: 'Buy 50 upgrades in total.', icon: 'construction' },
  { id: 'upgradeTycoon', name: 'Upgrade Tycoon', description: 'Buy 200 upgrades in total.', icon: 'factory' },
  { id: 'reborn', name: 'Reborn', description: 'Perform your first Rebirth.', icon: 'autorenew' },
  { id: 'worldBreaker', name: 'World Breaker', description: 'Perform your first Prestige.', icon: 'public_off' },
  { id: 'soulCollector', name: 'Soul Collector', description: 'Perform your first Reincarnation.', icon: 'auto_awesome' },
  { id: 'divineBeing', name: 'Divine Being', description: 'Perform your first Ascension.', icon: 'brightness_7' },
  { id: 'theAbdicator', name: 'The Abdicator', description: 'Perform your first Abdication.', icon: 'workspace_premium' }
];

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  private readonly gameState = inject(GameStateService);

  private readonly unlockChecks: Record<string, () => boolean> = {
    firstClick: () => this.gameState.totalClicksAllTime() >= 1,
    clickNovice: () => this.gameState.totalClicksAllTime() >= 100,
    clickMaster: () => this.gameState.totalClicksAllTime() >= 10000,
    firstFortune: () => this.gameState.totalCoinsEarnedAllTime() >= 1000,
    millionaire: () => this.gameState.totalCoinsEarnedAllTime() >= 1e6,
    billionaire: () => this.gameState.totalCoinsEarnedAllTime() >= 1e9,
    firstUpgrade: () => this.gameState.totalUpgradesPurchasedAllTime() >= 1,
    upgradeEnthusiast: () => this.gameState.totalUpgradesPurchasedAllTime() >= 50,
    upgradeTycoon: () => this.gameState.totalUpgradesPurchasedAllTime() >= 200,
    reborn: () => this.gameState.rebirthCount() >= 1,
    worldBreaker: () => this.gameState.prestigeCount() >= 1,
    soulCollector: () => this.gameState.reincarnationCount() >= 1,
    divineBeing: () => this.gameState.ascensionCount() >= 1,
    theAbdicator: () => this.gameState.abdicationCount() >= 1
  };

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

/**
 * Difficulty tier, used purely to scale how big a deal the unlock toast
 * makes of itself - bronze gets a quiet slide-in, gold gets the full
 * screen-flash-and-confetti treatment.
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
}

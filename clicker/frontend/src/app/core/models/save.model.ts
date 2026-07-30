export interface UpgradeSaveEntry {
  id: string;
  owned: number;
}

export interface GameSavePayload {
  coins: number;
  upgrades: UpgradeSaveEntry[];
  totalPlaytimeSeconds: number;
  rebirthTokens: number;
  worldShards: number;
  souls: number;
  divinity: number;
  legacy: number;
  totalClicksAllTime: number;
  totalCoinsEarnedAllTime: number;
  totalUpgradesPurchasedAllTime: number;
  rebirthCount: number;
  prestigeCount: number;
  reincarnationCount: number;
  ascensionCount: number;
  abdicationCount: number;
}

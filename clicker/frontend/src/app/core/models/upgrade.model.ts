export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseCps: number;
  icon: string;
}

export interface UpgradeState extends UpgradeDefinition {
  owned: number;
}

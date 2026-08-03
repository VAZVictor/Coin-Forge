export type TaskConditionType = 'rebirthWithoutUpgrade' | 'rebirthWithNoUpgrades';

export interface TaskDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    conditionType: TaskConditionType;
    targetUpgradeId?: string; // only for 'rebirthWithoutUpgrade'
    bonusPercent: number;     // 0.10 = +10%, stacks each time completed again
}

export interface TaskProgress extends TaskDefinition {
    timesCompleted: number;
    currentBonusPercent: number;
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
    { id: 'frugalRebirthAutoClicker', name: 'Frugal Rebirth', description: 'Rebirth without ever buying an Auto Clicker this run.', icon: 'touch_app', conditionType: 'rebirthWithoutUpgrade', targetUpgradeId: 'autoClicker', bonusPercent: 0.10 },
    { id: 'soloActAssistant', name: 'Solo Act', description: 'Rebirth without ever hiring an Assistant this run.', icon: 'support_agent', conditionType: 'rebirthWithoutUpgrade', targetUpgradeId: 'assistant', bonusPercent: 0.10 },
    { id: 'workshopBoycott', name: 'Workshop Boycott', description: 'Rebirth without ever building a Workshop this run.', icon: 'construction', conditionType: 'rebirthWithoutUpgrade', targetUpgradeId: 'workshop', bonusPercent: 0.08 },
    { id: 'trueMinimalist', name: 'True Minimalist', description: 'Rebirth without buying a single upgrade of any kind this run.', icon: 'self_improvement', conditionType: 'rebirthWithNoUpgrades', bonusPercent: 0.05 }
];
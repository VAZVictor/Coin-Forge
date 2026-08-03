import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from './gameState.service';
import { TASK_DEFINITIONS, TaskProgress } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
    private readonly gameState = inject(GameStateService);

    readonly tasks = computed<TaskProgress[]>(() => {
        const completions = this.gameState.taskCompletions();
        return TASK_DEFINITIONS.map(definition => {
            const timesCompleted = completions[definition.id] ?? 0;
            return { ...definition, timesCompleted, currentBonusPercent: timesCompleted * definition.bonusPercent * 100 };
        });
    });

    readonly completedCount = computed(() => this.tasks().filter(t => t.timesCompleted > 0).length);
    readonly totalCount = TASK_DEFINITIONS.length;
}
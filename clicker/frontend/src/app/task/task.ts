import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TasksService } from '../core/services/task.service';

@Component({
  selector: 'app-task',
  imports: [DecimalPipe],
  templateUrl: './task.html',
  styleUrl: './task.css',
})
export class Task {
  protected readonly tasksService = inject(TasksService);
}

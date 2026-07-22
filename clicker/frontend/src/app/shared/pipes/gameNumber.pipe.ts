import { Pipe, PipeTransform, inject } from '@angular/core';
import { NumberFormatService } from '../../core/services/numberFormat.service';

@Pipe({
  name: 'gameNumber'
})
export class GameNumberPipe implements PipeTransform {
  private readonly numberFormat = inject(NumberFormatService);

  transform(value: number): string {
    return this.numberFormat.format(value);
  }
}

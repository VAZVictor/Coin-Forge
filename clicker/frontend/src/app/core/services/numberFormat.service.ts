import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberFormatService {
  private readonly suffixes: readonly string[] = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'
  ];

  format(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    const absValue = Math.abs(value);
    const sign = value < 0 ? '−' : '';

    if (absValue < 1000) {
      return sign + Math.floor(absValue).toString();
    }

    const tier = Math.floor(Math.log10(absValue) / 3);

    if (tier >= this.suffixes.length) {
      return sign + absValue.toExponential(2);
    }

    const scaled = absValue / Math.pow(1000, tier);
    const suffix = this.suffixes[tier];

    return sign + scaled.toFixed(2) + suffix;
  }

  formatCompactInteger(value: number): string {
    return this.format(Math.floor(value));
  }
}

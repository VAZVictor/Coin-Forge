import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Clicker } from './clicker/clicker';
import { UpgradeList } from './upgradeList/upgradeList';
import { RebirthPanel } from './rebirthPanel/rebirthPanel';
import { Prestige } from './prestige/prestige';
import { Reincarnation } from './reincarnation/reincarnation';
import { Ascension } from './ascension/ascension';
import { Abdication } from './abdication/abdication';
import { Achievements } from './achievements/achievements';
import { SaveService } from './core/services/save.service';
import { NumberFormatService } from './core/services/numberFormat.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Clicker,
    UpgradeList,
    RebirthPanel,
    Prestige,
    Reincarnation,
    Ascension,
    Abdication,
    Achievements
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly saveService = inject(SaveService);
  private readonly numberFormat = inject(NumberFormatService);

  protected readonly offlineGainDisplay = computed(() => {
    const gain = this.saveService.lastOfflineGain();
    return gain === null ? null : this.numberFormat.format(gain);
  });

  protected dismissOfflineBanner(): void {
    this.saveService.dismissOfflineBanner();
  }
}
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Clicker } from '../clicker/clicker';
import { UpgradeList } from '../upgradeList/upgradeList';
import { RebirthPanel } from '../rebirthPanel/rebirthPanel';
import { Prestige } from '../prestige/prestige';
import { Reincarnation } from '../reincarnation/reincarnation';
import { Ascension } from '../ascension/ascension';
import { Abdication } from '../abdication/abdication';
import { Achievements } from '../achievements/achievements';
import { SaveService } from '../core/services/save.service';
import { AuthService } from '../core/services/auth.service';
import { NumberFormatService } from '../core/services/numberFormat.service';

@Component({
  selector: 'app-game-layout',
  standalone: true,
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
  templateUrl: './game-layout.html',
  styleUrls: ['./game-layout.css']
})
export class GameLayout {
  protected readonly authService = inject(AuthService);
  protected readonly saveService = inject(SaveService);
  private readonly numberFormat = inject(NumberFormatService);
  private readonly router = inject(Router);

  protected readonly offlineGainDisplay = computed(() => {
    const gain = this.saveService.lastOfflineGain();
    return gain === null ? null : this.numberFormat.format(gain);
  });

  protected onLogOut(): void {
    void this.authService.logOut().finally(() => {
      void this.router.navigate(['/login']);
    });
  }

  protected dismissOfflineBanner(): void {
    this.saveService.dismissOfflineBanner();
  }
}

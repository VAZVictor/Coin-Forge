import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
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
    RouterOutlet,
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
  protected readonly title = signal('frontend');
  showLogin = true;
  protected readonly saveService = inject(SaveService);
  private readonly numberFormat = inject(NumberFormatService);

  constructor(private router: Router) {
    this.showLogin = this.shouldShowLogin(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showLogin = this.shouldShowLogin(event.url);
    });
  }

  private shouldShowLogin(url: string): boolean {
    return url.includes('/login') || url === '/';
  }

  protected readonly offlineGainDisplay = computed(() => {
    const gain = this.saveService.lastOfflineGain();
    return gain === null ? null : this.numberFormat.format(gain);
  });

  protected dismissOfflineBanner(): void {
    this.saveService.dismissOfflineBanner();
  }
}
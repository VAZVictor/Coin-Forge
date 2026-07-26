import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Clicker } from './clicker/clicker';
import { UpgradeList } from './upgradeList/upgradeList';
import { RebirthPanel } from './rebirthPanel/rebirthPanel';
import { Prestige } from './prestige/prestige';
import { Reincarnation } from './reincarnation/reincarnation';
import { Ascension } from './ascension/ascension';
import { Abdication } from './abdication/abdication';
import { Achievements } from './achievements/achievements';
import { SaveService } from './core/services/save.service';
import { AuthService } from './core/services/auth.service';
import { NumberFormatService } from './core/services/numberFormat.service';
import { Login } from './login/login';
import { ForgotPassword } from './login/forgot-password/forgot-password';

type AuthView = 'login' | 'forgotPassword';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Login,
    ForgotPassword,
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
  protected readonly authService = inject(AuthService);
  protected readonly saveService = inject(SaveService);
  private readonly numberFormat = inject(NumberFormatService);

  protected readonly authView = signal<AuthView>('login');

  protected showForgotPassword(): void {
    this.authView.set('forgotPassword');
  }

  protected showLogin(): void {
    this.authView.set('login');
  }

  protected onLogOut(): void {
    void this.authService.logOut();
  }

  protected readonly offlineGainDisplay = computed(() => {
    const gain = this.saveService.lastOfflineGain();
    return gain === null ? null : this.numberFormat.format(gain);
  });

  protected dismissOfflineBanner(): void {
    this.saveService.dismissOfflineBanner();
  }
}

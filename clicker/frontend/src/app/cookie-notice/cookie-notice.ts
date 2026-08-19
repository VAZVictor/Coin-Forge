import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

const DISMISS_STORAGE_KEY = 'coinforge.cookieNoticeDismissed';

@Component({
  selector: 'app-cookie-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './cookie-notice.html',
  styleUrl: './cookie-notice.css'
})
export class CookieNotice {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly visible = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      const alreadyDismissed = localStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
      this.visible.set(!alreadyDismissed);
    }
  }

  protected dismiss(): void {
    this.visible.set(false);
    if (this.isBrowser) {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    }
  }
}
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GameStateService } from './gameState.service';
import { AuthService } from './auth.service';
import { GameSavePayload } from '../models/save.model';
import { BACKEND_BASE_URL } from './backend-config';

const AUTOSAVE_INTERVAL_MS = 10000;

interface SaveApiGetResponse {
  found: boolean;
  payload?: GameSavePayload;
  updatedAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SaveService {
  private readonly http = inject(HttpClient);
  private readonly gameState = inject(GameStateService);
  private readonly authService = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Coins gained while the app was closed, shown once as a welcome back banner. */
  readonly lastOfflineGain = signal<number | null>(null);
  readonly isConnectedToServer = signal<boolean>(true);

  private autosaveHandle: ReturnType<typeof setInterval> | null = null;
  private hasLoadedForCurrentSession = false;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    // Saves are now tied to an account, so there is nothing to load or
    // autosave until AuthService reports a logged-in user. This effect
    // starts the save cycle the moment that becomes true (right after
    // login/signup, or immediately if a session cookie was already valid
    // on page load) and stops it again on logout.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.handleSessionStart();
      } else {
        this.handleSessionEnd();
      }
    });

    window.addEventListener('beforeunload', () => this.saveOnUnload());
  }

  private async handleSessionStart(): Promise<void> {
    if (this.hasLoadedForCurrentSession) {
      return;
    }
    this.hasLoadedForCurrentSession = true;
    await this.loadFromServer();
    this.startAutosave();
  }

  private handleSessionEnd(): void {
    this.hasLoadedForCurrentSession = false;
    this.stopAutosave();
  }

  private async loadFromServer(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<SaveApiGetResponse>(`${BACKEND_BASE_URL}/api/save`, {
          withCredentials: true
        })
      );

      if (response.found && response.payload && response.updatedAt) {
        this.gameState.loadState(response.payload);

        const elapsedSeconds = (Date.now() - response.updatedAt) / 1000;
        const gained = this.gameState.applyOfflineProgress(elapsedSeconds);

        if (gained > 0) {
          this.lastOfflineGain.set(gained);
        }
      }

      this.isConnectedToServer.set(true);
    } catch {
      // No save yet for this account, or the backend is not running.
      // Either way, continue with a fresh game rather than blocking the app.
      this.isConnectedToServer.set(false);
    } finally {
      // Marks the load attempt as resolved either way, so AchievementsService
      // knows any achievements already true at this point came from the save
      // (or a fresh 0 state) rather than something the player just did.
      this.gameState.markSaveResolved();
    }
  }

  private startAutosave(): void {
    this.autosaveHandle = setInterval(() => {
      void this.saveToServer();
    }, AUTOSAVE_INTERVAL_MS);
  }

  private async saveToServer(): Promise<void> {
    const payload = this.gameState.serializeState();

    try {
      await firstValueFrom(
        this.http.post(
          `${BACKEND_BASE_URL}/api/save`,
          { payload, updatedAt: Date.now() },
          { withCredentials: true }
        )
      );
      this.isConnectedToServer.set(true);
    } catch {
      this.isConnectedToServer.set(false);
    }
  }

  private saveOnUnload(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const payload = this.gameState.serializeState();
    const body = JSON.stringify({ payload, updatedAt: Date.now() });

    // sendBeacon is used here instead of HttpClient because a normal request
    // can be cancelled by the browser mid flight once the page starts
    // unloading, while a beacon is guaranteed to be delivered. Note that
    // sendBeacon always sends cookies for same-origin requests, and does so
    // for cross-origin ones too as long as the browser already holds the
    // cookie, which it does here since login set it.
    navigator.sendBeacon(
      `${BACKEND_BASE_URL}/api/save`,
      new Blob([body], { type: 'application/json' })
    );
  }

  dismissOfflineBanner(): void {
    this.lastOfflineGain.set(null);
  }

  stopAutosave(): void {
    if (this.autosaveHandle !== null) {
      clearInterval(this.autosaveHandle);
      this.autosaveHandle = null;
    }
  }
}

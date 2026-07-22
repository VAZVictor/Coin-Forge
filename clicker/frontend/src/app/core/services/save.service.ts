import { Injectable, afterNextRender, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GameStateService } from './gameState.service';
import { GameSavePayload } from '../models/save.model';

/**
 * The Express + sql.js save API lives in the separate "backend" workspace
 * (see clicker/backend/src/server.ts and db.ts), started on its own port.
 * Point this at wherever that server is actually reachable in your setup;
 * for local development that is the backend's `npm start` on port 4000.
 */
const SAVE_API_BASE_URL = 'http://localhost:4000';
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

  /** Coins gained while the app was closed, shown once as a welcome back banner. */
  readonly lastOfflineGain = signal<number | null>(null);
  readonly isConnectedToServer = signal<boolean>(true);

  private autosaveHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // afterNextRender guarantees this only runs in the browser, never during
    // SSR, since talking to a save API and listening for window events both
    // require a real browser environment.
    afterNextRender(() => {
      void this.initialize();
    });
  }

  private async initialize(): Promise<void> {
    await this.loadFromServer();
    this.startAutosave();
    window.addEventListener('beforeunload', () => this.saveOnUnload());
  }

  private async loadFromServer(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<SaveApiGetResponse>(`${SAVE_API_BASE_URL}/api/save`)
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
      // No save yet, or the backend is not running. Either way, continue
      // with a fresh game rather than blocking the app.
      this.isConnectedToServer.set(false);
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
        this.http.post(`${SAVE_API_BASE_URL}/api/save`, {
          payload,
          updatedAt: Date.now()
        })
      );
      this.isConnectedToServer.set(true);
    } catch {
      this.isConnectedToServer.set(false);
    }
  }

  private saveOnUnload(): void {
    const payload = this.gameState.serializeState();
    const body = JSON.stringify({ payload, updatedAt: Date.now() });

    // sendBeacon is used here instead of HttpClient because a normal request
    // can be cancelled by the browser mid flight once the page starts
    // unloading, while a beacon is guaranteed to be delivered.
    navigator.sendBeacon(
      `${SAVE_API_BASE_URL}/api/save`,
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

import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResult, AuthUser } from '../models/auth.model';
import { BACKEND_BASE_URL } from './backend-config';

interface AuthUserResponse {
  user: AuthUser;
}

interface MessageResponse {
  message: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: string; message?: string } | null;

    if (body && typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }

    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
  }
  return fallback;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly currentUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** True until the initial "am I already logged in" check finishes. */
  readonly isCheckingSession = signal(true);

  constructor() {
    if (this.isBrowser) {
      void this.fetchCurrentUser();
    } else {
      this.isCheckingSession.set(false);
    }
  }

  private async fetchCurrentUser(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<AuthUserResponse>(`${BACKEND_BASE_URL}/api/auth/me`, {
          withCredentials: true
        })
      );
      this.currentUser.set(response.user);
    } catch {
      this.currentUser.set(null);
    } finally {
      this.isCheckingSession.set(false);
    }
  }

    async signUp(email: string, password: string, rememberMe: boolean, referralCode?: string): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthUserResponse>(
          `${BACKEND_BASE_URL}/api/auth/signup`,
          { email, password, rememberMe, referralCode },
          { withCredentials: true }
        )
      );
      this.currentUser.set(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Signup failed') };
    }
  }

  async logIn(email: string, password: string, rememberMe: boolean, referralCode?: string): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthUserResponse>(
          `${BACKEND_BASE_URL}/api/auth/login`,
          { email, password, rememberMe, referralCode },
          { withCredentials: true }
        )
      );
      this.currentUser.set(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Login failed') };
    }
  }

  async logOut(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${BACKEND_BASE_URL}/api/auth/logout`, {}, { withCredentials: true })
      );
    } finally {
      this.currentUser.set(null);
    }
  }

  /**
   * Always resolves with a generic success message regardless of whether
   * the email is registered, matching the backend's response, so the UI
   * can't be used to discover which emails have accounts.
   */
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      await firstValueFrom(
        this.http.post<MessageResponse>(`${BACKEND_BASE_URL}/api/auth/forgot-password`, { email })
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Something went wrong') };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      await firstValueFrom(
        this.http.post(`${BACKEND_BASE_URL}/api/auth/reset-password`, { token, newPassword })
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Password reset failed') };
    }
  }
}

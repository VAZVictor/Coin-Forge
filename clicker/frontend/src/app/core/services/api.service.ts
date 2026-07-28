import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BACKEND_BASE_URL } from './backend-config';

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient) { }

    private url(path: string): string {
        return `${BACKEND_BASE_URL}${path}`;
    }

    signUp(email: string, password: string, rememberMe = false): Observable<any> {
        return this.http
            .post(this.url('/api/auth/signup'), { email, password, rememberMe }, { withCredentials: true })
            .pipe(catchError(this.handleError));
    }

    logIn(email: string, password: string, rememberMe = false): Observable<any> {
        return this.http
            .post(this.url('/api/auth/login'), { email, password, rememberMe }, { withCredentials: true })
            .pipe(catchError(this.handleError));
    }

    logOut(): Observable<any> {
        return this.http.post(this.url('/api/auth/logout'), {}, { withCredentials: true }).pipe(catchError(this.handleError));
    }

    me(): Observable<any> {
        return this.http.get(this.url('/api/auth/me'), { withCredentials: true }).pipe(catchError(this.handleError));
    }

    // Generic save endpoints
    getSave(): Observable<any> {
        return this.http.get(this.url('/api/save'), { withCredentials: true }).pipe(catchError(this.handleError));
    }

    save(payload: unknown, updatedAt: number): Observable<any> {
        return this.http.post(this.url('/api/save'), { payload, updatedAt }, { withCredentials: true }).pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        // Re-throw the server error so callers (components/services) can extract messages
        return throwError(() => error);
    }
}

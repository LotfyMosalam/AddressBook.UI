import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseApiService } from '../services/base-api.service';
import { AuthResponseDto, LoginRequest, RegisterRequest } from '../../shared/models/auth.models';
import {
  getFromStorage,
  removeFromStorage,
  setInStorage,
  StorageKeys,
} from '../../shared/utils/storage.utils';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(BaseApiService);
  private readonly router = inject(Router);

  // ── Private state ──────────────────────────────────────────────────────────
  private readonly _token = signal<string | null>(
    localStorage.getItem(StorageKeys.AUTH_TOKEN),
  );
  private readonly _currentUser = signal<AuthResponseDto | null>(
    getFromStorage<AuthResponseDto>(StorageKeys.AUTH_USER),
  );

  // ── Readonly signals ───────────────────────────────────────────────────────
  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  // ── Actions ────────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<void> {
    return this.api.post<AuthResponseDto>('/auth/login', credentials).pipe(
      tap((res) => this.persistSession(res)),
      map(() => undefined as void),
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.api.post<AuthResponseDto>('/auth/register', request).pipe(
      tap((res) => this.persistSession(res)),
      map(() => undefined as void),
    );
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    removeFromStorage(StorageKeys.AUTH_TOKEN);
    removeFromStorage(StorageKeys.AUTH_USER);
    this.router.navigate(['/auth/login']);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private persistSession(response: AuthResponseDto): void {
    this._token.set(response.token);
    this._currentUser.set(response);
    localStorage.setItem(StorageKeys.AUTH_TOKEN, response.token);
    setInStorage(StorageKeys.AUTH_USER, response);
  }
}

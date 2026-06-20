import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { LoginRequest, RegisterRequest } from '../../shared/models/auth.models';

// Thin facade that delegates to AuthStore.
// Guards, interceptors, and navbar continue to import this without changes.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(AuthStore);

  readonly token = this.store.token;
  readonly user = this.store.currentUser;
  readonly isAuthenticated = this.store.isAuthenticated;

  login(credentials: LoginRequest): Observable<void> {
    return this.store.login(credentials);
  }

  register(request: RegisterRequest): Observable<void> {
    return this.store.register(request);
  }

  logout(): void {
    this.store.logout();
  }
}

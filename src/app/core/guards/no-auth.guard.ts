import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const isAuthenticated = inject(AuthService).isAuthenticated();
  if (!isAuthenticated) return true;
  return inject(Router).createUrlTree(['/addresses']);
};

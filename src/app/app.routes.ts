import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth pages — no layout wrapper
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Protected pages — wrapped in MainLayoutComponent
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'addresses', pathMatch: 'full' },
      {
        path: 'addresses',
        loadChildren: () =>
          import('./features/addresses/addresses.routes').then((m) => m.ADDRESSES_ROUTES),
      },
      {
        path: 'jobs',
        loadChildren: () =>
          import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES),
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/departments/departments.routes').then(
            (m) => m.DEPARTMENTS_ROUTES,
          ),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'addresses' },
];

import { Routes } from '@angular/router';

export const ADDRESSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./address-list/address-list.component').then((m) => m.AddressListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./address-detail/address-detail.component').then((m) => m.AddressDetailComponent),
  },
];

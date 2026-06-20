import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddressStore } from '../../../core/stores/address.store';
import { ToastService } from '../../../core/services/toast.service';
import { AddressEntryDto } from '../../../shared/models/address.models';
import { ApiError } from '../../../core/services/base-api.service';
import { environment } from '../../../../environments/environment';
import {
  AddressFormModalComponent,
  AddressFormData,
} from '../address-form/address-form-modal.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-address-detail',
  standalone: true,
  imports: [RouterLink, MatDialogModule],
  templateUrl: './address-detail.component.html',
  styleUrl: './address-detail.component.scss',
})
export class AddressDetailComponent {
  readonly id = input.required<string>();

  private readonly store = inject(AddressStore);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly staticBase = environment.staticBaseUrl;

  readonly entry = signal<AddressEntryDto | null>(null);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly isDeleting = signal(false);

  readonly skeletonFields = Array(6).fill(0);

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.isLoading.set(true);
          this.errorMsg.set(null);
          this.entry.set(null);
          return this.store.getById(id).pipe(
            catchError((err: ApiError) => {
              this.errorMsg.set(err.message ?? 'Failed to load contact.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((entry) => {
        this.entry.set(entry);
        this.isLoading.set(false);
      });
  }

  getPhotoUrl(): string {
    const url = this.entry()?.photoUrl;
    if (!url) return 'assets/default-avatar.svg';
    if (url.startsWith('http') || url.startsWith('//')) return url;
    return `${this.staticBase}${url}`;
  }

  onPhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-avatar.svg';
    img.onerror = null;
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatDatetime(isoDate: string): string {
    return new Date(isoDate).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openEdit(): void {
    this.dialog
      .open(AddressFormModalComponent, {
        width: '640px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'ab-dialog-panel',
        data: { mode: 'edit', entryId: this.id() } satisfies AddressFormData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'success') this.reloadEntry();
      });
  }

  openDelete(): void {
    const name = this.entry()?.fullName ?? 'this contact';
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: {
          title: 'Delete Contact',
          message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.isDeleting.set(true);
        this.store
          .removeEntry(this.id())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Contact deleted.');
              this.router.navigate(['/addresses']);
            },
            error: (err: ApiError) => {
              this.isDeleting.set(false);
              this.toast.error(err.message ?? 'Failed to delete contact.');
            },
          });
      });
  }

  private reloadEntry(): void {
    this.isLoading.set(true);
    this.store
      .getById(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          this.entry.set(entry);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}

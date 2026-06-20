import { Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpEventType } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddressStore } from '../../../core/stores/address.store';
import { LookupStore } from '../../../core/stores/lookup.store';
import { ApiError } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { AddressFormModalComponent, AddressFormData } from '../address-form/address-form-modal.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatDialogModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent implements OnInit {
  private readonly store = inject(AddressStore);
  readonly lookupStore = inject(LookupStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly staticBase = environment.staticBaseUrl;

  // ── Photo upload ───────────────────────────────────────────────────────────
  private readonly photoUploadInput =
    viewChild.required<ElementRef<HTMLInputElement>>('photoUploadInput');
  readonly pendingUploadId = signal<string | null>(null);
  readonly uploadingId = signal<string | null>(null);
  readonly uploadProgress = signal<number>(0);
  readonly isExporting = signal(false);

  // ── Store signal aliases (template binds to these) ─────────────────────────
  readonly isLoading = this.store.isLoading;
  readonly errorMsg = this.store.errorMsg;
  readonly entries = this.store.entries;
  readonly totalCount = this.store.totalCount;
  readonly totalPages = this.store.totalPages;
  readonly hasPrevPage = this.store.hasPrevPage;
  readonly hasNextPage = this.store.hasNextPage;
  readonly isSearchActive = this.store.isSearchActive;
  readonly isEmpty = this.store.isEmpty;
  readonly pageStart = this.store.pageStart;
  readonly pageEnd = this.store.pageEnd;
  readonly pageNum = this.store.pageNum;
  readonly pageSz = this.store.pageSz;
  readonly sortField = this.store.sortField;
  readonly sortDesc = this.store.sortDesc;

  readonly skeletonRows = Array(6).fill(0);

  // ── Filter form — all fields drive AddressStore.applyFilters() ─────────────
  readonly filterForm = this.fb.group({
    searchTerm: [''],
    fullName: [''],
    email: [''],
    mobileNumber: [''],
    address: [''],
    jobId: [''],
    departmentId: [''],
    dobFrom: [''],
    dobTo: [''],
  });

  constructor() {
    // Any form change → debounce 300ms → push all filter values to store
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) =>
        this.store.applyFilters({
          searchTerm: v.searchTerm ?? '',
          fullName: v.fullName ?? '',
          email: v.email ?? '',
          mobileNumber: v.mobileNumber ?? '',
          address: v.address ?? '',
          jobId: v.jobId ?? '',
          departmentId: v.departmentId ?? '',
          dobFrom: v.dobFrom ?? '',
          dobTo: v.dobTo ?? '',
        }),
      );
  }

  ngOnInit(): void {
    // Sync form with any state that survived navigation (store is singleton)
    this.filterForm.setValue(
      {
        searchTerm: this.store.searchTerm(),
        fullName: this.store.fullName(),
        email: this.store.email(),
        mobileNumber: this.store.mobileNumber(),
        address: this.store.address(),
        jobId: this.store.jobId(),
        departmentId: this.store.departmentId(),
        dobFrom: this.store.dobFrom(),
        dobTo: this.store.dobTo(),
      },
      { emitEvent: false },
    );

    this.lookupStore.ensureJobsLoaded();
    this.lookupStore.ensureDepartmentsLoaded();
    this.store.loadPage();
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  applySort(field: string): void {
    this.store.applySort(field);
  }

  sortIconClass(field: string): string {
    if (this.sortField() !== field) return 'sort-icon sort-neutral';
    return `sort-icon ${this.sortDesc() ? 'sort-desc' : 'sort-asc'}`;
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    this.store.goToPage(page);
  }

  onPageSizeChange(event: Event): void {
    this.store.setPageSize(Number((event.target as HTMLSelectElement).value));
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  clearFilters(): void {
    // Reset form without emitting (avoids duplicate debounced API call)
    this.filterForm.reset(
      {
        searchTerm: '',
        fullName: '',
        email: '',
        mobileNumber: '',
        address: '',
        jobId: '',
        departmentId: '',
        dobFrom: '',
        dobTo: '',
      },
      { emitEvent: false },
    );
    // Directly clear store state and trigger reload
    this.store.clearFilters();
  }

  // ── Photo helpers ──────────────────────────────────────────────────────────

  getPhotoUrl(photoUrl: string | undefined): string {
    if (!photoUrl) return 'default-avatar.svg';
    if (photoUrl.startsWith('http') || photoUrl.startsWith('//')) return photoUrl;
    return `${this.staticBase}${photoUrl}`;
  }

  onPhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'default-avatar.svg';
    img.onerror = null;
  }

  // ── Modals ─────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.dialog
      .open(AddressFormModalComponent, {
        width: '640px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'ab-dialog-panel',
        data: { mode: 'create' } satisfies AddressFormData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'success') this.store.loadPage();
      });
  }

  openEditModal(entryId: string): void {
    this.dialog
      .open(AddressFormModalComponent, {
        width: '640px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'ab-dialog-panel',
        data: { mode: 'edit', entryId } satisfies AddressFormData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'success') this.store.loadPage();
      });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  openDeleteConfirm(entryId: string, fullName: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: {
          title: 'Delete Contact',
          message: `Are you sure you want to delete "${fullName}"? This cannot be undone.`,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.store
          .removeEntry(entryId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.toast.success('Contact deleted.'),
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to delete contact.'),
          });
      });
  }

  // ── Inline photo upload ────────────────────────────────────────────────────

  triggerPhotoUpload(entryId: string): void {
    this.pendingUploadId.set(entryId);
    const input = this.photoUploadInput().nativeElement;
    input.value = '';
    input.click();
  }

  onPhotoFileSelected(event: Event): void {
    const entryId = this.pendingUploadId();
    this.pendingUploadId.set(null);

    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';

    if (!file || !entryId) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toast.error('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Image must be 5 MB or less.');
      return;
    }

    this.uploadingId.set(entryId);
    this.uploadProgress.set(0);

    this.store
      .uploadPhotoWithProgress(entryId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (httpEvent) => {
          if (httpEvent.type === HttpEventType.UploadProgress) {
            const total = httpEvent.total ?? 1;
            this.uploadProgress.set(Math.round((httpEvent.loaded / total) * 100));
          } else if (httpEvent.type === HttpEventType.Response) {
            this.uploadingId.set(null);
            this.uploadProgress.set(0);
            const photoUrl = httpEvent.body?.photoUrl;
            if (photoUrl) this.store.patchEntryPhoto(entryId, photoUrl);
            this.toast.success('Photo updated.');
          }
        },
        error: (err: ApiError) => {
          this.uploadingId.set(null);
          this.uploadProgress.set(0);
          if (err.errors) {
            Object.values(err.errors)
              .flat()
              .forEach((m) => this.toast.error(m));
          } else {
            this.toast.error(err.message ?? 'Photo upload failed.');
          }
        },
      });
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  exportToExcel(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.store
      .exportToExcel()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'address-book.xlsx';
          anchor.click();
          URL.revokeObjectURL(url);
          this.isExporting.set(false);
        },
        error: (err: ApiError) => {
          this.isExporting.set(false);
          this.toast.error(err.message ?? 'Export failed. Please try again.');
        },
      });
  }

  // ── Retry ──────────────────────────────────────────────────────────────────

  retry(): void {
    this.store.loadPage();
  }
}

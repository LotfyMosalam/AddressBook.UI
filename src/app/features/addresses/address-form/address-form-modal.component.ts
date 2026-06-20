import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, switchMap, catchError, tap, filter, map, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AddressStore } from '../../../core/stores/address.store';
import { LookupStore } from '../../../core/stores/lookup.store';
import { CreateAddressEntryRequest, UpdateAddressEntryRequest } from '../../../shared/models/address.models';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/base-api.service';
import { egyptianMobileValidator, authPasswordValidator } from '../../../shared/utils/validators';
import { environment } from '../../../../environments/environment';

export interface AddressFormData {
  mode: 'create' | 'edit';
  entryId?: string;
}

@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './address-form-modal.component.html',
  styleUrl: './address-form-modal.component.scss',
})
export class AddressFormModalComponent {
  // ── Injections (must come before field initializers that use them) ─────────
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddressFormModalComponent>);
  readonly data = inject<AddressFormData>(MAT_DIALOG_DATA);
  private readonly addressStore = inject(AddressStore);
  private readonly toast = inject(ToastService);
  readonly lookupStore = inject(LookupStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly staticBase = environment.staticBaseUrl;

  // ── Derived from data (must come before form) ──────────────────────────────
  readonly isCreate = this.data.mode === 'create';

  // ── Form — password is always declared; disabled + no validators in edit mode
  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, egyptianMobileValidator]],
    jobId: ['', Validators.required],
    departmentId: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    password: this.fb.control(
      { value: '', disabled: !this.isCreate },
      this.isCreate
        ? [Validators.required, Validators.minLength(8), authPasswordValidator]
        : [],
    ),
  });

  // ── UI state ───────────────────────────────────────────────────────────────
  readonly isLoadingEntry = signal(false);
  readonly isSaving = signal(false);
  readonly showPassword = signal(false);
  readonly uploadProgress = signal(0);
  selectedPhoto: File | null = null;
  readonly photoPreview = signal<string | null>(null);
  readonly currentPhotoUrl = signal<string | null>(null);

  private static readonly ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private static readonly MAX_PHOTO_SIZE = 5 * 1024 * 1024;

  // ── Password hints (signals updated via valueChanges) ─────────────────────
  private readonly passwordValue = signal('');
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.passwordValue()));
  readonly hasLowercase = computed(() => /[a-z]/.test(this.passwordValue()));
  readonly hasDigit = computed(() => /\d/.test(this.passwordValue()));
  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);

  constructor() {
    this.lookupStore.ensureJobsLoaded();
    this.lookupStore.ensureDepartmentsLoaded();

    // Track password for hint badges
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.passwordValue.set(v));

    // Fetch full entry when editing
    if (!this.isCreate && this.data.entryId) {
      this.isLoadingEntry.set(true);
      this.addressStore
        .getById(this.data.entryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (entry) => {
            this.form.patchValue({
              fullName: entry.fullName,
              email: entry.email,
              mobileNumber: entry.mobileNumber,
              jobId: entry.jobId,
              departmentId: entry.departmentId,
              dateOfBirth: entry.dateOfBirth.split('T')[0],
              address: entry.address,
            });
            if (entry.photoUrl) {
              const url = entry.photoUrl.startsWith('http')
                ? entry.photoUrl
                : `${this.staticBase}${entry.photoUrl}`;
              this.currentPhotoUrl.set(url);
            }
            this.isLoadingEntry.set(false);
          },
          error: () => {
            this.isLoadingEntry.set(false);
            this.toast.error('Failed to load contact details.');
            this.dialogRef.close();
          },
        });
    }
  }

  // ── Error accessors ────────────────────────────────────────────────────────

  get fullNameError(): string | null {
    const c = this.form.controls.fullName;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Full name is required.';
    if (c.errors['maxlength']) return 'Name must be 200 characters or less.';
    return null;
  }

  get emailError(): string | null {
    const c = this.form.controls.email;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Email is required.';
    if (c.errors['email']) return 'Enter a valid email address.';
    return null;
  }

  get mobileError(): string | null {
    const c = this.form.controls.mobileNumber;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Mobile number is required.';
    if (c.errors['egyptianMobile']) return 'Enter a valid Egyptian mobile (01X XXXXXXXX).';
    return null;
  }

  get jobError(): string | null {
    const c = this.form.controls.jobId;
    if (!c.touched || !c.errors) return null;
    return 'Please select a job.';
  }

  get deptError(): string | null {
    const c = this.form.controls.departmentId;
    if (!c.touched || !c.errors) return null;
    return 'Please select a department.';
  }

  get dobError(): string | null {
    const c = this.form.controls.dateOfBirth;
    if (!c.touched || !c.errors) return null;
    return 'Date of birth is required.';
  }

  get addressError(): string | null {
    const c = this.form.controls.address;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Address is required.';
    if (c.errors['maxlength']) return 'Address must be 500 characters or less.';
    return null;
  }

  get passwordError(): string | null {
    const c = this.form.controls.password;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Password is required.';
    if (c.errors['minlength']) return 'Password must be at least 8 characters.';
    return null;
  }

  get showPasswordHints(): boolean {
    const c = this.form.controls.password;
    if (!c.touched || !c.errors) return false;
    return !c.errors['required'] && !c.errors['minlength'];
  }

  // ── Photo ──────────────────────────────────────────────────────────────────

  getDisplayPhoto(): string | null {
    return this.photoPreview() ?? this.currentPhotoUrl();
  }

  onPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!AddressFormModalComponent.ALLOWED_PHOTO_TYPES.includes(file.type)) {
      this.toast.error('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > AddressFormModalComponent.MAX_PHOTO_SIZE) {
      this.toast.error('Image must be 5 MB or less.');
      return;
    }

    this.selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.dialogRef.disableClose = true;

    const stream$ = this.isCreate ? this.buildCreate$() : this.buildUpdate$();

    stream$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.dialogRef.disableClose = false;
        this.toast.success(
          this.isCreate ? 'Contact added successfully.' : 'Contact updated successfully.',
        );
        this.dialogRef.close('success');
      },
      error: (err: ApiError) => {
        this.isSaving.set(false);
        this.dialogRef.disableClose = false;
        if (err.errors) {
          Object.values(err.errors)
            .flat()
            .forEach((m) => this.toast.error(m));
        } else {
          this.toast.error(err.message ?? 'Something went wrong. Please try again.');
        }
      },
    });
  }

  close(): void {
    if (!this.isSaving()) this.dialogRef.close();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private buildCreate$() {
    const v = this.form.controls;
    const req: CreateAddressEntryRequest = {
      fullName: v.fullName.value,
      email: v.email.value,
      mobileNumber: v.mobileNumber.value,
      jobId: v.jobId.value,
      departmentId: v.departmentId.value,
      dateOfBirth: v.dateOfBirth.value,
      address: v.address.value,
      password: v.password.value,
    };
    return this.addressStore.createEntry(req).pipe(
      switchMap((newId) =>
        this.selectedPhoto ? this.uploadWithProgress$(newId, this.selectedPhoto) : of(null),
      ),
    );
  }

  private buildUpdate$() {
    const v = this.form.controls;
    const req: UpdateAddressEntryRequest = {
      fullName: v.fullName.value,
      email: v.email.value,
      mobileNumber: v.mobileNumber.value,
      jobId: v.jobId.value,
      departmentId: v.departmentId.value,
      dateOfBirth: v.dateOfBirth.value,
      address: v.address.value,
    };
    return this.addressStore.updateEntry(this.data.entryId!, req).pipe(
      switchMap(() =>
        this.selectedPhoto
          ? this.uploadWithProgress$(this.data.entryId!, this.selectedPhoto)
          : of(null),
      ),
    );
  }

  private uploadWithProgress$(id: string, file: File) {
    return this.addressStore.uploadPhotoWithProgress(id, file).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 1;
          this.uploadProgress.set(Math.round((event.loaded / total) * 100));
        }
      }),
      filter((event): event is HttpResponse<{ photoUrl: string }> =>
        event.type === HttpEventType.Response,
      ),
      map(() => null as null),
      catchError((err: ApiError) => {
        const action = this.isCreate ? 'Contact created' : 'Contact updated';
        const reason = err.message ? `: ${err.message}` : '';
        this.toast.info(`${action}. Photo upload failed${reason} — add it later.`);
        return of(null);
      }),
      finalize(() => this.uploadProgress.set(0)),
    );
  }
}

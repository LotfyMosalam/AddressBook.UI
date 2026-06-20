import { Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface NameFormData {
  mode: 'create' | 'edit';
  entityLabel: string;
  currentName?: string;
}

@Component({
  selector: 'app-name-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './name-form-modal.component.html',
  styleUrl: './name-form-modal.component.scss',
})
export class NameFormModalComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly dialogRef = inject(MatDialogRef<NameFormModalComponent>);
  readonly data = inject<NameFormData>(MAT_DIALOG_DATA);

  readonly isCreate = this.data.mode === 'create';

  readonly form = this.fb.group({
    name: [this.data.currentName ?? '', [Validators.required, Validators.maxLength(200)]],
  });

  readonly placeholder = computed(
    () => `Enter ${this.data.entityLabel.toLowerCase()} name`,
  );

  get nameError(): string | null {
    const c = this.form.controls.name;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Name is required.';
    if (c.errors['maxlength']) return 'Name must be 200 characters or less.';
    return null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.controls.name.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

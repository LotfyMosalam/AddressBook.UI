import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LookupStore } from '../../../core/stores/lookup.store';
import { ApiError } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CrudTableComponent, NamedItem } from '../../../shared/components/crud-table/crud-table.component';
import { NameFormModalComponent, NameFormData } from '../../../shared/components/name-form-modal/name-form-modal.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CrudTableComponent, MatDialogModule],
  template: `
    <app-crud-table
      title="Departments"
      addLabel="Add Department"
      [items]="items()"
      [isLoading]="isLoading()"
      [errorMsg]="errorMsg()"
      (addClicked)="openAdd()"
      (editClicked)="openEdit($event)"
      (deleteClicked)="openDelete($event)"
      (retryClicked)="reload()"
    />
  `,
})
export class DepartmentListComponent implements OnInit {
  private readonly lookupStore = inject(LookupStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Store signal aliases ───────────────────────────────────────────────────
  readonly items = this.lookupStore.departments;
  readonly isLoading = this.lookupStore.isLoadingDepts;
  readonly errorMsg = this.lookupStore.deptsError;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.lookupStore.loadDepts();
  }

  openAdd(): void {
    this.dialog
      .open(NameFormModalComponent, {
        width: '420px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: { mode: 'create', entityLabel: 'Department' } satisfies NameFormData,
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (!name) return;
        this.lookupStore
          .createDept(name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Department added.');
              this.lookupStore.loadDepts();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to add department.'),
          });
      });
  }

  openEdit(id: string): void {
    const dept = this.items().find((d) => d.id === id);
    if (!dept) return;
    this.dialog
      .open(NameFormModalComponent, {
        width: '420px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: {
          mode: 'edit',
          entityLabel: 'Department',
          currentName: dept.name,
        } satisfies NameFormData,
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (!name) return;
        this.lookupStore
          .updateDept(id, name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Department updated.');
              this.lookupStore.loadDepts();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to update department.'),
          });
      });
  }

  openDelete(item: NamedItem): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: {
          title: 'Delete Department',
          message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.lookupStore
          .deleteDept(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Department deleted.');
              this.lookupStore.loadDepts();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to delete department.'),
          });
      });
  }
}

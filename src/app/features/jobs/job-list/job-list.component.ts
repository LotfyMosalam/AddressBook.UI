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
  selector: 'app-job-list',
  standalone: true,
  imports: [CrudTableComponent, MatDialogModule],
  template: `
    <app-crud-table
      title="Jobs"
      addLabel="Add Job"
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
export class JobListComponent implements OnInit {
  private readonly lookupStore = inject(LookupStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Store signal aliases ───────────────────────────────────────────────────
  readonly items = this.lookupStore.jobs;
  readonly isLoading = this.lookupStore.isLoadingJobs;
  readonly errorMsg = this.lookupStore.jobsError;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.lookupStore.loadJobs();
  }

  openAdd(): void {
    this.dialog
      .open(NameFormModalComponent, {
        width: '420px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: { mode: 'create', entityLabel: 'Job' } satisfies NameFormData,
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (!name) return;
        this.lookupStore
          .createJob(name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Job added.');
              this.lookupStore.loadJobs();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to add job.'),
          });
      });
  }

  openEdit(id: string): void {
    const job = this.items().find((j) => j.id === id);
    if (!job) return;
    this.dialog
      .open(NameFormModalComponent, {
        width: '420px',
        maxWidth: '95vw',
        panelClass: 'ab-dialog-panel',
        data: {
          mode: 'edit',
          entityLabel: 'Job',
          currentName: job.name,
        } satisfies NameFormData,
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (!name) return;
        this.lookupStore
          .updateJob(id, name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Job updated.');
              this.lookupStore.loadJobs();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to update job.'),
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
          title: 'Delete Job',
          message: `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.lookupStore
          .deleteJob(item.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toast.success('Job deleted.');
              this.lookupStore.loadJobs();
            },
            error: (err: ApiError) =>
              this.toast.error(err.message ?? 'Failed to delete job.'),
          });
      });
  }
}

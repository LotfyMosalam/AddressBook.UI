import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { JobsService } from '../../features/jobs/services/jobs.service';
import { DepartmentsService } from '../../features/departments/services/departments.service';
import { JobDto } from '../../shared/models/job.models';
import { DepartmentDto } from '../../shared/models/department.models';
import { ApiError } from '../services/base-api.service';

@Injectable({ providedIn: 'root' })
export class LookupStore {
  private readonly jobsService = inject(JobsService);
  private readonly deptService = inject(DepartmentsService);

  // ── Private state ──────────────────────────────────────────────────────────
  private readonly _jobs = signal<JobDto[]>([]);
  private readonly _departments = signal<DepartmentDto[]>([]);
  private readonly _isLoadingJobs = signal(false);
  private readonly _isLoadingDepts = signal(false);
  private readonly _jobsError = signal<string | null>(null);
  private readonly _deptsError = signal<string | null>(null);
  private jobsLoaded = false;
  private depsLoaded = false;

  // ── Readonly signals ───────────────────────────────────────────────────────
  readonly jobs = this._jobs.asReadonly();
  readonly departments = this._departments.asReadonly();
  readonly isLoadingJobs = this._isLoadingJobs.asReadonly();
  readonly isLoadingDepts = this._isLoadingDepts.asReadonly();
  readonly jobsError = this._jobsError.asReadonly();
  readonly deptsError = this._deptsError.asReadonly();

  // ── Lazy loaders (for dropdowns — no-op if already cached) ────────────────

  ensureJobsLoaded(): void {
    if (this.jobsLoaded) return;
    this.loadJobs();
  }

  ensureDepartmentsLoaded(): void {
    if (this.depsLoaded) return;
    this.loadDepts();
  }

  // ── Explicit loaders (for list pages — always fetch fresh) ────────────────

  loadJobs(): void {
    this._isLoadingJobs.set(true);
    this._jobsError.set(null);
    this.jobsService.getAll().subscribe({
      next: (jobs) => {
        this._jobs.set(jobs);
        this.jobsLoaded = true;
        this._isLoadingJobs.set(false);
      },
      error: (err: ApiError) => {
        this._jobsError.set(err.message ?? 'Failed to load jobs.');
        this._isLoadingJobs.set(false);
      },
    });
  }

  loadDepts(): void {
    this._isLoadingDepts.set(true);
    this._deptsError.set(null);
    this.deptService.getAll().subscribe({
      next: (depts) => {
        this._departments.set(depts);
        this.depsLoaded = true;
        this._isLoadingDepts.set(false);
      },
      error: (err: ApiError) => {
        this._deptsError.set(err.message ?? 'Failed to load departments.');
        this._isLoadingDepts.set(false);
      },
    });
  }

  // ── Job CRUD (return Observables; callers manage UI + trigger loadJobs()) ──

  createJob(name: string): Observable<string> {
    return this.jobsService.create({ name });
  }

  updateJob(id: string, name: string): Observable<void> {
    return this.jobsService.update(id, { name });
  }

  deleteJob(id: string): Observable<void> {
    return this.jobsService.remove(id);
  }

  // ── Department CRUD ────────────────────────────────────────────────────────

  createDept(name: string): Observable<string> {
    return this.deptService.create({ name });
  }

  updateDept(id: string, name: string): Observable<void> {
    return this.deptService.update(id, { name });
  }

  deleteDept(id: string): Observable<void> {
    return this.deptService.remove(id);
  }

  // ── Invalidation ───────────────────────────────────────────────────────────

  invalidateJobs(): void {
    this.jobsLoaded = false;
    this._jobs.set([]);
  }

  invalidateDepartments(): void {
    this.depsLoaded = false;
    this._departments.set([]);
  }

  invalidate(): void {
    this.invalidateJobs();
    this.invalidateDepartments();
  }
}

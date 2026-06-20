import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpEvent } from '@angular/common/http';
import { AddressesService } from '../../features/addresses/services/addresses.service';
import {
  AddressEntryDto,
  AddressEntryListItemDto,
  CreateAddressEntryRequest,
  GetEntriesParams,
  SearchEntriesParams,
  UpdateAddressEntryRequest,
} from '../../shared/models/address.models';
import { PaginatedResult } from '../../shared/models/pagination.models';
import { ApiError } from '../services/base-api.service';

export interface FilterParams {
  searchTerm?: string;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  jobId?: string;
  departmentId?: string;
  dobFrom?: string;
  dobTo?: string;
}

@Injectable({ providedIn: 'root' })
export class AddressStore {
  private readonly addressesService = inject(AddressesService);
  private readonly loadTrigger = new Subject<void>();

  // ── Private state ──────────────────────────────────────────────────────────
  private readonly _result = signal<PaginatedResult<AddressEntryListItemDto> | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _errorMsg = signal<string | null>(null);

  // Filters
  private readonly _searchTerm = signal('');
  private readonly _fullName = signal('');
  private readonly _email = signal('');
  private readonly _mobileNumber = signal('');
  private readonly _address = signal('');
  private readonly _jobId = signal('');
  private readonly _departmentId = signal('');
  private readonly _dobFrom = signal('');
  private readonly _dobTo = signal('');

  // Pagination + sort
  private readonly _pageNum = signal(1);
  private readonly _pageSz = signal(10);
  private readonly _sortField = signal('FullName');
  private readonly _sortDesc = signal(false);

  // ── Readonly signals ───────────────────────────────────────────────────────
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMsg = this._errorMsg.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly fullName = this._fullName.asReadonly();
  readonly email = this._email.asReadonly();
  readonly mobileNumber = this._mobileNumber.asReadonly();
  readonly address = this._address.asReadonly();
  readonly jobId = this._jobId.asReadonly();
  readonly departmentId = this._departmentId.asReadonly();
  readonly dobFrom = this._dobFrom.asReadonly();
  readonly dobTo = this._dobTo.asReadonly();
  readonly pageNum = this._pageNum.asReadonly();
  readonly pageSz = this._pageSz.asReadonly();
  readonly sortField = this._sortField.asReadonly();
  readonly sortDesc = this._sortDesc.asReadonly();

  readonly entries = computed(() => this._result()?.items ?? []);
  readonly totalCount = computed(() => this._result()?.totalCount ?? 0);
  readonly totalPages = computed(() => this._result()?.totalPages ?? 0);
  readonly hasPrevPage = computed(() => this._result()?.hasPreviousPage ?? false);
  readonly hasNextPage = computed(() => this._result()?.hasNextPage ?? false);
  readonly isSearchActive = computed(
    () =>
      !!this._searchTerm() ||
      !!this._fullName() ||
      !!this._email() ||
      !!this._mobileNumber() ||
      !!this._address() ||
      !!this._jobId() ||
      !!this._departmentId() ||
      !!this._dobFrom() ||
      !!this._dobTo(),
  );
  readonly isEmpty = computed(
    () => !this._isLoading() && !this._errorMsg() && this.entries().length === 0,
  );
  readonly pageStart = computed(() =>
    this.totalCount() === 0 ? 0 : (this._pageNum() - 1) * this._pageSz() + 1,
  );
  readonly pageEnd = computed(() => {
    const end = this._pageNum() * this._pageSz();
    return end > this.totalCount() ? this.totalCount() : end;
  });

  constructor() {
    this.loadTrigger
      .pipe(
        switchMap(() => {
          this._isLoading.set(true);
          this._errorMsg.set(null);
          return this.fetchPage().pipe(
            catchError((err: ApiError) => {
              this._errorMsg.set(err.message ?? 'Failed to load address book.');
              this._isLoading.set(false);
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((data) => {
        this._result.set(data);
        this._isLoading.set(false);
      });
  }

  // ── Load ───────────────────────────────────────────────────────────────────

  loadPage(): void {
    this.loadTrigger.next();
  }

  // ── Batch filter setter (called by the filter form after debounce) ──────────

  applyFilters(params: FilterParams): void {
    this._searchTerm.set(params.searchTerm ?? '');
    this._fullName.set(params.fullName ?? '');
    this._email.set(params.email ?? '');
    this._mobileNumber.set(params.mobileNumber ?? '');
    this._address.set(params.address ?? '');
    this._jobId.set(params.jobId ?? '');
    this._departmentId.set(params.departmentId ?? '');
    this._dobFrom.set(params.dobFrom ?? '');
    this._dobTo.set(params.dobTo ?? '');
    this._pageNum.set(1);
    this.loadPage();
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  applySort(field: string): void {
    if (this._sortField() === field) {
      this._sortDesc.update((v) => !v);
    } else {
      this._sortField.set(field);
      this._sortDesc.set(false);
    }
    this._pageNum.set(1);
    this.loadPage();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    this._pageNum.set(page);
    this.loadPage();
  }

  setPageSize(size: number): void {
    this._pageSz.set(size);
    this._pageNum.set(1);
    this.loadPage();
  }

  // ── Clear all filters ──────────────────────────────────────────────────────

  clearFilters(): void {
    this._searchTerm.set('');
    this._fullName.set('');
    this._email.set('');
    this._mobileNumber.set('');
    this._address.set('');
    this._jobId.set('');
    this._departmentId.set('');
    this._dobFrom.set('');
    this._dobTo.set('');
    this._pageNum.set(1);
    this.loadPage();
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  getById(id: string): Observable<AddressEntryDto> {
    return this.addressesService.getById(id);
  }

  createEntry(req: CreateAddressEntryRequest): Observable<string> {
    return this.addressesService.create(req);
  }

  updateEntry(id: string, req: UpdateAddressEntryRequest): Observable<void> {
    return this.addressesService.update(id, req);
  }

  removeEntry(id: string): Observable<void> {
    const snapshot = this._result();
    this.removeOptimistic(id);
    return this.addressesService.remove(id).pipe(
      catchError((err) => {
        this._result.set(snapshot);
        return throwError(() => err);
      }),
    );
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  exportToExcel(): Observable<Blob> {
    return this.addressesService.exportToExcel();
  }

  // ── Photo ──────────────────────────────────────────────────────────────────

  uploadPhoto(id: string, file: File): Observable<string> {
    return this.addressesService.uploadPhoto(id, file);
  }

  uploadPhotoWithProgress(id: string, file: File): Observable<HttpEvent<string>> {
    return this.addressesService.uploadPhotoWithProgress(id, file);
  }

  patchEntryPhoto(entryId: string, photoUrl: string): void {
    this._result.update((r) => {
      if (!r) return r;
      return {
        ...r,
        items: r.items.map((item) =>
          item.id === entryId ? { ...item, photoUrl } : item,
        ),
      };
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private fetchPage(): Observable<PaginatedResult<AddressEntryListItemDto>> {
    if (this.isSearchActive()) {
      const params: SearchEntriesParams = {
        pageNumber: this._pageNum(),
        pageSize: this._pageSz(),
        sortBy: this._sortField(),
        sortDescending: this._sortDesc(),
        searchTerm: this._searchTerm() || undefined,
        fullName: this._fullName() || undefined,
        email: this._email() || undefined,
        mobileNumber: this._mobileNumber() || undefined,
        address: this._address() || undefined,
        jobId: this._jobId() || undefined,
        departmentId: this._departmentId() || undefined,
        dobFrom: this._dobFrom() || undefined,
        dobTo: this._dobTo() || undefined,
      };
      return this.addressesService.search(params);
    }

    const params: GetEntriesParams = {
      pageNumber: this._pageNum(),
      pageSize: this._pageSz(),
      sortBy: this._sortField(),
      sortDescending: this._sortDesc(),
    };
    return this.addressesService.getAll(params);
  }

  private removeOptimistic(entryId: string): void {
    this._result.update((r) => {
      if (!r) return r;
      return {
        ...r,
        items: r.items.filter((item) => item.id !== entryId),
        totalCount: Math.max(0, r.totalCount - 1),
      };
    });
  }
}

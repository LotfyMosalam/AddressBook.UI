import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpEvent } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  AddressEntryDto,
  AddressEntryListItemDto,
  CreateAddressEntryRequest,
  GetEntriesParams,
  SearchEntriesParams,
  UpdateAddressEntryRequest,
} from '../../../shared/models/address.models';
import { PaginatedResult } from '../../../shared/models/pagination.models';

@Injectable({ providedIn: 'root' })
export class AddressesService {
  private readonly api = inject(BaseApiService);
  private readonly path = '/addresses';

  getAll(params: GetEntriesParams): Observable<PaginatedResult<AddressEntryListItemDto>> {
    return this.api.get<PaginatedResult<AddressEntryListItemDto>>(this.path, params);
  }

  search(params: SearchEntriesParams): Observable<PaginatedResult<AddressEntryListItemDto>> {
    return this.api.get<PaginatedResult<AddressEntryListItemDto>>(
      `${this.path}/search`,
      params,
    );
  }

  getById(id: string): Observable<AddressEntryDto> {
    return this.api.get<AddressEntryDto>(`${this.path}/${id}`);
  }

  create(request: CreateAddressEntryRequest): Observable<string> {
    return this.api.post<string>(this.path, request);
  }

  update(id: string, request: UpdateAddressEntryRequest): Observable<void> {
    return this.api.put<void>(`${this.path}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }

  uploadPhoto(id: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.api.postFormData<string>(`${this.path}/${id}/photo`, formData);
  }

  uploadPhotoWithProgress(id: string, file: File): Observable<HttpEvent<string>> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.api.postFormDataWithProgress<string>(`${this.path}/${id}/photo`, formData);
  }

  exportToExcel(): Observable<Blob> {
    return this.api.getBlob(`${this.path}/export`);
  }
}

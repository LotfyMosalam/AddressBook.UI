import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import {
  CreateDepartmentRequest,
  DepartmentDto,
  UpdateDepartmentRequest,
} from '../../../shared/models/department.models';

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly api = inject(BaseApiService);
  private readonly path = '/departments';

  getAll(): Observable<DepartmentDto[]> {
    return this.api.get<DepartmentDto[]>(this.path);
  }

  getById(id: string): Observable<DepartmentDto> {
    return this.api.get<DepartmentDto>(`${this.path}/${id}`);
  }

  create(request: CreateDepartmentRequest): Observable<string> {
    return this.api.post<string>(this.path, request);
  }

  update(id: string, request: UpdateDepartmentRequest): Observable<void> {
    return this.api.put<void>(`${this.path}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }
}

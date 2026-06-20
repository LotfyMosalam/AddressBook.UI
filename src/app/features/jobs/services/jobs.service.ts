import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { CreateJobRequest, JobDto, UpdateJobRequest } from '../../../shared/models/job.models';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(BaseApiService);
  private readonly path = '/jobs';

  getAll(): Observable<JobDto[]> {
    return this.api.get<JobDto[]>(this.path);
  }

  getById(id: string): Observable<JobDto> {
    return this.api.get<JobDto>(`${this.path}/${id}`);
  }

  create(request: CreateJobRequest): Observable<string> {
    return this.api.post<string>(this.path, request);
  }

  update(id: string, request: UpdateJobRequest): Observable<void> {
    return this.api.put<void>(`${this.path}/${id}`, request);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${this.path}/${id}`);
  }
}

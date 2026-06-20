import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: object): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { params: this.buildParams(params) })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`)
      .pipe(catchError(this.handleError));
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, formData)
      .pipe(catchError(this.handleError));
  }

  postFormDataWithProgress<T>(path: string, formData: FormData): Observable<HttpEvent<T>> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(catchError(this.handleError)) as Observable<HttpEvent<T>>;
  }

  getBlob(path: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}${path}`, { responseType: 'blob' })
      .pipe(catchError(this.handleError));
  }

  private buildParams(params?: object): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      status: error.status,
      message:
        error.error?.title ?? error.error?.message ?? error.message ?? 'An unexpected error occurred',
      errors: error.error?.errors,
    };
    return throwError(() => apiError);
  }
}

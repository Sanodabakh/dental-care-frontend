import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

type QueryValue = string | number | boolean | undefined | null;
type Query = Record<string, QueryValue>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Query): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.toParams(params) });
  }

  getPage<T>(path: string, params?: Query): Observable<Page<T>> {
    return this.get<Page<T>>(path, params);
  }

  /** Téléchargement binaire (PDF) avec les en-têtes de réponse (nom de fichier). */
  getBlob(path: string, params?: Query): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}${path}`, {
      params: this.toParams(params),
      observe: 'response',
      responseType: 'blob',
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown, params?: Query): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, { params: this.toParams(params) });
  }

  delete<T>(path: string, params?: Query): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { params: this.toParams(params) });
  }

  private toParams(params?: Query): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { User, LoginRequest, LoginResponse } from '../../shared/models/user.model';

const TOKEN_KEY = 'dc_token';
const USER_KEY = 'dc_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.loadUser());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null && this._token() !== null);

  constructor(private router: Router, private api: ApiService) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials)
      .pipe(tap(response => this.persistSession(response)));
  }

  /** Recharge l'utilisateur courant depuis le backend (jeton déjà stocké). */
  refreshUser(): Observable<User> {
    return this.api.get<User>('/auth/me')
      .pipe(tap(user => this.persistUser(user)));
  }

  hasRole(...roles: string[]): boolean {
    const role = this._user()?.role;
    return !!role && roles.includes(role);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    this._token.set(response.token);
    this.persistUser(response.user);
  }

  private persistUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}

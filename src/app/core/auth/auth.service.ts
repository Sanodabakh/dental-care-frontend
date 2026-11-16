import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay, tap } from 'rxjs';
import { User, LoginRequest, LoginResponse } from '../../shared/models/user.model';

const TOKEN_KEY = 'dc_token';
const USER_KEY = 'dc_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.loadUser());
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // MOCK — remplacer par appel ApiService vers Spring Boot
    if (credentials.email === 'admin@dentalcare.sn' && credentials.password === 'admin123') {
      const response: LoginResponse = {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '1',
          email: credentials.email,
          fullName: 'Dr. Omar Fall',
          role: 'ADMIN',
          active: true,
          createdAt: new Date().toISOString(),
        },
        expiresIn: 86400,
      };
      return of(response).pipe(delay(500), tap(res => this.persistSession(res)));
    }
    return throwError(() => new Error('Identifiants invalides'));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.token);
    this._user.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw) as User;
    if (user.fullName === 'Dr. Aïssatou Ndiaye') {
      user.fullName = 'Dr. Omar Fall';
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return user;
  }
}
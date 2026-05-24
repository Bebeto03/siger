import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environment/environment';
import { firstValueFrom } from 'rxjs';

export interface JwtPayload {
  sub: string;
  authorities: string[];
  exp: number;
  iat: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = environment.tokenKey;
  private _payload = signal<JwtPayload | null>(null);

  readonly currentUser = this._payload.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.carregarToken();
  }

  async login(credentials: LoginRequest): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<{ token: string }>(`${environment.apiUrl}/auth/login`, credentials)
    );
    this.armazenarToken(response.token);
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email })
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._payload.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.buscarToken();
    if (!token) return false;
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  temPermissao(role: string): boolean {
    const payload = this._payload();
    return !!payload?.authorities?.includes(role);
  }

  temQualquerPermissao(roles: string[]): boolean {
    return roles.some(r => this.temPermissao(r));
  }

  buscarToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getNomeUsuario(): string {
    return this._payload()?.sub ?? '';
  }

  private armazenarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    try {
      this._payload.set(jwtDecode<JwtPayload>(token));
    } catch {
      this._payload.set(null);
    }
  }

  private carregarToken(): void {
    const token = this.buscarToken();
    if (token) {
      try {
        this._payload.set(jwtDecode<JwtPayload>(token));
      } catch {
        this.logout();
      }
    }
  }
}

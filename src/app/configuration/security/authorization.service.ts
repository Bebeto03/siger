import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environment/environment';

import * as CryptoJS from 'crypto-js';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  jwtPayload: any;

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService
  ) { 
    this.carregarToken();
  }

  login() {
    const state = this.gerarStringAleatoria(40);
    const codeVerifier = this.gerarStringAleatoria(128);
    localStorage.setItem('state', state);
    localStorage.setItem('codeVerifier', codeVerifier);

    const codeChallengeMethod = 'S256'
    const codeChallenge = CryptoJS.SHA256(codeVerifier)
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const params = [
      'response_type=' + environment.responseType,
      'client_id=' + environment.clientId,
      'scope=' + environment.scope,
      'code_challenge=' + codeChallenge,
      'code_challenge_method=' + codeChallengeMethod,
      'state=' + state,
      'redirect_uri=' + encodeURIComponent(environment.redirectURI)
    ]

    window.location.href = environment.authorizationCallbackUrl + '?' +  params.join('&');
  }

  obterNovoAccessTokenComCode(code: string, state: string): Promise<any> {
    const stateSalvo = localStorage.getItem('state');

    if (stateSalvo !== state) {
      return Promise.reject(null);
    }

    const codeVerifier = localStorage.getItem('codeVerifier')!;

    const payload = new HttpParams()
      .append('grant_type', 'authorization_code')
      .append('code', code)
      .append('redirect_uri', environment.redirectURI)
      .append('code_verifier', codeVerifier);

    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', 'Basic '+ btoa(environment.clientId+':'+environment.secret));

    return this.http.post<any>(environment.tokenUrl, payload, { headers })
      .toPromise()
      .then((response: any) => {        
        this.armazenarToken(response['access_token']);
        this.armazenarRefreshToken(response['refresh_token']);
        localStorage.removeItem('state');
        localStorage.removeItem('codeVerifier');
        return Promise.resolve(null);
      })
      .catch((response: any) => {
        return Promise.resolve();
      });

  }

  obterNovoAccessToken(): Promise<void> {
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', 'Basic '+ btoa(environment.clientId+':'+environment.secret));

    const payload = new HttpParams()
      .append('grant_type', 'refresh_token')
      .append('refresh_token', localStorage.getItem('refreshToken')!)

    return this.http.post<any>(environment.tokenUrl, payload,
      { headers })
      .toPromise()
      .then((response: any) => {        
        this.armazenarToken(response['access_token']);
        this.armazenarRefreshToken(response['refresh_token'])
        return Promise.resolve();
      })
      .catch((response: any) => {
        return Promise.resolve();
      });
  }

  public armazenarToken(token: string) {    
    localStorage.setItem('token', token);
  }

  armazenarRefreshToken(refreshToken: string) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  public buscarToken() {
    return localStorage.getItem('token');
  }

  public carregarToken() {
    const token = localStorage.getItem('token');

    if (token) {
      this.armazenarToken(token);
      this.decodificarToken(token);
    }
  }

  isAccessTokenInvalido() {
    const token = localStorage.getItem('token');
    return !token || this.jwtHelper.isTokenExpired(token);
  }

  limparAccessToken() {
    localStorage.removeItem('token');
    this.jwtPayload = null;
  }

  decodificarToken(token: string){
    this.jwtPayload = this.jwtHelper.decodeToken(token);
  }

  temPermissao(permissao: string) {
    return this.jwtPayload && this.jwtPayload.authorities.includes(permissao);
  }

  temQualquerPermissao(roles: any) {
    for (const role of roles) {
      if (this.temPermissao(role)) {
        return true;
      }
    }
    return false;
  }

  public logout() {
    localStorage.clear();
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/x-www-form-urlencoded')
      .append('Authorization', 'Basic '+ btoa(environment.clientId+':'+environment.secret));

    const payload = new HttpParams()
      .append('token', localStorage.getItem('refreshToken')!)

    return this.http.post<any>(environment.tokenRevokeUrl, payload,
      { headers })
      .toPromise()
      .then((response: any) => {
        this.limparAccessToken();
        localStorage.clear();
        window.location.href = environment.logoutUrl + '?returnTo=' + environment.logoutRedirectUrl;
        return Promise.resolve();
      })
      .catch((response: any) => {
        return Promise.resolve();
      });
    
  }

  private gerarStringAleatoria(tamanho: number) {
    let resultado = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
  }
  
}
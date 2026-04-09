import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
  ) {}

  public validarTipoServidor() {
    return firstValueFrom(this.http.get<any>(`${this.baseUrl}/system/validar-tipo-servidor`));
  }

  public versaoApi() {
    return firstValueFrom(this.http.get<any>(`${this.baseUrl}/system/versao-api`));
  }
  
}
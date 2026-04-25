import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BaseResourceService } from './base-resource.service';
import { User } from '../models/user.model';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseResourceService<User> {
  constructor(http: HttpClient) {
    super(`${environment.apiUrl}/api/user`, http);
  }

  override listar(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`${this.apiPath}/findAll`));
  }

  register(data: Partial<User>): Promise<User> {
    return firstValueFrom(this.http.post<User>(this.apiPath, data));
  }
}

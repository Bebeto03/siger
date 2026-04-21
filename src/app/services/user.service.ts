import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BaseResourceService } from '../configuration/global/service/base-resource.service';
import { User } from '../model/user';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseResourceService<User> {
  constructor(http: HttpClient) {
    super(`${environment.apiUrl}/api/user`, http);
  }

  // GET /api/user/findAll (requires ADMIN)
  override listar(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`${this.apiPath}/findAll`));
  }

  // POST /api/user - endpoint público para cadastro
  register(data: Partial<User>): Promise<User> {
    return firstValueFrom(this.http.post<User>(this.apiPath, data));
  }
}

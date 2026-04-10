import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BaseResourceModel } from '../model/base-resource.model';

export class BaseResourceService<T extends BaseResourceModel> {

  constructor(
      protected apiPath: string,
      protected http: HttpClient
  ){}

  incluir(entidade: T): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.apiPath, entidade));
  }

  alterar(entidade: T): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${this.apiPath}/${entidade.id}`, entidade));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiPath}/${id}`));
  }

  buscar (id: number): Promise<any> {
    return firstValueFrom(this.http.get<T>(`${this.apiPath}/${id}`));
  }

  listar(): Promise<any> {
    return firstValueFrom(
      this.http.get<T[]>(`${this.apiPath}/listar`)
    );
  }

  pesquisar(filtro: any): Promise<any> {

    let params = new HttpParams()
      .set('page', filtro.pagina)
      .set('size', filtro.itensPorPagina);

    if(filtro.id) {
      params = params.set('id', filtro.id.toString());
    }

    return firstValueFrom(this.http.get(`${this.apiPath}/pesquisar`, { params }))
      .then((response: any) => {
        const resultado = {
          selecionados: response['content'],
          total: response['totalElements']
        }
        return resultado;
      });
  }

}
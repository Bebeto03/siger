import { Injectable } from '@angular/core';

import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(
    private messageService: MessageService
  ) { }

  handle (errorResponse: any) {
    let msg: string;      

    if(typeof errorResponse == 'string') {

      msg = errorResponse;

    }else if(errorResponse.status == 0){

      return this.messageService.add({severity:'error', summary:'Erro', detail: 'Servidor da API está inacessível' });

    }else  {
      
      if(errorResponse.error.message){
        msg = errorResponse.error.message;
      }else{
        msg = errorResponse.message;
      }
      
    }

    this.messageService.add({severity:'error', summary:'Erro', detail: msg });
  }
}
import { Directive, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { MenuItem } from 'primeng/api';
import { ConfirmationService, MessageService } from 'primeng/api';

import { BaseResourceModel } from '../model/base-resource.model';
import { BaseResourceService } from '../service/base-resource.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { LoadingService } from '../../core/loading.service';
import { ICanDeactivate } from '../../security/seguranca.deactivate.guard';


@Directive({
  standalone: true
})
export abstract class BaseResourceFormComponent<T  extends BaseResourceModel> implements OnInit, ICanDeactivate {

  entidade: T = Object.assign({}, null);
  items: MenuItem[] = [];
  tipoMenu!: string;
  consulta: boolean = false;
  idEntidade!: number;
  pt: any;
  @ViewChild("formulario")
  formulario: FormControl = new FormControl();

  //Campo para validação
  formularioInvalido: boolean = false;

  constructor(
    public resourceService: BaseResourceService<T>,
    public rotaListar: string,
    public nomeTitle: string,
    public itensMenu: any,
    public route: ActivatedRoute,
    public router: Router,
    public messageService: MessageService,
    public title: Title,
    public errorHandler : ErrorHandlerService,
    public loadingService: LoadingService,
    public confirmation: ConfirmationService
  ) { }

  ngOnInit() {

    this.items = this.itensMenu;

    this.idEntidade = this.route.snapshot.params['id'];
    this.consulta = this.route.snapshot.params['consulta'];
    this.tipoMenu = this.route.snapshot.params['tipo'];

    this.configurarFormulario();

    if(this.idEntidade){
      this.buscar(this.idEntidade);
    }else{
      this.title.setTitle ('SIGEE - Inclusão ' + this.nomeTitle);
    }

  }

  incluir(form: FormControl) {
    this.loadingService.show();
    this.resourceService.incluir(this.entidade)
      .then( ()=>{
        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Cadastro realizado com sucesso'});
        this.limparFormulario(form);
        this.loadingService.hide();
        this.router.navigate([this.rotaListar]);
      })
      .catch(erro => {
        this.errorHandler.handle(erro);
        this.loadingService.hide();
      });
  }

  alterar(form: FormControl) {
    this.loadingService.show();
    this.resourceService.alterar(this.entidade)
      .then( dados => {
        this.entidade = dados;
        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Alteração realizada com sucesso'});
        this.limparFormulario(form);
        this.loadingService.hide();
        this.router.navigate([this.rotaListar]);
      })
      .catch(erro => {
        this.errorHandler.handle(erro);
        this.loadingService.hide();
      });
  }

  buscar(id: number) {
    this.loadingService.show();
    this.resourceService.buscar(id)
      .then( dados => {
        this.entidade = dados;
        this.inicializarObjetosNulosBuscar(this.entidade);
        if(this.consulta){
          this.title.setTitle (`SIGEE - Consulta ${this.nomeTitle}`);
        }else{
          this.title.setTitle (`SIGEE - Alteração ${this.nomeTitle}`);
        }
        this.loadingService.hide();
      })
      .catch(erro => {
        this.errorHandler.handle(erro);
        this.loadingService.hide();
      });
  }

  salvar(form: FormControl) {
    if(this.verificarFormularioValido(form)){
      if (this.entidade.id){
        this.alterar(form);
      } else {
        this.incluir(form);
      }
    }
  }

  excluir() {
    this.loadingService.show();
    this.resourceService.excluir(this.entidade.id!)
    .then(() => {
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Exclusão realizada com sucesso'});
      this.loadingService.hide();
      this.router.navigate([this.rotaListar]);
    })
    .catch (erro => {
      this.errorHandler.handle(erro);
      this.loadingService.hide();
    });
  }

  limparFormulario(form: FormControl){
    this.entidade = Object.assign({}, null);
    this.configurarFormulario();
    form.reset();
  }

  verificarFormularioValido(form: FormControl) {
    if(form.invalid){
      this.setFormularioInvalido();
      return false;
    }else{
      this.formularioInvalido = false
      return true;
    }
  }

  setFormularioInvalido(){
    this.formularioInvalido = true;
    this.messageService.add({severity:'error', summary:'Erro', detail:'Dados do formulário estão inválidos'});
    return false;
  }

  configurarFormulario(){}

  inicializarObjetosNulosBuscar(entidade: T){}

  podeMudarDeRota(){
    if (this.formulario.dirty) {
      return new Promise((resolve) => {
        let msg = 'As informações no formulário não foram salvas e serão descartadas, deseja prosseguir?';
        this.confirmation.confirm({
          message: msg,
          accept: () => {
            resolve(true);
          },
          reject: () => {
            resolve(false);
          }
        });
      });
    } else {
      return true;
    }
  }

}
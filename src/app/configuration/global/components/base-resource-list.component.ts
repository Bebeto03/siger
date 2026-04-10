import { Directive, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { MenuItem, MessageService } from "primeng/api";
import { ErrorHandlerService } from "../../core/error-handler.service";
import { BaseResourceModel } from "../model/base-resource.model";
import { BaseResourceService } from "../service/base-resource.service";
import { LoadingService } from "../../core/loading.service";
import { AuthorizationService } from "../../security/authorization.service";

@Directive()
export abstract class BaseResourceListComponent<T extends BaseResourceModel, F> implements OnInit {

  items: MenuItem[] = [];
  selecionados: T[] = [];
  totalRegistros = 0;
  idEntidade!: number;
  entidade!: T;
  @ViewChild('tabela') tabelaEntidade: any;
  pt: any;

  constructor(
    public resourceService: BaseResourceService<T>,
    public rotaPadrao: string,
    public nomeDoFiltro: any,
    public filtro: any,
    public nomeTitle: string,
    public itensMenu: any,
    public title: Title,
    public messageService: MessageService,
    public errorHandler: ErrorHandlerService,
    public router: Router,
    public loadingService: LoadingService,
    public authorizationService: AuthorizationService
  ) {}

  ngOnInit() {

    this.items = this.itensMenu;

    this.title.setTitle ('SIGEE - ' + this.nomeTitle);
    this.carregarFiltro();
    this.pesquisar();
  }

  pesquisar(pagina = 0) {

    this.loadingService.show()
    if(!this.filtro.itensPorPagina){
      this.filtro.itensPorPagina = 15;
    }

    this.filtro.pagina = pagina;
    this.resourceService.pesquisar(this.filtro)
      .then(resultado => {
        this.totalRegistros = resultado.total;
        this.selecionados = resultado.selecionados;
        this.inicializarObjetosNulosPesquisar(this.selecionados)
        this.loadingService.hide();
        this.salvarFiltro();
      })
      .catch(erro => {
        this.errorHandler.handle(erro);
        this.loadingService.hide();
      });
  }

  limparFiltro() {
    this.filtro = Object.assign({}, null);
    this.totalRegistros = 0;
    sessionStorage.removeItem(this.nomeDoFiltro);
    this.configurarFormulario();
  }

  aoMudarPagina(event: any) {
    const pagina = event.first / event.rows;
    this.filtro.itensPorPagina = event.rows;
    if(this.totalRegistros > 0){
      this.pesquisar(pagina);
    }
  }

  selecionarEntidade(entidade: any){
    this.idEntidade = entidade.id;
    this.entidade = entidade;
  }

  alterarEntidade(entidade: any){
    if(!entidade.id){
      this.messageService.add({severity:'warn', summary:'Aviso!', detail:'Selecione um item da lista'});
    }else{
        this.router.navigate([this.rotaPadrao + "/editar/" + entidade.id]);
    }
  }

  salvarFiltro(){
    sessionStorage.setItem(this.nomeDoFiltro,JSON.stringify(this.filtro));
  }

  carregarFiltro(){
    const filtroAmazenado = JSON.parse(sessionStorage.getItem(this.nomeDoFiltro)!);
    if(filtroAmazenado){
      this.filtro = filtroAmazenado as F;
    }
  }

  configurarFormulario(){}

  inicializarObjetosNulosPesquisar(entidade: T[]){}

}
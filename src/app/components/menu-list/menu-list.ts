import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-menu-list',
  imports: [RouterModule, ButtonModule, TooltipModule, FieldsetModule, BreadcrumbModule],
  templateUrl: './menu-list.html',
  styleUrl: './menu-list.scss',
})
export class MenuList {

  @Input() rotaPadrao!: string;
  @Input() idEntidade!: number;
  @Input() permissaoNovo: boolean = true;
  @Input() permissaoEditar: boolean = true;
  @Input() permissaoConsultar: boolean = true;
  @Input() permissaoExcluir: boolean = true;
  @Input() itemsBreadCrumb: MenuItem[] = [];

  constructor(
    private router: Router,
    private messageService: MessageService,
  ) { }

  novo() {
    this.router.navigate([this.rotaPadrao + '/novo']);
  }

  existeItemSelecionado(tipo: string) {
    if (!this.idEntidade) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso!', detail: 'Selecione um item da lista' });
    } else {
      if (tipo === 'editar') {
        this.router.navigate([this.rotaPadrao + '/editar/' + this.idEntidade]);
      }
      if (tipo === 'consultar') {
        this.router.navigate([this.rotaPadrao + '/' + this.idEntidade + '/' + true + '/consultar']);
      }
      if (tipo === 'excluir') {
        this.router.navigate([this.rotaPadrao + '/' + this.idEntidade + '/' + true + '/excluir']);
      }
    }
  }

}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl } from '@angular/forms';

import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-menu-form',
  imports: [RouterModule, ButtonModule, TooltipModule, FieldsetModule, BreadcrumbModule],
  templateUrl: './menu-form.html',
  styleUrl: './menu-form.scss',
})
export class MenuForm {

  @Input() rotaListar!: string;
  @Input() tipoMenu!: string;
  @Input() formulario: any;
  @Output() salvar = new EventEmitter();
  @Output() excluir = new EventEmitter();
  @Input() itemsBreadCrumb: MenuItem[] = [];

  constructor(
    private router: Router,
    private confirmation: ConfirmationService
  ) { }

  validarBotao(novoOuEditar: string, excluir: string, consultar: string): any {
    if (!this.tipoMenu) {
      this.tipoMenu = 'novoOuEditar';
    }
    if (novoOuEditar === this.tipoMenu) {
      return true;
    }
    if (excluir === this.tipoMenu) {
      return true;
    }
    if (consultar === this.tipoMenu) {
      return true;
    }
  }

  cancelar() {
    this.router.navigate([this.rotaListar]);
  }

  salvarEntidade(formulario: FormControl) {
    this.salvar.emit(formulario);
  }

  excluirEntidade() {
    this.confirmation.confirm({
      message: 'Tem certeza que deseja excluir?',
      accept: (() => {
        this.excluir.emit();
      })
    });
  }

}
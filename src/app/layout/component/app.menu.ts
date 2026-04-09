import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthorizationService } from '../../config/security/authorization.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            @if(!item.separator){
                <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
            }
            @if(item.separator){
                <li class="menu-separator"></li>
            }
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(
        private authorizationService: AuthorizationService
    ) { }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/'] }]
            },
            {
                label: 'Acompanhamento',
                visible: this.authorizationService.temPermissao('SIGEE_MENU_ACOMPANHAMENTO'),
                items: [
                    { label: 'Obra', icon: 'pi pi-fw pi-bolt', routerLink: ['/acompanhamento-obra/listar'], visible: this.authorizationService.temPermissao('SIGEE_ACOMPANHAMENTO_CONSULTAR') },
                ]
            },
            {
                label: 'Cadastro',
                visible: this.authorizationService.temPermissao('SIGEE_MENU_CADASTRO'),
                items: [
                    { label: 'Cidade', icon: 'pi pi-fw pi-building', routerLink: ['/cidade/listar'], visible: this.authorizationService.temPermissao('SIGEE_CIDADE_CONSULTAR') },
                    { label: 'Solicitação', icon: 'pi pi-fw pi-comment', routerLink: ['/solicitacao/listar'], visible: this.authorizationService.temPermissao('SIGEE_SOLICITACAO_CONSULTAR') },
                    { label: 'Orçamento', icon: 'pi pi-fw pi-file-edit', routerLink: ['/orcamento/listar'], visible: this.authorizationService.temPermissao('SIGEE_ORCAMENTO_CONSULTAR') },
                    { label: 'Obra', icon: 'pi pi-fw pi-bolt', routerLink: ['/obra/listar'], visible: this.authorizationService.temPermissao('SIGEE_OBRA_CONSULTAR') },
                    { label: 'Região', icon: 'pi pi-fw pi-map', routerLink: ['/regiao/listar'], visible: this.authorizationService.temPermissao('SIGEE_REGIAO_CONSULTAR') },
                    { label: 'Serviço', icon: 'pi pi-fw pi-wrench', routerLink: ['/servico/listar'], visible: this.authorizationService.temPermissao('SIGEE_SERVICO_CONSULTAR') },
                ]
            }
        ];
    }
}

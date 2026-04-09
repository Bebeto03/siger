import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { SystemService } from '../../config/core/system.service';
import { AuthorizationService } from '../../config/security/authorization.service';
import { version } from '../../../../package.json';
import { environment } from '../../../environment/environment';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">                
                <img src="favicon.ico" class="w-[30px] h-[30px]"/>
                <span>SIGEE</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <!--
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
                -->
                <app-configurator />
            </div>

            <div class="layout-config-menu">
                <div class="p-2">
                    <span>Versão UI: {{versaoUi}}</span>
                </div>
            </div>

            <div class="layout-config-menu">
                <div class="p-2">
                    <span>Versão API: {{versaoApi}}</span>
                </div>
            </div>

            <div class="layout-config-menu">
                <div class="p-2">
                    <i class="pi pi-user mr-2"></i>
                    <span>{{authorizationService.jwtPayload?.nome}}</span>
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" (click)="logout()">
                        <i class="pi pi-sign-in"></i>
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    
    items!: MenuItem[];
    public versaoApi!: string;
    public versaoUi!: string;

    constructor(
        public layoutService: LayoutService,
        public router: Router,
        public authorizationService: AuthorizationService,
        public systemService: SystemService
    ) {}

    ngOnInit() {
        this.carregarVersaoApi();
        this.versaoUi = environment.buildNumber;
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        this.authorizationService.logout();
        this.router.navigate(['/login']);
        sessionStorage.clear();
    }

    carregarVersaoApi() {
        this.systemService.versaoApi()
        .then((dados: { mensagem: string; }) => {
            if(dados){
                this.versaoApi = dados.mensagem;
            }
        })
    }
}

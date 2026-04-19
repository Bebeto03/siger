import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PrimeNG } from 'primeng/config';
import { TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

import { LoadingService } from './configuration/core/loading.service';
import { SystemService } from './configuration/core/system.service';
import { Loading } from './components/loading/loading';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule, RouterOutlet, ToastModule, ConfirmDialogModule, Loading, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  
  title = 'SIGEE';
  tipoServidor: boolean = false;
  mostrarLoading: boolean = false;
  mostrarMenu: boolean = false;

  constructor(
    private config: PrimeNG,
    public translateService: TranslateService,
    public systemService: SystemService,
    public loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    this.translateService.setDefaultLang('pt');
    this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
    
    this.systemService.validarTipoServidor()
    .then(dados => {
      this.tipoServidor = dados;
    })
    
    this.loadingService.loading$.subscribe((val) => {
      this.mostrarLoading = val;
      this.cdr.detectChanges();
    });
    
  }

}

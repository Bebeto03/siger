import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppSidebar } from './sidebar/sidebar';
import { AppTopbar } from './topbar';
import { ToastComponent } from '../shared/components/toast/toast';
import { LoadingComponent } from '../shared/components/loading/loading';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, AppSidebar, AppTopbar, ToastComponent, LoadingComponent],
  template: `
    <app-loading />
    <app-toast />
    <div class="flex min-h-screen" style="background: var(--color-bg);">
      <app-sidebar [collapsed]="collapsed()" (toggleCollapse)="collapsed.set(!collapsed())" />
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <app-topbar />
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AppLayout {
  collapsed = signal(false);
}

import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [AsyncPipe],
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.7s linear infinite; }
  `],
  template: `
    @if (loading.loading$ | async) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center"
           style="background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);">
        <div class="spinner w-10 h-10 rounded-full border-4"
             style="border-color: var(--color-primary); border-top-color: transparent;"></div>
      </div>
    }
  `
})
export class LoadingComponent {
  readonly loading = inject(LoadingService);
}


import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';
@Component({
  selector: 'app-theme-button',
  standalone: true,
  imports: [],
  styles: [`
    .theme-toggle {
      position: relative;
      display: flex;
      align-items: center;
      width: 58px;
      height: 30px;
      padding: 3px;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: var(--color-surface-light);
      cursor: pointer;
      overflow: hidden;
      transition: background 350ms ease, border-color 350ms ease;
    }

    .theme-toggle-icon {
      position: absolute;
      left: 8px;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      font-size: 15px;
      color: var(--color-accent);
      transition:
        transform 450ms cubic-bezier(.34, 1.56, .64, 1),
        color 350ms ease;
    }

    .theme-toggle-thumb {
      position: absolute;
      left: 3px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
      transition:
        transform 450ms cubic-bezier(.34, 1.56, .64, 1),
        background 350ms ease,
        box-shadow 350ms ease;
    }

    /* Tema claro */
    .theme-toggle.is-light .theme-toggle-thumb {
      transform: translateX(28px);
      background: #F59E0B;
    }

    .theme-toggle.is-light .theme-toggle-icon {
      transform: translateX(28px);
      color: #FFFFFF;
    }

    /* Interações */
    .theme-toggle:hover {
      border-color: var(--color-primary);
    }

    .theme-toggle:active .theme-toggle-thumb {
      transform: scale(0.88);
    }

    .theme-toggle.is-light:active .theme-toggle-thumb {
      transform: translateX(28px) scale(0.88);
    }

    .theme-toggle:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .theme-toggle,
      .theme-toggle-thumb,
      .theme-toggle-icon {
        transition: none;
      }
    }
  `],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.is-light]="themeService.theme() === 'light'"
      (click)="themeService.toggleTheme()"
      [attr.aria-label]="themeService.theme() === 'dark'
        ? 'Ativar tema claro'
        : 'Ativar tema escuro'"
      [attr.aria-pressed]="themeService.theme() === 'light'">

      <span class="theme-toggle-icon">
        @if (themeService.theme() === 'dark') {
          ☀
        } @else {
          ☾
        }
      </span>

      <span class="theme-toggle-thumb"></span>
    </button>
  `
})
export class ThemeButton {
  protected readonly themeService = inject(ThemeService);
}


import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private document = inject(DOCUMENT);

  theme = signal<Theme>('dark');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    let savedTheme: Theme = 'dark';

    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('siger-theme');

      if (saved === 'light' || saved === 'dark') {
        savedTheme = saved;
      }
    }

    this.setTheme(savedTheme);
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);

    this.document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('siger-theme', theme);
    }
  }

  toggleTheme(): void {
    this.setTheme(
      this.theme() === 'dark' ? 'light' : 'dark'
    );
  }
}

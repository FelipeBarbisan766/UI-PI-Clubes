import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const THEME_STORAGE_KEY = 'dashboard-theme';
const DEFAULT_THEME = 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _selectedTheme = signal<string>(DEFAULT_THEME);
  readonly selectedTheme = this._selectedTheme.asReadonly();

  constructor() {
    this.applyStoredTheme();
  }

  setTheme(newTheme: string): void {
    this._selectedTheme.set(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    this.applyTheme(newTheme);
  }

  private applyStoredTheme(): void {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const themeToApply = stored ?? DEFAULT_THEME;
    this._selectedTheme.set(themeToApply);
    this.applyTheme(themeToApply);
  }

  private applyTheme(theme: string): void {
    // É assim que o DaisyUI v4 sabe qual tema aplicar
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
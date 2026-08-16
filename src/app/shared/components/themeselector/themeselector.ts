import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ThemeService } from './theme-service';

interface ThemeColor {
  name: string;
  value: string;
}

@Component({
  selector: 'app-themeselector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './themeselector.html',
})
export class Themeselector {
}
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { Navbar } from "../../shared/navbar/navbar";
import { Footer } from "../../shared/footer/footer";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private router = inject(Router);

  showFooter = signal<boolean>(false);

  constructor() {
    this.checkFooterVisibility(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: NavigationEnd) => {
      this.checkFooterVisibility(event.urlAfterRedirects);
    });
  }

  private checkFooterVisibility(url: string): void {
    const routesWithFooter = new Set(['/', '/clubs', '/plans']);
    const path = url.split('?')[0].split('#')[0];
    
    this.showFooter.set(routesWithFooter.has(path));
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

type NavIcon = 'overview' | 'users' | 'clubs' | 'plans' | 'sports' | 'flags';

interface NavItem {
  label: string;
  url: string;
  icon: NavIcon;
  exact?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Visão Geral', url: '/root', icon: 'overview', exact: true },
  { label: 'Usuários', url: '/root/usuarios', icon: 'users' },
  { label: 'Clubes', url: '/root/clubes', icon: 'clubs' },
  { label: 'Planos', url: '/root/planos', icon: 'plans' },
  { label: 'Esportes', url: '/root/esportes', icon: 'sports' },
  { label: 'Flags', url: '/root/flags', icon: 'flags' },
];

@Component({
  selector: 'app-root-layout',
  imports: [RouterOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-layout.html',
})
export class RootLayout {
  private readonly router = inject(Router);

  private readonly drawerToggle = viewChild.required<ElementRef<HTMLInputElement>>('drawerToggle');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navItems = computed(() => {
    const path = this.currentUrl().split('?')[0].split('#')[0];
    return NAV_ITEMS.map((item) => ({
      ...item,
      active: item.exact ? path === item.url : path === item.url || path.startsWith(`${item.url}/`),
    }));
  });

  protected closeDrawerOnMobile(): void {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    this.drawerToggle().nativeElement.checked = false;
  }
}

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);

  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const root = this.router.routerState.snapshot.root;
      const breadcrumbs: Breadcrumb[] = [];
      this.buildBreadcrumbTree(root, [], breadcrumbs);
      this.breadcrumbsSubject.next(breadcrumbs);
    });
  }

  private buildBreadcrumbTree(
    route: ActivatedRouteSnapshot | null,
    parentUrl: string[],
    breadcrumbs: Breadcrumb[],
  ) {
    if (route) {
      const routeUrl = parentUrl.concat(route.url.map((url) => url.path).filter((p) => p));

      // Pega a configuração exata deste segmento da rota (sem herança do pai)
      const routeConfig = route.routeConfig;
      let label = '';

      // Verifica se ESTA rota específica definiu o resolver dinâmico ou o nome estático
      if (routeConfig?.resolve?.['dynamicBreadcrumb']) {
        label = route.data['dynamicBreadcrumb'];
      } else if (routeConfig?.data?.['breadcrumb']) {
        label = route.data['breadcrumb'];
      }

      if (label) {
        const breadcrumb = {
          label: label,
          url: '/' + routeUrl.join('/'),
        };

        // Evita duplicatas pela URL (caso existam rotas com path: '')
        if (
          breadcrumbs.length === 0 ||
          breadcrumbs[breadcrumbs.length - 1].url !== breadcrumb.url
        ) {
          breadcrumbs.push(breadcrumb);
        }
      }

      this.buildBreadcrumbTree(route.firstChild, routeUrl, breadcrumbs);
    }
  }
}

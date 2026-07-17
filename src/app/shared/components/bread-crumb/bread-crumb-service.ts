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

  private readonly dynamicBreadcrumbResolveKeys = ['clubName', 'dynamicBreadcrumb'];

  constructor() {
    this.updateBreadcrumbs();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());
  }

  private updateBreadcrumbs(): void {
    const root = this.router.routerState.snapshot.root;
    const breadcrumbs: Breadcrumb[] = [];
    this.buildBreadcrumbTree(root, [], breadcrumbs);
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  private buildBreadcrumbTree(
    route: ActivatedRouteSnapshot | null,
    parentUrl: string[],
    breadcrumbs: Breadcrumb[],
  ): void {
    if (!route) {
      return;
    }

    const routeConfig = route.routeConfig;
    const segments = route.url.map((segment) => segment.path).filter((path) => path);
    const routeUrl = parentUrl.concat(segments);

    const staticLabel = routeConfig?.data?.['breadcrumb'];
    if (staticLabel) {
      const breadcrumbUrlOverride = routeConfig?.data?.['breadcrumbUrl'];
      const url = breadcrumbUrlOverride
        ? '/' + parentUrl.concat(breadcrumbUrlOverride).join('/')
        : '/' + routeUrl.join('/');

      this.pushBreadcrumb(breadcrumbs, { label: staticLabel, url });
    }

    const resolveKeys = routeConfig?.resolve ? Object.keys(routeConfig.resolve) : [];
    const dynamicKey = resolveKeys.find((key) => this.dynamicBreadcrumbResolveKeys.includes(key));

    if (dynamicKey && route.data[dynamicKey]) {
      this.pushBreadcrumb(breadcrumbs, {
        label: route.data[dynamicKey],
        url: '/' + routeUrl.join('/'),
      });
    }

    this.buildBreadcrumbTree(route.firstChild, routeUrl, breadcrumbs);
  }

  private pushBreadcrumb(breadcrumbs: Breadcrumb[], breadcrumb: Breadcrumb): void {
    const previous = breadcrumbs[breadcrumbs.length - 1];

    if (!previous || previous.url !== breadcrumb.url) {
      breadcrumbs.push(breadcrumb);
    }
  }
}
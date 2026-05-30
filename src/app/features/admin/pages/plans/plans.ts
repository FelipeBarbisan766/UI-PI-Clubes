import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { Plan, ServiceSubscription } from '../../services/service-subscription';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans implements OnInit {
  private readonly router = inject(Router);
  private readonly subscriptionService = inject(ServiceSubscription);

  readonly plans = signal<Plan[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  /** Marks the plan at index 1 as "popular" when there are ≥ 2 plans. */
  readonly popularPlanId = computed<string | null>(() => {
    const list = this.plans();
    return list.length >= 2 ? (list[1]?.id ?? null) : null;
  });

  /** Skeleton placeholder indices — defined here to avoid inline arrays in templates. */
  readonly skeletonItems = [1, 2, 3] as const;

  ngOnInit(): void {
    this.subscriptionService
      .getPlans()
      .pipe(take(1))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message);
        },
      });
  }

  selectPlan(planId: string): void {
    this.router.navigate(['/payment'], { queryParams: { planId } });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDuration(days: number): string {
    if (days === 30) return '/mês';
    if (days === 365) return '/ano';
    return `/ ${days} dias`;
  }

  retryLoad(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.ngOnInit();
  }
}
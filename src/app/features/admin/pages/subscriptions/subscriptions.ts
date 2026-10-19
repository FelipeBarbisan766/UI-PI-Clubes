import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ActiveSubscription,
  ServiceSubscription,
} from '../../services/service-subscription';
import { ServiceSubscriptionUsage } from '../../services/service-subscription-usage';

/** Forma mínima de um recurso com limite (compatível com ResourceUsageDTO). */
interface UsageLike {
  readonly used: number;
  readonly limit: number;
}

/** A partir deste percentual o uso é destacado como "quase no limite". */
const WARNING_THRESHOLD = 80;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

@Component({
  selector: 'app-subscription',
  imports: [RouterLink],
  templateUrl: './subscriptions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscriptions implements OnInit {
  private readonly subscriptionService = inject(ServiceSubscription);
  private readonly usageService = inject(ServiceSubscriptionUsage);
  private readonly destroyRef = inject(DestroyRef);

  // ─── State ─────────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly subscription = signal<ActiveSubscription | null>(null);
  readonly usage = this.usageService.usage;

  // ─── Derived state ─────────────────────────────────────────────────────
  readonly daysUntilExpiry = computed(() => {
    const sub = this.subscription();
    if (!sub) return 0;
    const expiry = new Date(sub.expiresAt).getTime();
    return Math.max(0, Math.ceil((expiry - Date.now()) / MS_PER_DAY));
  });

  readonly isExpiringSoon = computed(
    () => this.subscription() !== null && this.daysUntilExpiry() <= 7,
  );

  /** Verdadeiro se clubes ou quadras de algum clube já bateram no limite. */
  readonly limitReached = computed(() => {
    const usage = this.usage();
    if (!usage) return false;
    return (
      this.isAtLimit(usage.clubs) ||
      usage.clubsCourtUsage.some((club) => this.isAtLimit(club))
    );
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    forkJoin({
      subscription: this.subscriptionService.getActiveSubscription(),
      usage: this.usageService.load(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ subscription }) => {
          this.subscription.set(subscription);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  // ─── Display helpers ───────────────────────────────────────────────────
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  percent(resource: UsageLike): number {
    if (resource.limit <= 0) return 0;
    return Math.min(100, Math.round((resource.used / resource.limit) * 100));
  }

  isAtLimit(resource: UsageLike): boolean {
    return resource.limit > 0 && resource.used >= resource.limit;
  }

  isNearLimit(resource: UsageLike): boolean {
    return !this.isAtLimit(resource) && this.percent(resource) >= WARNING_THRESHOLD;
  }
}
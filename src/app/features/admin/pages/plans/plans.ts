import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, from, of, switchMap, take } from 'rxjs';
import {
  ActiveSubscription,
  Plan,
  ServiceSubscription,
} from '../../services/service-subscription';
import { AuthService } from '../../../../core/services/auth-service';
import { AdminService } from '../../../../core/services/admin-service';
import { AuthRequiredModalService } from '../../../../shared/components/auth-required-modal/auth-required-modal-service';
import {
  CustomPlanSelection,
  PlanCalculatorModal,
} from '../../../../shared/components/plan-calculator-modal/plan-calculator-modal';

@Component({
  selector: 'app-plans',
  imports: [PlanCalculatorModal],
  templateUrl: './plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly subscriptionService = inject(ServiceSubscription);
  private readonly authRequiredModal = inject(AuthRequiredModalService);

  private readonly calculatorModal = viewChild.required(PlanCalculatorModal);

  readonly plans = signal<Plan[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false); // separado do isLoading para não esconder os cards
  readonly errorMessage = signal('');

  readonly me = this.authService.me;
  readonly currentUserId = computed(() => this.me()?.id ?? '');
  readonly isAdmin = computed(() => this.me()?.role?.trim().toLowerCase() === 'admin');

  readonly activeSubscription = signal<ActiveSubscription | null>(null);

  /** Id do plano contratado hoje (null se não há assinatura ativa). */
  readonly currentPlanId = computed<string | null>(() => {
    const sub = this.activeSubscription();
    return sub?.isActive ? sub.planId : null;
  });

  /** O selo "Mais popular" só faz sentido para quem ainda não tem plano. */
  readonly popularPlanId = computed<string | null>(() => {
    if (this.currentPlanId()) return null;
    const list = this.plans();
    return list.length >= 2 ? (list[1]?.id ?? null) : null;
  });

  readonly skeletonItems = [1, 2, 3] as const;

  ngOnInit(): void {
    this.loadPlans();
  }

  selectPlan(planId: string): void {
    if (this.isSubmitting()) return;

    const plan = this.plans().find((p) => p.id === planId);
    if (!plan || this.isCurrent(plan)) return;

    if (!this.requireLogin()) return;

    this.startCheckout(() => (this.isFree(plan) ? this.goToAdminArea() : this.goToPayment(plan)));
  }

  openCalculator(): void {
    this.calculatorModal().open();
  }

  selectCustomPlan(selection: CustomPlanSelection): void {
    if (this.isSubmitting()) return;
    if (!this.requireLogin()) return;

    this.startCheckout(() => this.goToCustomPayment(selection));
  }

  isFree(plan: Plan): boolean {
    return plan.price === 0;
  }

  isCurrent(plan: Plan): boolean {
    return plan.id === this.currentPlanId();
  }

  /** Botão do card fica inativo no plano atual e enquanto uma assinatura está em andamento. */
  isActionDisabled(plan: Plan): boolean {
    return this.isSubmitting() || this.isCurrent(plan);
  }

  formatPrice(price: number): string {
    return price === 0
      ? 'Grátis'
      : price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDuration(days: number): string {
    if (days === 30) return '/mês';
    if (days === 365) return '/ano';
    return `/ ${days} dias`;
  }

  retryLoad(): void {
    this.loadPlans();
  }

  private requireLogin(): boolean {
    if (this.currentUserId()) return true;

    this.authRequiredModal.show(
      'Você precisa estar logado para assinar um plano.',
      this.router.url,
    );
    return false;
  }

  private startCheckout(navigate: () => Observable<boolean>): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.ensureAdmin()
      .pipe(
        switchMap(() => navigate()),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) =>
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Não foi possível concluir a operação.',
          ),
      });
  }

  private ensureAdmin(): Observable<unknown> {
    if (this.isAdmin()) return of(null);

    return this.adminService.createAdmin().pipe(
      take(1),
      switchMap(() => this.authService.refreshMe()),
    );
  }

  private goToAdminArea(): Observable<boolean> {
    return from(this.router.navigate(['/admin/clubs']));
  }

  private goToPayment(plan: Plan): Observable<boolean> {
    return from(this.router.navigate(['/payment'], { queryParams: { planId: plan.id } }));
  }

  private goToCustomPayment(selection: CustomPlanSelection): Observable<boolean> {
    return from(
      this.router.navigate(['/payment'], {
        queryParams: {
          custom: true,
          clubQuantity: selection.clubQuantity,
          courtQuantity: selection.courtQuantity,
          durationMonths: selection.durationMonths,
        },
      }),
    );
  }

  private loadPlans(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      plans: this.subscriptionService.getPlans(),
      // Visitante sem login ou falha aqui não deve esconder a lista de planos.
      active: this.subscriptionService.getActiveSubscription().pipe(catchError(() => of(null))),
    })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ plans, active }) => {
          this.plans.set(plans);
          this.activeSubscription.set(active);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message);
        },
      });
  }
}
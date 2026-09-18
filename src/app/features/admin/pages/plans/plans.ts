import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap, take } from 'rxjs';
import { Plan, ServiceSubscription } from '../../services/service-subscription';
import { AuthService } from '../../../../core/services/auth-service';
import { AdminService } from '../../../../core/services/admin-service';
import { AuthRequiredModalService } from '../../../../shared/components/auth-required-modal/auth-required-modal-service';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans implements OnInit {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly subscriptionService = inject(ServiceSubscription);
   private readonly authRequiredModal = inject(AuthRequiredModalService);

  readonly plans = signal<Plan[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');


  readonly me = this.authService.me;
  readonly currentUserId = computed(() => this.me()?.id ?? '');

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
    const userId = this.currentUserId();
    if (!userId) {
      this.authRequiredModal.show(
        'Você precisa estar logado para assinar um plano.',
        this.router.url,
      );
      return;
    }
    var turnAdmin = this.beAdmin();
    if (!turnAdmin) {
      this.errorMessage.set('Não foi possível tornar-se administrador. Faça login novamente.');
      return;
    }
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
  beAdmin(): boolean {
    const userId = this.currentUserId();
    if (!userId) {
      this.authRequiredModal.show(
        'Você precisa estar logado para assinar um plano.',
        this.router.url,
      );
      return false;
    }
    

    this.isLoading.set(true);
    this.errorMessage.set('');
    // this.successMessage.set('');

    this.adminService
      .createAdmin()
      .pipe(
        take(1),
        switchMap(() => this.authService.refreshMe()),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          // console.log('Admin role assigned and session refreshed successfully');
          // this.successMessage.set('Perfil de administrador salvo com sucesso.');
          return true;
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao salvar perfil de administrador.',
          );
          return false;
        },
      });

    return true;

  }
}
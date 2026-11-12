import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResourceTable } from '../../../shared/components/resource-table/resource-table';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';
import { Field } from '../models/resource-table.model';
import { Plan } from '../models/model-plan';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { ServicePlan } from '../services/service-plans';

type ToastState = { message: string; type: 'success' | 'error' | 'warning' | 'info' };

@Component({
  selector: 'app-root-plans',
  imports: [ResourceTable, ToastAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-plans.html',
})
export class RootPlans implements OnInit {
  protected readonly planService = inject(ServicePlan);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly toast = signal<ToastState | null>(null);

  protected readonly fields: Field<Plan>[] = [
    { key: 'name', label: 'Plano' },
    // Só no formulário: descrições longas quebram o layout da tabela.
    { key: 'description', label: 'Descrição', hideInTable: true },
    {
      key: 'price',
      label: 'Mensalidade (R$)',
      type: 'number',
      format: (r) =>
        r.price === 0
          ? 'Grátis'
          : r.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    { key: 'quantClub', label: 'Máx. clubes', type: 'number' },
    { key: 'quantCourt', label: 'Máx. quadras', type: 'number' },
    {
      key: 'durationDays',
      label: 'Duração (dias)',
      type: 'number',
      format: (r) => `${r.durationDays} dias`,
    },
    {
      key: 'isActive',
      label: 'Ativo',
      type: 'boolean',
      display: 'status',
      hideInForm: true,
      format: (r) => (r.isActive ? 'ativo' : 'suspenso'),
    },
  ];

  protected readonly searchKeys: (keyof Plan & string)[] = ['name'];

  // id vazio: o backend gera o id real no create.
  protected readonly newPlan = (): Plan => ({
    id: '',
    name: '',
    description: '',
    price: 0,
    quantClub: 1,
    quantCourt: 1,
    durationDays: 30,
    isActive: true,
  });

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.planService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) => {
          this.planService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onCreate(plan: Plan): void {
    this.planService
      .create({
        name: plan.name.trim(),
        description: plan.description.trim(),
        price: plan.price,
        quantClub: plan.quantClub,
        quantCourt: plan.quantCourt,
        durationDays: plan.durationDays,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Plano criado com sucesso!', 'success');
          this.loadPlans();
        },
        error: (err: unknown) => {
          this.planService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onUpdate(plan: Plan): void {
    this.planService
      .update(plan.id, {
        name: plan.name.trim(),
        description: plan.description.trim(),
        price: plan.price,
        quantClub: plan.quantClub,
        quantCourt: plan.quantCourt,
        durationDays: plan.durationDays,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Plano atualizado com sucesso!', 'success');
          this.loadPlans();
        },
        error: (err: unknown) => {
          this.planService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected onDelete(plan: Plan): void {
    this.planService
      .delete(plan.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showToast(`"${plan.name}" removido.`, 'success'),
        error: (err: unknown) => {
          this.planService.clearError();
          this.showToast(getApiErrorMessage(err), 'error');
        },
      });
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }

  private showToast(message: string, type: ToastState['type']): void {
    this.toast.set({ message, type });
  }
}
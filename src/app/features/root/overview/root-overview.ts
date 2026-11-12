import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ServiceOverview } from '../services/service-overview';
import { PaymentHistoryDto } from '../models/model-overview';
import { ServicePayment } from '../services/servive-payment';

type StatIcon = 'users' | 'clubs' | 'plans' | 'sports' | 'flags';

interface Stat {
  label: string;
  value: number | null;
  icon: StatIcon;
  url: string;
}

/** Quantos pagamentos aparecem na tabela (os mais recentes). */
const MAX_PAYMENTS = 10;

const METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  ticket: 'Boleto',
  bolbradesco: 'Boleto',
};

@Component({
  selector: 'app-root-overview',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './root-overview.html',
})
export class RootOverview implements OnInit {
  protected readonly overviewService = inject(ServiceOverview);
  protected readonly paymentService = inject(ServicePayment);
  private readonly destroyRef = inject(DestroyRef);

  // --- Cards de resumo (valores vêm de GET /root/overview) ---
  protected readonly stats = computed<Stat[]>(() => {
    const o = this.overviewService.overview();
    return [
      { label: 'Usuários', value: o?.totalUsers ?? null, icon: 'users', url: '/root/usuarios' },
      { label: 'Clubes', value: o?.totalClubs ?? null, icon: 'clubs', url: '/root/clubes' },
      { label: 'Planos', value: o?.totalPlans ?? null, icon: 'plans', url: '/root/planos' },
      { label: 'Esportes', value: o?.totalSports ?? null, icon: 'sports', url: '/root/esportes' },
      { label: 'Flags', value: o?.totalFlags ?? null, icon: 'flags', url: '/root/flags' },
    ];
  });

  // --- Pagamentos (GET /payments/overview): mais recentes primeiro ---
  protected readonly recentPayments = computed(() =>
    [...this.paymentService.payments()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_PAYMENTS),
  );

  ngOnInit(): void {
    this.loadOverview();
    this.loadPayments();
  }

  protected loadOverview(): void {
    this.overviewService
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined }); // o erro já fica no signal do service
  }

  protected loadPayments(): void {
    this.paymentService
      .getOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  // --- Helpers de exibição ---

  protected formatAmount(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  protected methodLabel(payment: PaymentHistoryDto): string {
    if (!payment.method) return '—';
    return METHOD_LABELS[payment.method.toLowerCase()] ?? payment.method;
  }

  protected statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
      case 'aprovado':
      case 'pago':
        return 'badge badge-soft badge-success';
      case 'pending':
      case 'in_process':
      case 'pendente':
        return 'badge badge-soft badge-warning';
      case 'rejected':
      case 'cancelled':
      case 'failed':
      case 'refunded':
      case 'recusado':
      case 'cancelado':
        return 'badge badge-soft badge-error';
      default:
        return 'badge badge-soft badge-neutral';
    }
  }
}
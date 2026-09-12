import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { finalize, switchMap, take } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { AdminService } from '../../../../core/services/admin-service';

@Component({
  selector: 'app-register-club',
  imports: [],
  templateUrl: './register-club.html',
  styleUrl: './register-club.css',
})
export class RegisterClub {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly adminService = inject(AdminService);
  private readonly injector = inject(Injector);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly me = this.authService.me;
  readonly currentUserId = computed(() => this.me()?.id ?? '');

  readonly beAdminEvent = output<void>();

  readonly openFaqIndex = signal<number | null>(null);

  readonly faqs = [
    {
      question: 'Preciso pagar para cadastrar meu clube?',
      answer:
        'Sim. O pagamento é feito através do plano de assinatura do seu clube. O valor depende do tipo de clube que você deseja registrar.',
    },
    {
      question: 'Quanto tempo leva para meu clube estar ativo?',
      answer:
        'Em menos de 15 minutos seu clube já estará configurado e visível. Basta preencher as informações, cadastrar as quadras e definir os horários.',
    },
    {
      question: 'Posso gerenciar mais de uma quadra?',
      answer:
        'Sim! A quantidade de quadras disponíveis depende do seu plano de assinatura. Cada uma pode ter horários, preços e disponibilidade próprios.',
    },
    {
      question: 'Como recebo o dinheiro das reservas?',
      answer:
        'O pagamento é combinado diretamente com o dono da quadra, fora do site. Nós apenas fornecemos os canais de contato para que vocês acertem o valor e a forma de pagamento.',
    },
  ];

  ngOnInit(): void {
    this.scrollToTop();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.update((current) => (current === index ? null : index));
  }

  goToPlans() {
    void this.router.navigateByUrl('/plans');
  }

  private scrollToTop(): void {
    afterNextRender(() => this.viewportScroller.scrollToAnchor('top-section'), {
      injector: this.injector,
    });
  }
}

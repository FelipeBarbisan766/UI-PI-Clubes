import { afterNextRender, Component, computed, inject, Injector, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { finalize, switchMap, take } from 'rxjs';
import { FormAdminService } from '../../../../core/services/formAdmin-service';
import { ViewportScroller } from '@angular/common';

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
  private readonly adminService = inject(FormAdminService);
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
        'Sim, Você só paga o plano de assinatura referente ao seu clube, tudo dependerá do tipo de clube que voce tem e pretende registrar.',
    },
    {
      question: 'Quanto tempo leva para meu clube estar ativo?',
      answer:
        'Em menos de 15 minutos você pode ter seu clube configurado e visível para os jogadores. Basta preencher as informações, cadastrar as quadras e definir os horários.',
    },
    {
      question: 'Posso gerenciar mais de uma quadra?',
      answer:
        'Sim! Você pode cadastrar quantas quadras quiser dentro do seu clube, cada uma com seus próprios horários, preços e disponibilidade.',
    },
    {
      question: 'Como recebo o dinheiro das reservas?',
      answer:
        'Os pagamentos são responsabilidade do dono de quadras, nos disponibilizamos meios de comunição para que o valor seja acertado do meio desejado por fora do site.',
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

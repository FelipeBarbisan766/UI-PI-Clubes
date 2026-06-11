import { Component, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { finalize, switchMap, take } from 'rxjs';
import { FormPlayerService } from '../../../../core/services/formPlayer-service';
import { FormAdminService } from '../../../../core/services/formAdmin-service';

@Component({
  selector: 'app-select-role',
  imports: [],
  templateUrl: './select-role.html',
  styleUrl: './select-role.css',
})
export class SelectRole {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly adminService = inject(FormAdminService);

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
        'Não. O cadastro e a configuração inicial são gratuitos. Você só paga uma pequena taxa sobre as reservas realizadas pela plataforma.',
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
        'Os pagamentos são processados online e repassados diretamente para a sua conta bancária. Você acompanha tudo pelo painel financeiro em tempo real.',
    },
  ];

  toggleFaq(index: number): void {
    this.openFaqIndex.update((current) => (current === index ? null : index));
  }

  beAdmin() {
    const userId = this.currentUserId();
    if (!userId) {
      this.errorMessage.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService
      .createAdmin(userId)
      .pipe(
        take(1),
        switchMap(() => this.authService.refreshMe()),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          console.log('Admin role assigned and session refreshed successfully');
          this.successMessage.set('Perfil de administrador salvo com sucesso.');

          void this.router.navigateByUrl('/admin/clubs');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao salvar perfil de administrador.',
          );
        },
      });

    this.beAdminEvent.emit();
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { finalize, take } from 'rxjs';
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

  private readonly playerService = inject(FormPlayerService);
  private readonly adminService = inject(FormAdminService);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly me = this.authService.me;
  readonly currentUserId = computed(() => this.me()?.id ?? '');

  bePlayer() {
    const userId = this.currentUserId();
    if (!userId) {
      this.errorMessage.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.playerService
      .createPlayer(userId)
      .pipe(
        take(1),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Perfil de jogador salvo com sucesso.');
          void this.router.navigateByUrl('/clubs');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof Error ? error.message : 'Erro ao salvar perfil de jogador.',
          );
        },
      });
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

    this.adminService.createAdmin(userId).pipe(
      take(1),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.successMessage.set('Perfil de administrador salvo com sucesso.');
        void this.router.navigateByUrl('/plans');
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Erro ao salvar perfil de administrador.'
        );
      },
    });
  }

  onLogout(): void {
    this.authService
      .logout()
      .pipe(take(1))
      .subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: () => void this.router.navigateByUrl('/login'),
      });
  }
}

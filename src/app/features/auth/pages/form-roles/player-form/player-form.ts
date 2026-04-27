import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth-service'; 
import { FormPlayerService } from '../../../../../core/services/formPlayer-service';

@Component({
  selector: 'app-player-form',
  imports: [ReactiveFormsModule],
  templateUrl: './player-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerForm {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly playerService = inject(FormPlayerService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly me = this.authService.me;
  readonly currentUserId = computed(() => this.me()?.id ?? '');

  readonly form = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    contactNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.currentUserId();
    if (!userId) {
      this.errorMessage.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      ...this.form.getRawValue(),
      userId,
    };

    this.playerService.createPlayer(payload).pipe(
      take(1),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.successMessage.set('Perfil de jogador salvo com sucesso.');
        void this.router.navigateByUrl('/clubs-list');
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Erro ao salvar perfil de jogador.'
        );
      },
    });
  }

  hasError(controlName: 'userName' | 'contactNumber' | 'description'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}

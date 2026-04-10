import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { ServiceVerifymail } from '../../services/service-verifymail';

type VerifyStatus = 'pending' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-mail',
  imports: [],
  templateUrl: './verify-mail.html',
  styleUrl: './verify-mail.css',
})
export class VerifyMail {
  private router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly verifyMailService = inject(ServiceVerifymail);

  readonly status = signal<VerifyStatus>('pending');
  readonly successMessage = signal('E-mail verificado com sucesso.');
  readonly errorMessage = signal('Não foi possível verificar seu e-mail.');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('pending');
      return;
    }

    this.status.set('loading');

    this.verifyMailService
  .verifyEmail(token)
  .pipe(take(1))
  .subscribe({
    next: (result) => {
      this.status.set('success');
      this.successMessage.set(result.message);
      this.router.navigate(['/login']);
    },
    error: (error: unknown) => {
      this.status.set('error');
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Link inválido ou expirado.'
      );
    },
  });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

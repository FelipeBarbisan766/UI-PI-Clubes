import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceSignUp } from '../services/service-sign-up';
import { ToastAlert } from '../../../shared/components/toast-alert/toast-alert';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ToastAlert],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUp {
  private fb = inject(NonNullableFormBuilder);
  private signUpService = inject(ServiceSignUp);
  private router = inject(Router);
  
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
   
  form = this.fb.group({
    name: ['', [
      Validators.required, 
      Validators.minLength(3)
    ]],
    email: ['', [
      Validators.required, 
      Validators.email
    ]],
    phoneNumber: ['', [
      Validators.required, 
      Validators.pattern(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
    ]],
    password: ['', [
      Validators.required, 
      Validators.minLength(6)
    ]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.form.getRawValue();

    this.signUpService.signUp(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isSubmitting.set(false);

        const msg = error.error?.message || 'Ocorreu um erro ao tentar criar a conta. Verifique os dados e tente novamente.';
        this.errorMessage.set(msg);
      }
    })
    
  }
}

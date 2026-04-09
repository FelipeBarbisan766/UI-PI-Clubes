import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceSignUp } from '../../register/services/service-sign-up';
import { Router } from '@angular/router';
import { ToastAlert } from "../../../shared/components/toast-alert/toast-alert";

@Component({
  selector: 'app-player-form',
  imports: [ToastAlert, ReactiveFormsModule],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
})
export class PlayerForm {
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
        this.router.navigate(['/clubs']);
      },
      error: (error) => {
        this.isSubmitting.set(false);

        const msg = error.error?.message || 'Ocorreu um erro ao tentar criar a conta. Verifique os dados e tente novamente.';
        this.errorMessage.set(msg);
      }
    })
    
  }
}

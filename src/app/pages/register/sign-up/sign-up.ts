import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUp {
  private fb = inject(NonNullableFormBuilder);
  
  isSubmitting = signal(false);

   
  form = this.fb.group({
    name: ['', [
      Validators.required, 
      Validators.minLength(3)
    ]],
    email: ['', [
      Validators.required, 
      Validators.email
    ]],
    phone: ['', [
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

    setTimeout(() => {
      console.log('Dados enviados:', this.form.getRawValue());
      this.isSubmitting.set(false);
    }, 2000);
  }
}

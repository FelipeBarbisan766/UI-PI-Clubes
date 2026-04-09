import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: FormGroup;
  isSubmitting = signal(false);

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: [''],
      password: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      // Adicionar lógica de login aqui
      console.log(this.form.value);

      setTimeout(() => {
        this.isSubmitting.set(false);
      }, 2000);
    }
  }

  goToRoles() {
    this.router.navigate(['/select']) 
  }
}

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-select-role',
  imports: [],
  templateUrl: './select-role.html',
  styleUrl: './select-role.css',
})
export class SelectRole {

  private router = inject(Router);

  goToPlayerForm(){
    this.router.navigate(['/player-form'])
  }

  goToAdminForm(){
    this.router.navigate(['/admin-form'])
  }
}

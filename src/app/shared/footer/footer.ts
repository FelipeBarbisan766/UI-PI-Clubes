import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})

export class Footer {
  private readonly AuthService = inject(AuthService);
  private readonly me = toSignal(this.AuthService.getMe(), { initialValue: null });

  protected isRoot(): boolean {
    return this.me()?.role === 'Root';
  }
  
}

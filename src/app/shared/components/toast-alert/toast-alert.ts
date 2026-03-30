import { Component, ChangeDetectionStrategy, input, output, DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-toast-alert',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-alert.html',
  styleUrl: './toast-alert.css',
})
export class ToastAlert {
  message = input.required<string>();
  type = input<'success' | 'error' | 'warning' | 'info'>('error');
  
  duration = input<number>(5000); 
  
  dismiss = output<void>();

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (this.duration() > 0) {
      const timeoutId = setTimeout(() => {
        this.onDismiss();
      }, this.duration());

      this.destroyRef.onDestroy(() => {
        clearTimeout(timeoutId);
      });
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}

import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// Importe o toSignal
import { toSignal } from '@angular/core/rxjs-interop'; 
import { ServiceCourt } from '../../services/service-court';
import { TypeEnum, SurfaceEnum } from '../../models/model-court';

@Component({
  selector: 'app-create-court',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './courts.html',
})
export class Courts {
  private fb = inject(FormBuilder);
  private courtService = inject(ServiceCourt);
  private router = inject(Router);

  readonly typeOptions = Object.values(TypeEnum);
  readonly surfaceOptions = Object.values(SurfaceEnum);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  selectedFiles = signal<File[]>([]);

  form = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(3)]],
    type:         [null as TypeEnum | null, Validators.required],
    surface:      [null as SurfaceEnum | null, Validators.required],
    isCovered:    [false],
    pricePerHour: [null as number | null, [Validators.required, Validators.min(0)]],
    description:  ['', Validators.required],
    clubId:       ['', Validators.required],
  });

  formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  isFormValid = computed(() => this.formStatus() === 'VALID' && this.selectedFiles().length > 0);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    const { name, type, surface, isCovered, pricePerHour, description, clubId } = this.form.value;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.courtService.create({
      name: name!,
      type: type!,
      surface: surface!,
      isCovered: isCovered!,
      pricePerHour: pricePerHour!,
      description: description!,
      clubId: clubId!,
      images: this.selectedFiles(),
    }).subscribe({
      next: () => this.router.navigate(['/courts']),
      error: (err) => {
        this.errorMessage.set(err?.message ?? 'Erro ao criar quadra.');
        this.isLoading.set(false);
      },
    });
  }
}
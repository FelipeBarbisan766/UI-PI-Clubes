import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceClub } from '../../services/service-club';
import { ResponseClubDTO } from '../../models/model-club';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clubs.html',
})
export class Clubs implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly clubService = inject(ServiceClub);

  // --- Local state ---
  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly deleteConfirmId = signal<string | null>(null);

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  // --- Form ---
  protected readonly form = this.fb.group({
    adminId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: ['', Validators.required],
    description: ['', Validators.required],
    zipCode: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    neighborhood: ['', Validators.required],
    complement: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly isSubmitEnabled = computed(() => {
    if (this.formMode() === 'create') {
      return this.formStatus() === 'VALID' && this.selectedFiles().length > 0;
    }
    return this.formStatus() === 'VALID';
  });

  ngOnInit(): void {
    this.clubService.getAll().subscribe();
  }

  // --- Form actions ---

  protected openCreate(): void {
    this.form.reset({
      adminId: '',
      name: '',
      phoneNumber: '',
      description: '',
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      complement: '',
      city: '',
      state: '',
      country: '',
    });
    this.form.get('adminId')?.enable();
    this.selectedFiles.set([]);
    this.editingId.set(null);
    this.formMode.set('create');
  }

  protected openEdit(id: string): void {
    this.clubService.getById(id).subscribe({
      next: (club) => {
        this.form.reset({
          adminId: '',
          name: club.name,
          phoneNumber: club.phoneNumber,
          description: club.description,
          zipCode: club.zipCode,
          street: club.street,
          number: club.number,
          neighborhood: club.neighborhood,
          complement: club.complement ?? '',
          city: club.city,
          state: club.state,
          country: club.country,
        });
        this.form.get('adminId')?.disable();
        this.selectedFiles.set([]);
        this.editingId.set(id);
        this.formMode.set('edit');
      },
    });
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.form.get('adminId')?.enable();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  protected removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  protected onSubmit(): void {
    if (!this.isSubmitEnabled()) {
      this.form.markAllAsTouched();
      return;
    }

    const { adminId, name, phoneNumber, description, zipCode, street, number, neighborhood, complement, city, state, country } =
      this.form.getRawValue();

    if (this.formMode() === 'create') {
      this.clubService
        .create({
          adminId: adminId!,
          name: name!,
          phoneNumber: phoneNumber!,
          description: description!,
          zipCode: zipCode!,
          street: street!,
          number: number!,
          neighborhood: neighborhood!,
          complement: complement ?? undefined,
          city: city!,
          state: state!,
          country: country!,
          images: this.selectedFiles(),
        })
        .subscribe({
          next: () => {
            this.closeForm();
          },
          error: (err: unknown) => {
            console.error('Erro ao criar clube', err);
          },
        });
    } else {
      const id = this.editingId();
      if (id === null) return;

      this.clubService
        .update(id, {
          name: name!,
          phoneNumber: phoneNumber!,
          description: description!,
          zipCode: zipCode!,
          street: street!,
          number: number!,
          neighborhood: neighborhood!,
          complement: complement ?? undefined,
          city: city!,
          state: state!,
          country: country!,
        })
        .subscribe({ next: () => this.closeForm() });
    }
  }

  // --- Delete ---

  protected requestDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (id === null) return;
    this.clubService
      .delete(id)
      .subscribe({ next: () => this.deleteConfirmId.set(null) });
  }

  protected cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  // --- Helpers ---

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}

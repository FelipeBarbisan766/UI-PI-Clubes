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
import { AuthService } from '../../../../core/services/auth-service';
import { Modal } from "../../../../shared/components/modal/modal"; 

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clubs.html',
})
export class Clubs implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  protected readonly clubService = inject(ServiceClub);

  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly deleteConfirmId = signal<string | null>(null);

  private adminId: string | null = null;

  protected readonly isFormOpen = computed(() => this.formMode() !== null);
  protected readonly isEditing = computed(() => this.formMode() === 'edit');

  protected readonly form = this.fb.group({
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


  protected openCreate(): void {
    this.form.reset({
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
    this.selectedFiles.set([]);
    this.editingId.set(null);
    this.formMode.set('create');
  }

  protected openEdit(id: string): void {
    this.clubService.getById(id).subscribe({
      next: (club) => {
        this.form.reset({
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
        this.selectedFiles.set([]);
        this.editingId.set(id);
        this.formMode.set('edit');
      },
    });
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.adminId = null;
    this.form.reset();
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

    if (this.formMode() === 'create') {
      this._submitCreate();
    } else {
      this._submitUpdate();
    }
  }

  private _submitCreate(): void {
    if (this.adminId) {
      this._dispatchCreate(this.adminId);
      return;
    }

    this.authService.getAdminMe().subscribe({
      next: (admin) => {
        this.adminId = admin.id;
        this._dispatchCreate(admin.id);
      },
      error: (err: unknown) => {
        console.error('Não foi possível obter o perfil do administrador.', err);
      },
    });
  }

  private _dispatchCreate(adminId: string): void {
    const { name, phoneNumber, description, zipCode, street, number, neighborhood, complement, city, state, country } =
      this.form.getRawValue();

    this.clubService
      .create({
        adminId,
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
        next: () => this.closeForm(),
        error: (err: unknown) => {
          console.error('Erro ao criar clube', err);
        },
      });
  }

  private _submitUpdate(): void {
    const id = this.editingId();
    if (id === null) return;

    const { name, phoneNumber, description, zipCode, street, number, neighborhood, complement, city, state, country } =
      this.form.getRawValue();

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


  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
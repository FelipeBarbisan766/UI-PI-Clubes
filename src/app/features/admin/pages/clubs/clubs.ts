import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServiceClub } from '../../services/service-club';
import { AuthService } from '../../../../core/services/auth-service';
import { Modal } from '../../../../shared/components/modal/modal';
import { ViaCepService } from '../../../../core/services/via-cep'; 
import { NgxMaskDirective } from 'ngx-mask';

type FormMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule, Modal, NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './clubs.html',
})
export class Clubs implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly viaCepService = inject(ViaCepService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly me = this.authService.me;
  readonly displayName = computed(() => this.me()?.name?.trim() || 'Usuário');
  readonly initials = computed(() => {
    const name = this.me()?.name?.trim();
    if (!name) {
      return 'U';
    }
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly clubService = inject(ServiceClub);

  protected readonly formMode = signal<FormMode>(null);
  protected readonly selectedFiles = signal<File[]>([]);

  private adminId: string | null = null;

  protected readonly isFormOpen = computed(() => this.formMode() !== null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: [''],
    description: [''],
    zipCode: ['', Validators.required],
    street: ['', Validators.required],
    number: [''],
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
      return this.formStatus() === 'VALID';
    }
    return this.formStatus() === 'VALID';
  });

  ngOnInit(): void {
    this.authService.getAdminMe().subscribe({
      next: (admin) => {
        this.adminId = admin.id;
        this.clubService.getAllByAdminId(this.adminId).subscribe();
      },
      error: (err: unknown) => {
        console.error('Não foi possível obter o perfil do administrador.', err);
      },
    });

    this.form.controls.zipCode.valueChanges
      .pipe(
        map((value) => (value ?? '').replace(/\D/g, '')),
        distinctUntilChanged(),
        debounceTime(300),
        filter((cep) => cep.length === 8),
        switchMap((cep) => this.viaCepService.getAddressByCep(cep)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (address) => {
          if (address.erro) {
            return;
          }

          this.form.patchValue({
            street: address.logradouro,
            neighborhood: address.bairro,
            city: address.localidade,
            state: address.uf,
            complement: address.complemento,
          });
        },
        error: (err: unknown) => {
          console.error('Erro ao buscar CEP', err);
        },
      });
  }

  // --- Navigation ---

  protected goToCourts(clubId: string): void {
    this.router.navigate(['/admin/club', clubId, 'courts']);
  }

  // --- Form actions ---

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
    this.formMode.set('create');
  }

  protected closeForm(): void {
    this.formMode.set(null);
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
      this.submitCreate();
    } else {
      return
    }
  }

  private submitCreate(): void {
    if (this.adminId) {
      this.dispatchCreate(this.adminId);
      return;
    }

    this.authService.getAdminMe().subscribe({
      next: (admin) => {
        this.adminId = admin.id;
        this.dispatchCreate(admin.id);
      },
      error: (err: unknown) => {
        console.error('Não foi possível obter o perfil do administrador.', err);
      },
    });
  }

  private dispatchCreate(adminId: string): void {
    const { name, phoneNumber, description, zipCode, street, number, neighborhood, complement, city, state, country } =
      this.form.getRawValue();

    this.clubService
      .create({
        adminId,
        name: name!,
        phoneNumber: phoneNumber ?? undefined,
        description: description ?? undefined,
        zipCode: zipCode!,
        street: street!,
        number: number ?? undefined,
        neighborhood: neighborhood!,
        complement: complement ?? undefined,
        city: city!,
        state: state!,
        country: country!,
        images: this.selectedFiles() ?? undefined,
      })
      .subscribe({
        next: () => this.closeForm(),
        error: (err: unknown) => {
          console.error('Erro ao criar clube', err);
        },
      });
  }

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
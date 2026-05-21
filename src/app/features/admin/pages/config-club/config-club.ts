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
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServiceClub } from '../../services/service-club';
import { Modal } from '../../../../shared/components/modal/modal';
import { ViaCepService } from '../../../../core/services/via-cep';
import { NgxMaskDirective } from 'ngx-mask';

type FormMode = 'edit' | null;

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule, Modal, NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './config-club.html',
})
export class ConfigClub implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viaCepService = inject(ViaCepService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clubService = inject(ServiceClub);

  protected readonly formMode = signal<FormMode>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly deleteConfirmOpen = signal(false);

  protected readonly isFormOpen = computed(() => this.formMode() !== null);

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

  private clubId: string = '';

  protected readonly isSubmitEnabled = computed(() => this.formStatus() === 'VALID');

  ngOnInit(): void {
    const clubId = 
      this.route.snapshot.paramMap.get('clubId') ??
      this.route.parent?.snapshot.paramMap.get('clubId') ??
      '';
    if (clubId) {
      this.clubId = clubId;
      this.clubService.getById(clubId).subscribe();
    }

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

  protected openEdit(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;

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
    this.editingId.set(this.clubId);
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset();
  }

  protected onSubmit(): void {
    if (!this.isSubmitEnabled()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitUpdate();
  }

  private submitUpdate(): void {
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
      .subscribe({
        next: () => this.closeForm(),
        error: (err: unknown) => {
          console.error('Erro ao atualizar clube', err);
        },
      });
  }

  // --- Delete ---

  protected requestDelete(): void {
    this.deleteConfirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;
    this.clubService
      .delete(this.clubId)
      .subscribe({ next: () => this.deleteConfirmOpen.set(false) });
  }

  protected cancelDelete(): void {
    this.deleteConfirmOpen.set(false);
  }

  // --- Helpers ---

  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
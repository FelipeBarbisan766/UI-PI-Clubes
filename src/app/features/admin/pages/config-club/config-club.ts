import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs/operators';
import { ServiceClub } from '../../services/service-club';
import { ViaCepService } from '../../../../core/services/via-cep';
import { NgxMaskDirective } from 'ngx-mask';
import { ToastAlert } from '../../../../shared/components/toast-alert/toast-alert';


type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-club',
  imports: [ReactiveFormsModule, NgxMaskDirective, ToastAlert],
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

  protected readonly deleteConfirmOpen = signal(false);
  protected readonly isSubmitting = signal(false);

  protected readonly toast = signal<{ message: string; type: ToastType } | null>(null);

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

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly isSubmitEnabled = computed(() => {
    this.formValue();
    this.formStatus();
    return this.form.dirty && this.form.valid;
  });

  private clubId: string = '';

  constructor() {
    effect(() => {
      const club = this.clubService.selectedClub();
      if (!club) return;

      this.form.patchValue(
        {
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
        },
        { emitEvent: false },
      );
      this.form.markAsPristine();
    });
  }

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


  protected goToCourts(clubId: string): void {
    this.router.navigate(['/admin/club', clubId, 'courts']);
  }


  protected onSubmit(): void {
    if (!this.isSubmitEnabled() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitUpdate();
  }

  private submitUpdate(): void {
    const {
      name,
      phoneNumber,
      description,
      zipCode,
      street,
      number,
      neighborhood,
      complement,
      city,
      state,
      country,
    } = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.clubService
      .update(this.clubId, {
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
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toast.set({ message: 'Clube atualizado com sucesso!', type: 'success' });
        },
        error: (err: unknown) => {
          console.error('Erro ao atualizar clube', err);
          this.toast.set({
            message: this.clubService.error() ?? 'Erro ao salvar as alterações.',
            type: 'error',
          });
        },
      });
  }

  protected onReset(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;

    this.form.patchValue({
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
    this.form.markAsPristine();
    this.toast.set(null);
  }

  protected dismissToast(): void {
    this.toast.set(null);
  }


  protected requestDelete(): void {
    this.deleteConfirmOpen.set(true);
  }

  protected confirmDelete(): void {
    const club = this.clubService.selectedClub();
    if (!club) return;
    this.clubService.delete(this.clubId).subscribe({
      next: () => this.deleteConfirmOpen.set(false),
      error: () => {
        this.toast.set({
          message: this.clubService.error() ?? 'Erro ao excluir o clube.',
          type: 'error',
        });
      },
    });
  }

  protected cancelDelete(): void {
    this.deleteConfirmOpen.set(false);
  }


  protected fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
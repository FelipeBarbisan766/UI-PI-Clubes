import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, of, switchMap } from 'rxjs';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { UserService } from '../../../../services/service-user';
import { FlagService } from '../../../../services/service-flag';
import { User } from '../../../../models/model-user';
import { UserFlag } from '../../../../models/model-flag';

@Component({
  selector: 'app-modal-user',
  templateUrl: './modalUser.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, DatePipe],
})
export class ModalUserComponent implements OnInit {
  userId = input.required<string>();
  close = output<void>();

  private userService = inject(UserService);
  private flagService = inject(FlagService);
  private destroyRef = inject(DestroyRef);

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  });

  readonly displayAvatarUrl = computed(() => {
    const url = this.user()?.avatarUrl;
    if (!url) return null;
    return url;
  });

  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  flags = signal<UserFlag[]>([]);
  flagsLoading = signal(false);
  flagsError = signal<string | null>(null);

  private userId$ = toObservable(this.userId);

  ngOnInit(): void {
    this.userId$
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          return this.userService.getByUserId(id);
        }),
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.error.set('Erro ao buscar usuário');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => this.user.set(user));

    this.userId$
      .pipe(
        switchMap((id) => {
          this.flagsLoading.set(true);
          this.flagsError.set(null);
          return this.flagService.getUserFlags(id).pipe(
            catchError(() => {
              this.flagsError.set('Não foi possível carregar os reports.');
              return of([] as UserFlag[]);
            }),
            finalize(() => this.flagsLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((flags) => this.flags.set(flags));
  }
}
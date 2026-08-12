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
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { UserService } from '../../../../services/service-user';
import { User } from '../../../../models/model-user';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-modal-user',
  templateUrl: './modalUser.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class ModalUserComponent implements OnInit {
  userId = input.required<string>();
  close = output<void>();

  private userService = inject(UserService);
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

  private userId$ = toObservable(this.userId);

  ngOnInit(): void {
    this.userId$
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          return this.userService.getById(id);
        }),
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.error.set('Erro ao buscar usuário');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => this.user.set(user));
  }
}

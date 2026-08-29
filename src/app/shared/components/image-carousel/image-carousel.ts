import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, interval, switchMap } from 'rxjs';

export interface CarouselImage {
  thumbUrl: string;
  mediumUrl: string;
  fullUrl: string;
}

@Component({
  selector: 'app-image-carousel',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block h-full w-full',
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
  templateUrl: './image-carousel.html',
})
export class ImageCarousel {
  readonly images = input<readonly CarouselImage[]>([]);
  readonly alt = input<string>('');
  readonly size = input<'thumb' | 'medium' | 'full'>('medium');
  readonly autoplay = input<boolean>(false);
  readonly autoplayMs = input<number>(5000);
  readonly priority = input<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);

  readonly activeIndex = signal(0);
  private readonly paused = signal(false);
  private touchStartX: number | null = null;

  readonly hasMultiple = computed(() => this.images().length > 1);

  readonly currentUrl = computed(() => {
    const imgs = this.images();
    if (!imgs.length) return null;
    const index = Math.min(this.activeIndex(), imgs.length - 1);
    const img = imgs[index];
    switch (this.size()) {
      case 'thumb':
        return img.thumbUrl;
      case 'full':
        return img.fullUrl;
      default:
        return img.mediumUrl; // ← era mediumUrl
    }
  });

  private readonly autoplayActive = computed(() => this.autoplay() && this.hasMultiple());

  constructor() {
    effect(() => {
      this.images();
      untracked(() => this.activeIndex.set(0));
    });

    toObservable(this.autoplayActive)
      .pipe(
        switchMap((active) => (active ? interval(this.autoplayMs()) : EMPTY)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.paused()) this.next();
      });
  }

  next(event?: Event): void {
    event?.stopPropagation();
    const len = this.images().length;
    if (!len) return;
    this.activeIndex.update((i) => (i + 1) % len);
  }

  prev(event?: Event): void {
    event?.stopPropagation();
    const len = this.images().length;
    if (!len) return;
    this.activeIndex.update((i) => (i - 1 + len) % len);
  }

  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    this.activeIndex.set(index);
  }

  onPointerEnter(): void {
    this.paused.set(true);
  }

  onPointerLeave(): void {
    this.paused.set(false);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const delta = endX - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) this.prev();
    else this.next();
  }
}

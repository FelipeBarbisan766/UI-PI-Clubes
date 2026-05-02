import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { ServiceClub } from '../services/service-club';
import { ResponseClubDTO } from '../models/model-club';

@Component({
  selector: 'app-clubs-list',
  imports: [NgOptimizedImage],
  templateUrl: './clubs-list.html',
  styleUrl: './clubs-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClubsList implements OnInit {
  private readonly clubService = inject(ServiceClub);
  private readonly router = inject(Router);

  // --- Selectors from service ---
  readonly clubs = this.clubService.clubs;
  readonly loading = this.clubService.loading;
  readonly error = this.clubService.error;
  readonly isEmpty = this.clubService.isEmpty;
  readonly clubsCount = this.clubService.clubsCount;

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.clubService.getAll().subscribe();
  }

  selectClub(club: ResponseClubDTO): void {
    this.router.navigate(['/clubs', club.id]);
  }

  getFirstImage(club: ResponseClubDTO): string | null {
    return club.imagesUrls?.length > 0 ? club.imagesUrls[0] : null;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  clearError(): void {
    this.clubService.clearError();
  }

  trackById(_index: number, club: ResponseClubDTO): string {
    return club.id;
  }
}

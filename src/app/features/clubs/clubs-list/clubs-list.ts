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
import { TypeEnum } from '../models/model-court';

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

// Mapa de TypeEnum → label legível
readonly typeLabels: Record<TypeEnum, string> = {
  [TypeEnum.None]:          'Outro',
  [TypeEnum.Futsal]:        'Futsal',
  [TypeEnum.Basquetebol]:   'Basquetebol',
  [TypeEnum.Basquete]:      'Basquete',
  [TypeEnum.Voleibol]:      'Vôlei',
  [TypeEnum.VôleiSentado]:  'Vôlei Sentado',
  [TypeEnum.Handebol]:      'Handebol',
  [TypeEnum.Netball]:       'Netball',
  [TypeEnum.Tênis]:         'Tênis',
  [TypeEnum.Badminton]:     'Badminton',
  [TypeEnum.Squash]:        'Squash',
  [TypeEnum.Padel]:         'Padel',
  [TypeEnum.Pickleball]:    'Pickleball',
  [TypeEnum.TênisDeMesa]:   'Tênis de Mesa',
  [TypeEnum.Judô]:          'Judô',
  [TypeEnum.Karatê]:        'Karatê',
  [TypeEnum.Taekwondo]:     'Taekwondo',
  [TypeEnum.Esgrima]:       'Esgrima',
  [TypeEnum.SepakTakraw]:   'Sepak Takraw',
  [TypeEnum.Hóquei]:        'Hóquei',
  [TypeEnum.Dodgeball]:     'Dodgeball',
  [TypeEnum.Raquetebol]:    'Raquetebol',
  [TypeEnum.PelotaBasca]:   'Pelota Basca',
  [TypeEnum.Floorball]:     'Floorball',
  [TypeEnum.Korfball]:      'Korfball',
  [TypeEnum.Tchoukball]:    'Tchoukball',
  [TypeEnum.Goalball]:      'Goalball',
  [TypeEnum.Futebol]:       'Futebol',
};

// Lista usada nos checkboxes do sidebar
readonly availableTypes = Object.entries(this.typeLabels)
  .filter(([value]) => Number(value) !== TypeEnum.None)
  .map(([value, label]) => ({ value: Number(value) as TypeEnum, label }));

// Converte um TypeEnum para seu label (usado no @for do template)
getTypeName(type: TypeEnum): string {
  return this.typeLabels[type] ?? 'Outro';
}
}

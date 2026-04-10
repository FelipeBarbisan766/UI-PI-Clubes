import { Component, signal } from '@angular/core';
import { SearchHome } from "../../shared/components/search-home/search-home";
import { RouterLink } from "@angular/router";
import { NgOptimizedImage } from '@angular/common';

interface Club {
  id: number;
  name: string;
  location: string;
  rating: number;
  tags: string[];
  price: number;
  image: string;
}

@Component({
  selector: 'app-home-page',
  imports: [SearchHome, RouterLink, NgOptimizedImage],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  readonly featuredClubs = signal<Club[]>([
    {
      id: 1,
      name: 'Arena Bate Bola',
      location: 'Taquaritinga, SP',
      rating: 4.8,
      tags: ['Futsal', 'Vôlei', 'Beach Tennis'],
      price: 80,
      image: '/assets/batebola.jpg'
    },
    {
      id: 2,
      name: 'Na Praia Tênis',
      location: 'Taquaritinga, SP',
      rating: 4.6,
      tags: ['Tênis', 'Beach Tennis'],
      price: 100,
      image: '/assets/napraia.jpg'
    },
    {
      id: 3,
      name: 'Tennis House',
      location: 'Taquaritinga, SP',
      rating: 4.9,
      tags: ['Tênis'],
      price: 120,
      image: '/assets/tennishouse.jpg'
    }
  ]);
}

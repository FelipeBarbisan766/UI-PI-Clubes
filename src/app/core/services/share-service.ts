import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ShareClubInput {
  id: string;
  name: string;
  city: string;
  state: string;
  minPrice?: number | null;
}

interface ShareContent {
  title: string;
  text: string;
  url: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly window = inject(DOCUMENT).defaultView;

  async shareClub(club: ShareClubInput): Promise<void> {
    await this.share(this.buildClubContent(club));
  }

  buildClubContent(club: ShareClubInput): ShareContent {
    const lines = [`Venha conhecer o *${club.name}*!`, `${club.city}/${club.state}`];

    if (club.minPrice != null) {
      lines.push(`A partir de ${formatPrice(club.minPrice)}/h`);
    }
    lines.push('Reserve sua quadra pelo Clubera:');

    return {
      title: club.name,
      text: lines.join('\n'),
      url: this.clubUrl(club.id),
    };
  }

  private clubUrl(clubId: string): string {
    return `${environment.apiUrl}/share/club/${clubId}`;
  }

  private async share(content: ShareContent): Promise<void> {
    const nav = this.window?.navigator;

    if (nav?.share) {
      try {
        await nav.share(content);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    const message = encodeURIComponent(`${content.text}\n${content.url}`);
    this.window?.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  }
}
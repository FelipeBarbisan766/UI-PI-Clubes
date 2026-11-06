import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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
  private readonly http = inject(HttpClient);
  private readonly imageCache = new Map<string, Promise<File | null>>();

  
  prefetchClubImage(clubId: string): Promise<File | null> {
    let promise = this.imageCache.get(clubId);

    if (!promise) {
      promise = firstValueFrom(
        this.http.get(`${environment.apiUrl}/club/${clubId}/share-image`, { responseType: 'blob' })
      )
        .then((blob) => new File([blob], 'clube.jpg', { type: 'image/jpeg' }))
        .catch(() => {
          this.imageCache.delete(clubId);
          return null;
        });

      this.imageCache.set(clubId, promise);
    }

    return promise;
  }

  async shareClub(club: ShareClubInput): Promise<void> {
    const content = this.buildClubContent(club);
    const message = `${content.text}\n${content.url}`;
    const nav = this.window?.navigator;

    const file = await this.prefetchClubImage(club.id);

    if (file && nav?.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: message });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    if (nav?.share) {
      try {
        await nav.share({ title: content.title, text: content.text, url: content.url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    this.window?.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
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
    return `${environment.siteUrl}/clubs/${clubId}`;
  }
}
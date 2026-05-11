import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { Observable } from 'rxjs';

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ViaCepService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://viacep.com.br/ws';

  getAddressByCep(cep: string): Observable<ViaCepAddress> {
    const sanitized = cep.replace(/\D/g, '');
    return this.http.get<ViaCepAddress>(`${this.baseUrl}/${sanitized}/json/`);
  }
}

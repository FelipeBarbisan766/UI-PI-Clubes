import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SignUpPayload } from '../models/model-sign-up';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServiceSignUp {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Auth/register`;

  signUp(data: SignUpPayload): Observable<void>{
    return this.http.post<void>(this.apiUrl, data);
  }


}

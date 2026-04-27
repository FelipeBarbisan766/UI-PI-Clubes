import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateCourtDTO, ResponseCourtDTO } from '../models/model-court';

@Injectable({
  providedIn: 'root',
})
export class ServiceCourt {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/court`;

    create(dto: CreateCourtDTO): Observable<ResponseCourtDTO> {
        const formData = new FormData();
        formData.append('name', dto.name);
        formData.append('type',dto.type.toString());
        formData.append('surface',dto.surface.toString());
        formData.append('isCovered',String(dto.isCovered));
        formData.append('pricePerHour', dto.pricePerHour.toString());
        formData.append('description',dto.description);
        formData.append('clubId',dto.clubId);
        dto.images.forEach(img => formData.append('images', img));
        return this.http.post<ResponseCourtDTO>(this.apiUrl, formData);
    }

    

}

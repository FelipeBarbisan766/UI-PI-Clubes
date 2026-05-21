import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { ServiceCourt } from '../../../features/admin/services/service-court'; 

export const courtNameResolver: ResolveFn<string> = (route, state) => {
  const courtId = route.paramMap.get('courtId');
  const courtService = inject(ServiceCourt);
  
  return courtService.getById(courtId!).pipe(
    map(court => court.name)
  );
};
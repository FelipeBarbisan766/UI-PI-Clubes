import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { ServiceClub } from '../../../features/admin/services/service-club'; 

export const clubCityResolver: ResolveFn<string> = (route, state) => {
  const clubId = route.paramMap.get('clubId');
  const clubService = inject(ServiceClub);
  
  return clubService.getById(clubId!).pipe(
    map(club => club.city + ' - ' + club.state)
  );
};
import { TypeEnum } from './model-court';

export interface ResponseClubDTO {
  id: string;
  name: string;
  phoneNumber: string;
  description: string;
  street: string;
  city: string;
  state: string;
  country: string;
  minPrice: number;
  courtCount: number;
  types: TypeEnum[];
  images: [
    {
      thumbUrl: string;
      mainUrl: string;
      fullUrl: string;
    }
  ];
}

export interface ResponseClubByIdDTO {
  name: string;
  phoneNumber: string;
  description: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
  images: [
    {
      thumbUrl: string;
      mainUrl: string;
      fullUrl: string;
    }
  ];
  courts: import('./model-court').ResponseCourtDTO[];
}
export interface ClubQueryDTO {
  name?: string;
  city?: string;
  types?: TypeEnum[];   
  page?: number;
  pageSize?: number;
}

export interface PagedResultDTO<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
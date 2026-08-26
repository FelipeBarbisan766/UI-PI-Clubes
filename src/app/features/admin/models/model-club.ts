import { TypeEnum } from './model-court';
import { ResponseReserveDetailDTO } from './model-reserve';

export interface CreateClubDTO {
  adminId: string;
  name: string;
  phoneNumber?: string;
  description?: string;
  zipCode: string;
  street: string;
  number?: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
  images?: File[];
}

export interface UpdateClubDTO {
  name: string;
  phoneNumber?: string;
  description?: string;
  zipCode: string;
  street: string;
  number?: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
}

export interface ResponseClubDTO {
  id: string;
  name: string;
  phoneNumber?: string;
  description?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  minPrice: number;
  courtCount: number;
  types: TypeEnum[];
  imagesUrls: string[];
}

export interface ResponseDashboardDTO {
  quantCourt: number;
  quantReserveToday: number;
  countPlayers: number;
  clubReserve: ResponseReserveDetailDTO[];
}

export interface ResponseClubByIdDTO {
  name: string;
  phoneNumber?: string;
  description?: string;
  zipCode: string;
  street: string;
  number?: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
  imagesUrls: string[];
  courts: import('./model-court').ResponseCourtDTO[];
}

export interface ReorderImageDTO {
  id: string;
  order: number;
}

export interface ExistingPhoto {
  kind: 'existing';
  id: string;
  url: string;
}

export interface NewPhoto {
  kind: 'new';
  id: string;
  file: File;
  previewUrl: string;
}

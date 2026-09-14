import { SportDTO } from '../../../core/models/model-sport';
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

export interface ImageDTO {
  id: string;
  thumbUrl: string;
  mediumUrl: string;
  fullUrl: string;
  order: number;
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
  sports: SportDTO[];
  images: ImageDTO[];
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
  images: ImageDTO[];
  courts: import('./model-court').ResponseCourtDTO[];
}

export interface ReorderImageDTO {
  id: string;
  order: number;
}

export interface ExistingPhoto {
  kind: 'existing';
  id: string;
  thumbUrl: string;
}

export interface NewPhoto {
  kind: 'new';
  id: string;
  file: File;
  previewUrl: string;
}

export enum CountryEnum {
  Brasil = 'Brasil',
  Argentina = 'Argentina',
  Chile = 'Chile',
  Uruguai = 'Uruguai',
  Paraguai = 'Paraguai',
  Bolivia = 'Bolívia',
  Peru = 'Peru',
  Equador = 'Equador',
  Colombia = 'Colômbia',
  Venezuela = 'Venezuela',
  Guiana = 'Guiana',
  Suriname = 'Suriname',
  GuianaFrancesa = 'Guiana Francesa',
}
import { TypeEnum } from './model-court';

export interface CreateClubDTO {
  adminId: string;
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
  images: File[];
}

export interface UpdateClubDTO {
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
}

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
  imagesUrls: string[];
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
  imagesUrls: string[];
  courts: import('./model-court').ResponseCourtDTO[];
}

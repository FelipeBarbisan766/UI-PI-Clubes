import { SportDTO } from '../../../core/models/model-sport';

export interface ImageDTO {
  thumbUrl: string;
  mediumUrl: string;
  fullUrl: string;
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
  sports: SportDTO[];
  images: ImageDTO[];
  averageRating: number;
  totalReviews: number;
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
  images: ImageDTO[];
  courts: import('./model-court').ResponseCourtDTO[];
  averageRating: number;
  totalReviews: number;
}

export interface ClubQueryDTO {
  name?: string;
  city?: string;
  sportIds?: string[];
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
export interface CreateClubReviewDTO {
  rating: number;
}

export interface ResponseClubReviewSummaryDTO {
  averageRating: number;
  totalReviews: number;
}
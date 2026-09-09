import { ImageDTO } from "./model-club";
import { SportDTO } from "../../../core/models/model-sport";

export enum SurfaceEnum {
    None = 'None',
    Saibro = 'Saibro',
    PisoDuro = 'PisoDuro',
    GramaNatural = 'GramaNatural',
    GramaSintética = 'GramaSintética',
    Madeira = 'Madeira',
    PisoVinílico = 'PisoVinílico',
    PisoAcrílico = 'PisoAcrílico',
    PisoEmborrachado = 'PisoEmborrachado',
    Areia = 'Areia',
    Carpete = 'Carpete',
    Asfalto = 'Asfalto',
    TerraBatida = 'TerraBatida',
    PisoModular = 'PisoModular'
}

export interface ResponseCourtDTO {
  id: string;
  name: string;
  sports: SportDTO[];
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  images: ImageDTO[];
}

export interface CourtState {
  courts: ResponseCourtDTO[];
  selectedCourt: ResponseCourtDTO | null;
  loading: boolean;
  error: string | null;
}
export interface CourtQueryDTO {
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
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

export interface CreateCourtDTO {
  name: string;
  sportIds: string[];
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  images: File[];
}

export interface UpdateCourtDTO {
  name: string;
  sportIds: string[];
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
}

export interface ResponseCourtDTO {
  id : string;
  name: string;
  sports: SportDTO[];
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  imagesUrls: string[];
}
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
export const SURFACE_LABELS: Record<SurfaceEnum, string> = {
  [SurfaceEnum.None]: 'Outro',
  [SurfaceEnum.Saibro]: 'Saibro',
  [SurfaceEnum.PisoDuro]: 'Piso Duro',
  [SurfaceEnum.GramaNatural]: 'Grama Natural',
  [SurfaceEnum.GramaSintética]: 'Grama Sintética',
  [SurfaceEnum.Madeira]: 'Madeira',
  [SurfaceEnum.PisoVinílico]: 'Piso Vinílico',
  [SurfaceEnum.PisoAcrílico]: 'Piso Acrílico',
  [SurfaceEnum.PisoEmborrachado]: 'Piso Emborrachado',
  [SurfaceEnum.Areia]: 'Areia',
  [SurfaceEnum.Carpete]: 'Carpete',
  [SurfaceEnum.Asfalto]: 'Asfalto',
  [SurfaceEnum.TerraBatida]: 'Terra Batida',
  [SurfaceEnum.PisoModular]: 'Piso Modular',
};

export interface CreateCourtDTO {
  name: string;
  sportIds: string[];
  surface: SurfaceEnum;
  isCovered: boolean;
  description?: string;
  clubId: string;
  images: File[];
}

export interface UpdateCourtDTO {
  name: string;
  sportIds: string[];
  surface: SurfaceEnum;
  isCovered: boolean;
  description?: string;
}

export interface ResponseCourtDTO {
  id : string;
  name: string;
  sports: SportDTO[];
  surface: SurfaceEnum;
  isCovered: boolean;
  minPrice : number;
  maxPrice : number;
  description?: string;
  isCourtActive: boolean;
  clubId: string;
  images: ImageDTO[];
}
export interface ImageDTO {
  id: string;
  thumbUrl: string;
  mediumUrl: string;
  fullUrl: string;
  order: number;
}
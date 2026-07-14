export enum TypeEnum {
    None = 'None',
    Futsal = 'Futsal',
    Basquetebol = 'Basquetebol',
    Basquete = 'Basquete',
    Voleibol = 'Voleibol',
    VôleiSentado = 'VôleiSentado',
    Handebol = 'Handebol',
    Netball = 'Netball',
    Tênis = 'Tênis',
    Badminton = 'Badminton',
    Squash = 'Squash',
    Padel = 'Padel',
    Pickleball = 'Pickleball',
    TênisDeMesa = 'TênisDeMesa',
    Judô = 'Judô',
    Karatê = 'Karatê',
    Taekwondo = 'Taekwondo',
    Esgrima = 'Esgrima',
    SepakTakraw = 'SepakTakraw',
    Hóquei = 'Hóquei',
    Dodgeball = 'Dodgeball',
    Raquetebol = 'Raquetebol',
    PelotaBasca = 'PelotaBasca',
    Floorball = 'Floorball',
    Korfball = 'Korfball',
    Tchoukball = 'Tchoukball',
    Goalball = 'Goalball',
    Futebol = 'Futebol',
}

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
  id : string;
  name: string;
  type: TypeEnum;
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  images: [
    {
      thumbUrl: string;
      mainUrl: string;
      fullUrl: string;
    }
  ];
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
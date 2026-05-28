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

export interface CreateCourtDTO {
  name: string;
  type: TypeEnum;
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  images: File[];
}

export interface UpdateCourtDTO {
  name: string;
  type: TypeEnum;
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
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
  imagesUrls: string[];
}

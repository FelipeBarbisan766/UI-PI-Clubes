export enum TypeEnum {
    None = 0,
    Futsal = 1,
    Basquetebol = 2,
    Basquete = 3,
    Voleibol = 4,
    VôleiSentado = 5,
    Handebol = 6,
    Netball = 7,
    Tênis = 8,
    Badminton = 9,
    Squash = 10,
    Padel = 11,
    Pickleball = 12,
    TênisDeMesa = 13,
    Judô = 14,
    Karatê = 15,
    Taekwondo = 16,
    Esgrima = 17,
    SepakTakraw = 18,
    Hóquei = 19,
    Dodgeball = 20,
    Raquetebol = 21,
    PelotaBasca = 22,
    Floorball = 23,
    Korfball = 24,
    Tchoukball = 25,
    Goalball = 26,
    Futebol = 27,
}

export enum SurfaceEnum {
    None = 0,
    Saibro = 1,
    PisoDuro = 2,
    GramaNatural = 3,
    GramaSintética = 4,
    Madeira = 5,
    PisoVinílico = 6,
    PisoAcrílico = 7,
    PisoEmborrachado = 8,
    Areia = 9,
    Carpete = 10,
    Asfalto = 11,
    TerraBatida = 12,
    PisoModular = 13
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
  name: string;
  type: TypeEnum;
  surface: SurfaceEnum;
  isCovered: boolean;
  pricePerHour: number;
  description: string;
  clubId: string;
  imagesUrls: string[];       
}
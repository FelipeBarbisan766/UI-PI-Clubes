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

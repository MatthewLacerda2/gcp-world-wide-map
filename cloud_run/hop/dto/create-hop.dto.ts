export class HopDto {
  origin: string;
  destination: string;
  ping: number;
}

export class CreateHopDto {
  hops: HopDto[];
  region: string;
}

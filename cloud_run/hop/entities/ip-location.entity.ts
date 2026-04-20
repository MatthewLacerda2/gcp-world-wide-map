import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Location } from './location.entity';

@Entity()
export class IpLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  locationId: number;

  @ManyToOne(() => Location)
  location: Location;
}

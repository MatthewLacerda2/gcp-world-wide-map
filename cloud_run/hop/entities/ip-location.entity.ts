import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
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
  @JoinColumn({ name: 'locationId' })
  location: Location;
}

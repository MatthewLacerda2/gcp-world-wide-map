import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Hop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column('float')
  ping: number;

  @Column()
  region: string;
}

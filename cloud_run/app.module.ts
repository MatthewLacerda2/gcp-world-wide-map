import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hop } from './hop/entities/hop.entity';
import { IpLocation } from './hop/entities/ip-location.entity';
import { Location } from './hop/entities/location.entity';
import { HopModule } from './hop/hop.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'Password123!',
      database: process.env.DB_NAME || 'mydb',
      entities: [Hop, Location, IpLocation],
      synchronize: true, 
    }),
    HopModule,
  ],
})
export class AppModule {}

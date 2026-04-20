import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HopService } from './hop.service';
import { HopController } from './hop.controller';
import { Hop } from './entities/hop.entity';
import { Location } from './entities/location.entity';
import { IpLocation } from './entities/ip-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hop, Location, IpLocation])],
  controllers: [HopController],
  providers: [HopService],
})
export class HopModule {}

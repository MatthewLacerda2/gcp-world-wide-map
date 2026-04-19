import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HopService } from './hop.service';
import { HopController } from './hop.controller';
import { Hop } from './entities/hop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hop])],
  controllers: [HopController],
  providers: [HopService],
})
export class HopModule {}

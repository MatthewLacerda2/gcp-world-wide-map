import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHopDto } from './dto/create-hop.dto';
import { Hop } from './entities/hop.entity';

@Injectable()
export class HopService {
  constructor(
    @InjectRepository(Hop)
    private hopRepository: Repository<Hop>,
  ) {}

  async findAll(): Promise<Hop[]> {
    return this.hopRepository.find();
  }

  async createMany(createHopDto: CreateHopDto): Promise<void> {
    const { hops, region } = createHopDto;
    
    const hopEntities = hops.map(h => {
      const hop = new Hop();
      hop.origin = h.origin;
      hop.destination = h.destination;
      hop.ping = h.ping;
      hop.region = region;
      return hop;
    });

    await this.hopRepository.save(hopEntities);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hop } from './entities/hop.entity';
import { CreateHopDto } from './dto/create-hop.dto';

@Injectable()
export class HopService {
  constructor(
    @InjectRepository(Hop)
    private hopRepository: Repository<Hop>,
  ) {}

  async findAll(): Promise<Hop[]> {
    return this.hopRepository.find();
  }

  // Not implemented, returning mock response via controller
  async create(createHopDto: CreateHopDto) {
    // return this.hopRepository.save(createHopDto);
  }
}

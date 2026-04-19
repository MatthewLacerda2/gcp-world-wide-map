import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HopService } from './hop.service';
import { CreateHopDto } from './dto/create-hop.dto';

@Controller('api/traceroutes')
export class HopController {
  constructor(private readonly hopService: HopService) {}

  @Get()
  findAll() {
    return this.hopService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createHopDto: CreateHopDto) {
    await this.hopService.createMany(createHopDto);
    return { status: 'ok' };
  }
}

import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HopService } from './hop.service';
import { CreateHopDto } from './dto/create-hop.dto';

@Controller('hop')
export class HopController {
  constructor(private readonly hopService: HopService) {}

  @Get()
  findAll() {
    return this.hopService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() createHopDto: CreateHopDto) {
    // As requested, return 200 OK without implementation
    return { status: 'ok' };
  }
}

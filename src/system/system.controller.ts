import {
  BadRequestException,
  Controller,
  NotFoundException,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { DataSource } from 'typeorm';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}
}

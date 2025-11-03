import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { DataSource } from 'typeorm';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Delete('table/:tableName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific table by name' })
  @ApiParam({
    name: 'tableName',
    description: 'The name of the table to delete',
    example: 'users',
  })
  @ApiResponse({ status: 204, description: 'Table successfully deleted' })
  @ApiResponse({ status: 400, description: 'Invalid table name' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async deleteTable(@Param('tableName') tableName: string): Promise<void> {
    return this.systemService.deleteTable(tableName);
  }

  @Delete('tables')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all tables in the database' })
  @ApiResponse({ status: 204, description: 'All tables successfully deleted' })
  async deleteAllTables(): Promise<void> {
    return this.systemService.deleteAllTables();
  }
}

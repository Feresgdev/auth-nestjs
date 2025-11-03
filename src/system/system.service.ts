import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

@Injectable()
export class SystemService {
  constructor(private dataSource: DataSource) {}

  async deleteTable(tableName: string): Promise<void> {
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new BadRequestException('Invalid table name');
    }

    const tableExists = await this.dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
      [tableName],
    );

    if (!tableExists.length) {
      throw new NotFoundException(`Table "${tableName}" does not exist`);
    }

    await this.dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
  }

  async deleteAllTables(): Promise<void> {
    const tables: { table_name: string }[] = await this.dataSource.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `);

    if (!tables.length) return;

    const tableNames = tables.map((t) => `"${t.table_name}"`).join(', ');
    await this.dataSource.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
  }
}

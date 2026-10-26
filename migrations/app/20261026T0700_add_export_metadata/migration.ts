#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b1b49266750a30e0e51b6ea9fbd2150d070ce7005156a24290349e6087636e72/contract';
import startContract from '../../snapshots/b1b49266750a30e0e51b6ea9fbd2150d070ce7005156a24290349e6087636e72/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d6703e3ea39b9cf13ede53dd30442f500c7ad8aabadc7cd9fc3c94bf3e95862f/contract';
import endContract from '../../snapshots/d6703e3ea39b9cf13ede53dd30442f500c7ad8aabadc7cd9fc3c94bf3e95862f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'jobAuditLog',
        column: col('exportFilePath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'jobAuditLog',
        column: col('exportRowCount', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

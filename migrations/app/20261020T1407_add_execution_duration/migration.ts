#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5d7d8422985ee4655594cedb74b6478bdfdfbfd655b6e0489a302a48b35ceb7b/contract';
import startContract from '../../snapshots/5d7d8422985ee4655594cedb74b6478bdfdfbfd655b6e0489a302a48b35ceb7b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b1b49266750a30e0e51b6ea9fbd2150d070ce7005156a24290349e6087636e72/contract';
import endContract from '../../snapshots/b1b49266750a30e0e51b6ea9fbd2150d070ce7005156a24290349e6087636e72/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'jobAuditLog',
        column: col('executionDuration', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

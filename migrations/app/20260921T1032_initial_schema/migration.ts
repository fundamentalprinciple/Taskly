#!/usr/bin/env -S node
import type { Contract as End } from "../../snapshots/5d7d8422985ee4655594cedb74b6478bdfdfbfd655b6e0489a302a48b35ceb7b/contract";
import endContract from "../../snapshots/5d7d8422985ee4655594cedb74b6478bdfdfbfd655b6e0489a302a48b35ceb7b/contract.json" with { type: "json" };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: "public" }),
      this.createTable({
        schema: "public",
        table: "jobAuditLog",
        columns: [
          col("attemptNumber", "int4", {
            notNull: true,
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("executionTime", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("taskId", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "refreshToken",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("expiresAt", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("revokedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("tokenHash", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("userId", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),
      this.createTable({
        schema: "public",
        table: "task",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("payload", "jsonb", {
            notNull: true,
            codecRef: { codecId: "pg/jsonb@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("PENDING"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("userId", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "task_status_check_e31902a8",
            "\"status\" IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')",
          ),
        ],
      }),
      this.createTable({
        schema: "public",
        table: "user",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("email", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "uuid", {
            notNull: true,
            codecRef: { codecId: "pg/uuid@1" },
          }),
          col("passwordHash", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("role", "text", {
            notNull: true,
            default: lit("MEMBER"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "user_role_check_ddb31015",
            "\"role\" IN ('ADMIN', 'MEMBER')",
          ),
        ],
      }),
      this.addUnique({
        schema: "public",
        table: "refreshToken",
        constraint: "refreshToken_tokenHash_key",
        columns: ["tokenHash"],
      }),
      this.addUnique({
        schema: "public",
        table: "user",
        constraint: "user_email_key",
        columns: ["email"],
      }),
      this.createIndex({
        schema: "public",
        table: "jobAuditLog",
        index: "jobAuditLog_taskId_idx_4965c936",
        columns: ["taskId"],
      }),
      this.createIndex({
        schema: "public",
        table: "refreshToken",
        index: "refreshToken_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_status_idx_e98638ab",
        columns: ["status"],
      }),
      this.createIndex({
        schema: "public",
        table: "task",
        index: "task_userId_idx_a489d58a",
        columns: ["userId"],
      }),
      this.addForeignKey({
        schema: "public",
        table: "jobAuditLog",
        foreignKey: {
          name: "jobAuditLog_taskId_fkey",
          columns: ["taskId"],
          references: { schema: "public", table: "task", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "refreshToken",
        foreignKey: {
          name: "refreshToken_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
      this.addForeignKey({
        schema: "public",
        table: "task",
        foreignKey: {
          name: "task_userId_fkey",
          columns: ["userId"],
          references: { schema: "public", table: "user", columns: ["id"] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

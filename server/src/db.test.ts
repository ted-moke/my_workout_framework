import { test } from "node:test";
import assert from "node:assert/strict";
import { poolConfig } from "./db";

test("DB_* vars are used when DATABASE_URL is unset, without TLS", () => {
  const c = poolConfig({ DB_HOST: "db", DB_PORT: "5433", DB_USER: "u", DB_PASSWORD: "p", DB_NAME: "n" });
  assert.equal(c.host, "db");
  assert.equal(c.port, 5433);
  assert.equal(c.user, "u");
  assert.equal(c.password, "p");
  assert.equal(c.database, "n");
  assert.equal(c.connectionString, undefined);
  assert.equal(c.ssl, undefined);
});

test("DB_* defaults match the local docker compose setup", () => {
  const c = poolConfig({});
  assert.equal(c.host, "localhost");
  assert.equal(c.port, 5432);
  assert.equal(c.database, "workout_tracker");
});

test("DATABASE_URL wins and turns on verified TLS", () => {
  const c = poolConfig({
    DATABASE_URL: "postgresql://neondb_owner:secret@ep-x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    DB_HOST: "ignored",
  });
  assert.equal(c.connectionString, "postgresql://neondb_owner:secret@ep-x-pooler.us-east-1.aws.neon.tech/neondb");
  assert.deepEqual(c.ssl, { rejectUnauthorized: true });
  assert.equal(c.host, undefined);
  assert.equal((c as { enableChannelBinding?: boolean }).enableChannelBinding, true);
});

test("DATABASE_URL without sslmode still uses verified TLS", () => {
  const c = poolConfig({ DATABASE_URL: "postgres://u:p@h/db" });
  assert.deepEqual(c.ssl, { rejectUnauthorized: true });
});

test("sslmode=disable and sslmode=no-verify are honoured", () => {
  assert.equal(poolConfig({ DATABASE_URL: "postgres://u:p@localhost:5499/db?sslmode=disable" }).ssl, false);
  assert.deepEqual(poolConfig({ DATABASE_URL: "postgres://u:p@h/db?sslmode=no-verify" }).ssl, {
    rejectUnauthorized: false,
  });
});

test("pool size is small by default and can be overridden", () => {
  assert.equal(poolConfig({}).max, 5);
  assert.equal(poolConfig({ DB_POOL_MAX: "2" }).max, 2);
});

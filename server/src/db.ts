import { Pool, PoolClient, PoolConfig, types } from "pg";

// Return NUMERIC columns (e.g. sets.weight) as JS numbers instead of strings.
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));

const CONNECTION_TIMEOUT_MS = 10_000; // allows for a Neon compute waking from suspend
const IDLE_TIMEOUT_MS = 10_000;
// A client that sat idle longer than this is checked with SELECT 1 before use.
const STALE_AFTER_MS = 30_000;

type Env = Record<string, string | undefined>;

/**
 * Pool settings from the environment.
 *
 * - DATABASE_URL (Cloud Run + Neon): one connection string. TLS is on and the
 *   server certificate is verified unless the URL says `sslmode=disable` (local
 *   testing) or `sslmode=no-verify`.
 * - Otherwise DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (local docker
 *   compose), without TLS.
 *
 * DB_POOL_MAX caps the pool size (default 5).
 */
export function poolConfig(env: Env = process.env): PoolConfig {
  const common: PoolConfig = {
    max: Number(env.DB_POOL_MAX) || 5,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    keepAlive: true,
  };

  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    const sslmode = url.searchParams.get("sslmode");
    const channelBinding = url.searchParams.get("channel_binding") === "require";
    // pg reads sslmode and channel_binding from the URL itself and warns about
    // how it maps sslmode=require; set TLS explicitly instead.
    url.searchParams.delete("sslmode");
    url.searchParams.delete("channel_binding");
    const ssl =
      sslmode === "disable" ? false : { rejectUnauthorized: sslmode !== "no-verify" };
    return {
      ...common,
      connectionString: url.toString(),
      ssl,
      ...(channelBinding && { enableChannelBinding: true }),
    };
  }

  return {
    ...common,
    host: env.DB_HOST || "localhost",
    port: Number(env.DB_PORT) || 5432,
    user: env.DB_USER || "workout",
    password: env.DB_PASSWORD || "workout",
    database: env.DB_NAME || "workout_tracker",
  };
}

type ConnectCallback = (
  err: Error | undefined,
  client: PoolClient | undefined,
  done: (release?: unknown) => void,
) => void;

/**
 * A Pool that survives connections dropped while idle.
 *
 * On Cloud Run the CPU is throttled between requests, so the idle timeout may
 * not fire and Neon may have closed the connection (its compute suspends after
 * a few idle minutes). A client that has been idle a while is checked with
 * SELECT 1 and replaced if it's dead. Errors on idle clients are logged instead
 * of crashing the process.
 */
export class ResilientPool extends Pool {
  private lastReleased = new WeakMap<PoolClient, number>();

  constructor(
    config: PoolConfig,
    private staleAfterMs = STALE_AFTER_MS,
  ) {
    super(config);
    this.on("release", (_err: Error | undefined, client: PoolClient) => {
      this.lastReleased.set(client, Date.now());
    });
    this.on("error", (err) => {
      console.error("Idle database connection dropped:", err.message);
    });
  }

  connect(): Promise<PoolClient>;
  connect(callback: ConnectCallback): void;
  // Pool.query() calls connect() with a callback, so both forms go through here.
  connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const checkout = this.checkout();
    if (!callback) return checkout;
    checkout.then(
      (client) => callback(undefined, client, (release) => client.release(release as Error)),
      (err) => callback(err, undefined, () => {}),
    );
  }

  private async checkout(attemptsLeft = 3): Promise<PoolClient> {
    const client = await super.connect();
    const released = this.lastReleased.get(client);
    if (released === undefined || Date.now() - released < this.staleAfterMs || attemptsLeft <= 1) {
      return client;
    }
    try {
      await client.query("SELECT 1");
      return client;
    } catch (err) {
      client.release(err as Error); // destroys the dead client
      return this.checkout(attemptsLeft - 1);
    }
  }
}

const pool = new ResilientPool(poolConfig());

export default pool;

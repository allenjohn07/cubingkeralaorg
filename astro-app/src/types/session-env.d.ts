// SESSION_SECRET signs the login cookie (src/lib/auth/session.ts). Declared
// here for the same reason as email-env.d.ts: worker-configuration.d.ts is
// generated from .dev.vars key names, and this one may not be there yet.
// Harmless duplicate once types are regenerated.
declare namespace Cloudflare {
  interface Env {
    SESSION_SECRET: string;
  }
}

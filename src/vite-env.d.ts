/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /**
   * Kill switch for the public demo (src/demo). Only the exact string "true"
   * enables it; anything else, including unset, disables the route, the CTA and
   * the axios adapter. See src/demo/README.md.
   */
  readonly VITE_DEMO_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

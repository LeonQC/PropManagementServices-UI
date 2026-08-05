/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which backend serves the listings grid — see .env.example. */
  readonly VITE_SEARCH_API?: "search" | "listings";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

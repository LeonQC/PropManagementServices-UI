/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which backend serves keyword search on the listings grid and the deal board —
   *  see .env.example. */
  readonly VITE_SEARCH_API?: "search" | "listings";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

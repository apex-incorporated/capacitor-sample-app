/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APEX_PROJECT_KEY?: string;
  readonly VITE_APEX_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

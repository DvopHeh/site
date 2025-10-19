// src/env.d.ts

/// <reference types="astro/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {

}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
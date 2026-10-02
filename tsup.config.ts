// tsup.config.ts
import { defineConfig } from "tsup";
import pkg from "./package.json";

const deps = Object.keys((pkg as any).dependencies || {});
const peerDeps = Object.keys((pkg as any).peerDependencies || {});

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "browser",
  clean: true,
  external: [...deps, ...peerDeps],
});

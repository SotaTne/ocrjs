import { node } from "@ocrjs/config-esbuild";
import { build } from "esbuild";

await build({
  ...node,
  entryPoints: ["src/index.ts"],
  outdir: "dist",
});
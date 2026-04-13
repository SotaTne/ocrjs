import { node } from "@ocrjs/config-esbuild";
import { build } from "esbuild";

const config = {
  ...node,
  entryPoints: ["src/cli/index.ts", "src/typedoc/typedoc-uml/index.ts"],
  outdir: "dist",
};

await build(config);

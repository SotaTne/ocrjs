import { node } from "@ocrjs/config-esbuild";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const NODE_SHEBANG = "#!/usr/bin/env node";

const shebangGuardPlugin = {
  name: "shebang-guard",
  setup(build) {
    build.onStart(() => {
      for (const entryPoint of build.initialOptions.entryPoints ?? []) {
        if (typeof entryPoint !== "string") {
          continue;
        }

        const files = entryPoint.includes("*")
          ? readdirSync(path.dirname(entryPoint)).map((file) =>
              path.join(path.dirname(entryPoint), file),
            )
          : [entryPoint];

        for (const file of files) {
          if (readFileSync(file, "utf8").startsWith(`${NODE_SHEBANG}\n`)) {
            continue;
          }

          throw new Error(
            `Entry point ${file} must start with ${NODE_SHEBANG}`,
          );
        }
      }
    });
  },
};

const config = {
  ...node,
  entryPoints: ["src/*.ts"],
  outdir: "dist",
  plugins: [shebangGuardPlugin],
};
await build(config);

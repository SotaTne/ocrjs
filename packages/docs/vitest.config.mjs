import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          isolate: false,
          fileParallelism: true,
          sequence: {
            concurrent: true,
          },
        },
      }),
      defineProject({
        test: {
          name: "e2e",
          include: ["e2e/**/*.test.ts"],
          isolate: true,
          fileParallelism: true,
          sequence: {
            concurrent: false,
          },
        },
      }),
    ],
  },
});

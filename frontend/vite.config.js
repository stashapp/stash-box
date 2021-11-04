import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import graphqlPlugin from "@rollup/plugin-graphql";
import analyzePlugin from "rollup-plugin-analyzer";

export default defineConfig(({ mode }) => {
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ""),
  };

  /** @type {import("vite").UserConfig} */
  const config = {
    build: {
      outDir: "build",
    },
    optimizeDeps: {
      entries: "src/index.tsx",
    },
    server: {
      port: Number(env.PORT) || undefined,
    },
    assetsInclude: ['**/*.md'],
    plugins: [
      react(),
      tsconfigPaths(),
      graphqlPlugin(),
    ],
  };

  if (process.env.analyze) {
    config.plugins.push(
      analyzePlugin({ summaryOnly: true, limit: 30 })
    );
  }

  return config;
});

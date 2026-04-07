import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import graphqlPlugin from "vite-plugin-graphql-loader";
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
      assetsDir: "assets",
      sourcemap: mode === "production",
    },
    optimizeDeps: {
      entries: "src/index.tsx",
    },
    server: {
      port: Number(env.PORT) || undefined,
    },
    plugins: [
      react(),
      graphqlPlugin(),
    ],
    resolve: {
      tsconfigPaths: true
    }
  };

  if (process.env.analyze) {
    config.plugins.push(
      analyzePlugin({ summaryOnly: true, limit: 30 })
    );
  }

  return config;
});

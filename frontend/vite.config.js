import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import graphqlPlugin from "@rollup/plugin-graphql";
import analyzePlugin from "rollup-plugin-analyzer";

const config = {
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    entries: "src/index.tsx",
  },
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

export default defineConfig(config);

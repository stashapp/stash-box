import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import graphqlPlugin from "@rollup/plugin-graphql";

export default defineConfig({
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    entries: "src/index.tsx",
  },
  plugins: [react(), tsconfigPaths(), graphqlPlugin()],
}) 

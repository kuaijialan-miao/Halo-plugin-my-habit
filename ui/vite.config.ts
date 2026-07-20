import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../src/main/resources/console"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["iife"],
      name: "PluginHabitTracker",
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: [
        "vue",
        "vue-router",
        "@halo-dev/console-shared",
        "@halo-dev/components",
        "echarts",
      ],
      output: {
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "@halo-dev/console-shared": "HaloConsoleShared",
          "@halo-dev/components": "HaloComponents",
          echarts: "echarts",
        },
      },
    },
  },
});

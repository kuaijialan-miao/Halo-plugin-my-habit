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
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ["console.debug"],
      },
      format: {
        comments: false,
      },
    },
    cssMinify: true,
    cssCodeSplit: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
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
        // 动态导入的 chunk 命名规范
        chunkFileNames: "chunks/[name]-[hash].js",
        // 内联动态导入阈值（设为 0 确保所有动态导入都拆分）
        inlineDynamicImports: false,
      },
    },
  },
});

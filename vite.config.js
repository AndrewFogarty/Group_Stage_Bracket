import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Builds the React "watch on" island into a single self-contained IIFE bundle
   (assets/broadcasts.js + assets/broadcasts.css) that index.html loads with a
   plain <script>/<link>, just like the rest of this no-build static site.
   React/ReactDOM are bundled in, so no extra script tags are needed. */
export default defineConfig({
  plugins: [react()],
  // Lib mode does not substitute this the way an app build does; React reads it
  // at load, so without it the bundle throws "process is not defined".
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "assets",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/broadcasts/index.jsx",
      name: "WCBroadcasts",
      formats: ["iife"],
      fileName: () => "broadcasts.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "broadcasts.[ext]",
      },
    },
  },
});

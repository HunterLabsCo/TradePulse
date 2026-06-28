import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    nodePolyfills(),
    // Skip service-worker generation for the SSR (prerender) build; the normal
    // client build still emits dist/sw.js exactly as before.
    !isSsrBuild &&
      VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["placeholder.svg"],
      manifest: {
        name: "TradePulse",
        short_name: "TradePulse",
        description: "Voice-first trade journal for crypto traders",
        categories: ["finance", "productivity"],
        theme_color: "#0e1311",
        background_color: "#0e1311",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ].filter(Boolean),
  build: {
    sourcemap: false,
    rollupOptions: {
      // manualChunks is meaningless for the single-entry SSR build and triggers
      // a rollup warning there, so only apply it to the client build.
      output: isSsrBuild
        ? {}
        : {
            manualChunks: {
              "vendor-solana": ["@solana/web3.js", "@solana/spl-token", "@solana/wallet-adapter-react"],
              "vendor-supabase": ["@supabase/supabase-js"],
              "vendor-react": ["react", "react-dom", "react-router-dom"],
            },
          },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

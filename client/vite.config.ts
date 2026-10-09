import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
  server: {
    port: 5173,
    // Allow Tailscale MagicDNS hostnames when run with `--host` for testing on other devices.
    allowedHosts: [".ts.net"],
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});

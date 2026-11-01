import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: "/alfagok/",
  plugins: [svelte()],
  // own port, so it does not silently share 5173 with another server
  server: {
    port: 5180,
    strictPort: true,
  },
});

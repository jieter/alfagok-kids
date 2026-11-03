import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { gzipSync } from "node:zlib";
import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// `import url from "./file.txt?gzip"` gives the URL of a gzipped copy in the build. During
// development it is the plain file; gunzipText() in src/lib/gzip.ts reads both.
function gzipAsset(): Plugin {
  let build = false;
  return {
    name: "gzip-asset",
    // before Vite's own asset handling, which would serve the plain .txt
    enforce: "pre",
    configResolved(config) {
      build = config.command === "build";
    },
    load(id) {
      const [file, query] = id.split("?");
      if (query !== "gzip") return;
      if (!build) return `export { default } from ${JSON.stringify(`${file}?url`)};`;
      const reference = this.emitFile({
        type: "asset",
        name: `${basename(file)}.gz`,
        source: gzipSync(readFileSync(file), { level: 9 }),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
    },
  };
}

export default defineConfig({
  base: "/alfagok/",
  plugins: [svelte(), gzipAsset()],
  // own port, so it does not silently share 5173 with another server
  server: {
    port: 5180,
    strictPort: true,
  },
});

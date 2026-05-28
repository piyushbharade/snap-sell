import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: "/snap-sell/",
  tanstackStart: {
    server: { 
      entry: "server" 
    },
  },
});

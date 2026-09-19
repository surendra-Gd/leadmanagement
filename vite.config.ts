import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  define: {
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
    ),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
    )
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true
  }
});

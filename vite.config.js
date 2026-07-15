import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base is set for GitHub Pages: https://<user>.github.io/price-scout/
// Change or remove "base" if you deploy elsewhere or rename the repo.
export default defineConfig({
  plugins: [react()],
  base: "/sales/",
});

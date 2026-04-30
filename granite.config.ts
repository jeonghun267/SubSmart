import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "subsmart",
  brand: {
    displayName: "SubSmart",
    primaryColor: "#3182F6",
    icon: "./public/icon-ait-512.png",
  },
  web: {
    host: "localhost",
    port: 3000,
    commands: {
      dev: "next dev",
      build: "node scripts/build-ait.mjs",
    },
  },
  permissions: [],
  outdir: "out",
  webViewProps: {
    type: "partner",
  },
});

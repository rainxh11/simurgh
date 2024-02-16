import { defineConfig } from "vite";
import pkg from "./package.json";
import { qwikVite } from "@builder.io/qwik/optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

const { dependencies = {}, peerDependencies = {} } = pkg as any;
const makeRegex = (dep: any) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (obj: any) => Object.keys(obj).map(makeRegex);

export default defineConfig(() => {
  return {
    build: {
      target: "es2020",
      lib: {
        entry: "./src/index.ts",
        formats: ["es", "cjs", "umd"],
        fileName: (format) => {
          if (format === "es") return "index.qwik.mjs";
          return `index.qwik.${format}`;
        },
        name: "simurgh",
      },
      rollupOptions: {
        // externalize deps that shouldn't be bundled into the library
        external: [
          /^node:.*/,
          ...excludeAll(dependencies),
          ...excludeAll(peerDependencies),
        ],
      },
    },
    plugins: [qwikVite(), tsconfigPaths()],
  };
});

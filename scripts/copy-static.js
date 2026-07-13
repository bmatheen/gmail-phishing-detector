// Copies static extension assets (manifest.json, icons) into dist/
// after all three Vite builds have run. Kept as plain Node so it has
// zero extra dependencies.
import { cpSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

mkdirSync(path.join(dist, "icons"), { recursive: true });
cpSync(path.join(root, "public", "manifest.json"), path.join(dist, "manifest.json"));
cpSync(path.join(root, "public", "icons"), path.join(dist, "icons"), { recursive: true });

console.log("Copied manifest.json and icons/ into dist/");

import { copyFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// O export do Next grava o payload RSC de prefetch em <rota>/__next.<rota>/__PAGE__.txt,
// mas o runtime pede <rota>/__next.<rota>.__PAGE__.txt. Publicamos as duas formas.
const root = process.argv[2] ?? "out";

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const routeDir = join(root, entry.name);
  for (const nested of await readdir(routeDir, { withFileTypes: true })) {
    if (nested.isDirectory() && nested.name.startsWith("__next.")) {
      await copyFile(join(routeDir, nested.name, "__PAGE__.txt"), join(routeDir, `${nested.name}.__PAGE__.txt`));
      console.log(`flattened ${entry.name}/${nested.name}.__PAGE__.txt`);
    }
  }
}

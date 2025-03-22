import { readdir, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ROOT_DIR = join(__dirname, "..");
const INPUT_DIR = join(ROOT_DIR, "in");
const OUTPUT_DIR = join(ROOT_DIR, "out");

async function cleanDirectory(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".gitkeep") {
      continue;
    }

    const fullPath = join(dir, entry.name);
    await rm(fullPath, { recursive: true, force: true });
    console.log(`Deleted: ${fullPath}`);
  }
}

async function main(): Promise<void> {
  for (const dir of [INPUT_DIR, OUTPUT_DIR]) {
    if (!existsSync(dir)) {
      console.log(`Directory ${dir} does not exist. Skipping...`);
      continue;
    }

    console.log(`Cleaning directory: ${dir}`);
    await cleanDirectory(dir);
  }
}

main().catch((error) => {
  console.error("An error occurred while cleaning directories:", error);
  process.exit(1);
});

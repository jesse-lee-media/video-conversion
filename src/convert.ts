import { readdir, unlink } from "fs/promises";
import { join } from "path";

const ROOT_DIR = join(__dirname, "..");
const INPUT_DIR = join(ROOT_DIR, "in");
const OUTPUT_DIR = join(ROOT_DIR, "out");

async function removeFfmpegLogs() {
  try {
    const files = await readdir(ROOT_DIR);

    for (const file of files) {
      if (
        file.startsWith("ffmpeg2pass-") &&
        (file.endsWith(".log") || file.endsWith(".log.mbtree"))
      ) {
        await unlink(join(ROOT_DIR, file));

        console.log(`Deleted log file: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning ffmpeg logs:", error);
  }
}

async function runConversion() {
  try {
    const files = await readdir(INPUT_DIR);

    for (const file of files) {
      if (file === ".gitkeep") {
        continue;
      }

      const inputFilePath = join(INPUT_DIR, file);
      const baseName = file.replace(/\.[^/.]+$/, "");
      const outputFilePath = join(OUTPUT_DIR, `${baseName}.webm`);

      console.log(`Processing: ${inputFilePath} → ${outputFilePath}`);

      const firstPass = Bun.spawn({
        cmd: [
          "ffmpeg",
          "-i",
          inputFilePath,
          "-vf",
          "scale=-1:1080",
          "-b:v",
          "1800k",

          "-minrate",
          "900k",
          "-maxrate",
          "2610k",
          "-tile-columns",
          "2",
          "-g",
          "240",
          "-threads",
          "4",

          "-quality",
          "good",
          "-crf",
          "31",
          "-c:v",
          "libvpx-vp9",
          "-an",

          "-pass",
          "1",
          "-speed",
          "4",
          "-f",
          "webm",
          "-y",
          "/dev/null",
        ],
        stdout: "inherit",
        stderr: "inherit",
      });
      const firstPassResult = await firstPass.exited;

      if (firstPassResult !== 0) {
        console.error(`First pass failed for ${file}`);
        continue;
      }

      const secondPass = Bun.spawn({
        cmd: [
          "ffmpeg",
          "-i",
          inputFilePath,
          "-vf",
          "scale=-1:1080",
          "-b:v",
          "1800k",

          "-minrate",
          "900k",
          "-maxrate",
          "2610k",
          "-tile-columns",
          "3",
          "-g",
          "240",
          "-threads",
          "4",

          "-quality",
          "good",
          "-crf",
          "31",
          "-c:v",
          "libvpx-vp9",
          "-an",

          "-pass",
          "2",
          "-speed",
          "2",
          "-y",
          outputFilePath,
        ],
        stdout: "inherit",
        stderr: "inherit",
      });
      const secondPassResult = await secondPass.exited;

      if (secondPassResult !== 0) {
        console.error(`Second pass failed for ${file}`);
        continue;
      }

      console.log(`Finished processing: ${file}`);

      await removeFfmpegLogs();
    }
  } catch (error) {
    console.error("Error during conversion:", error);
  }
}

runConversion();

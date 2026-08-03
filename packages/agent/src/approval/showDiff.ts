import { promises as fs } from "fs";

export async function showDiff(
  filePath: string,
  newContent: string
) {
  const oldContent = await fs.readFile(filePath, "utf8");

  console.log("\n=================================");
  console.log("PROPOSED CHANGES");
  console.log("=================================\n");

  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const max = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < max; i++) {
    const oldLine = oldLines[i] ?? "";
    const newLine = newLines[i] ?? "";

    if (oldLine !== newLine) {
      if (oldLine) {
        console.log("- " + oldLine);
      }

      if (newLine) {
        console.log("+ " + newLine);
      }
    }
  }

  console.log("\n=================================\n");
}
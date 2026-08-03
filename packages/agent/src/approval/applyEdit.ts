import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { brokenRepoRoot } from "../paths";

export async function applyEdit(
  filePath: string,
  content: string
) {
  console.log("\n=================================");
  console.log("PROPOSED EDIT");
  console.log("=================================\n");

  console.log("File:");
  console.log(filePath);

  console.log("\nNew Content:\n");

  console.log(content);

  console.log("\n=================================\n");

  if (process.env.AUTO_APPLY === "true") {
    console.log("Auto-applying edit (AUTO_APPLY=true)\n");
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer: string = await new Promise((resolve) => {
      rl.question(
        "Apply this edit? (y/n): ",
        resolve
      );
    });

    rl.close();

    if (answer.toLowerCase() !== "y") {
      return {
        applied: false,
      };
    }
  }

  const fullPath = path.resolve(
    brokenRepoRoot,
    filePath
  );

  await fs.writeFile(
    fullPath,
    content,
    "utf8"
  );

  return {
    applied: true,
  };
}
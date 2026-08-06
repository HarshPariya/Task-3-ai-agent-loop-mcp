import { runSecurityEvaluation } from "./runner.js";

console.log("\n==============================");
console.log(" Prompt Injection Evaluation");
console.log("==============================\n");

runSecurityEvaluation().catch((err) => {
    console.error("Evaluation failed:", err);
    process.exit(1);
});
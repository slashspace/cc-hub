import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

execSync("tsc", { stdio: "inherit" });

const cliPath = "dist/cli.js";
const content = readFileSync(cliPath, "utf8");
writeFileSync(cliPath, "#!/usr/bin/env node\n" + content);

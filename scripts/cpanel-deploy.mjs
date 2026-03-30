import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const targetDir = process.env.CPANEL_FRONTEND_TARGET || process.env.DEPLOY_TARGET || path.join(os.homedir(), "public_html");

if (!fs.existsSync(distDir)) {
  console.error("dist directory was not found. Run `npm run build:cpanel` first.");
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(distDir, targetDir, { recursive: true, force: true });

console.log(`Frontend deployed to ${targetDir}`);

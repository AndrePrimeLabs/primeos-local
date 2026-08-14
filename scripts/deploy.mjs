import FtpDeploy from "ftp-deploy";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
const env = Object.fromEntries(
  envFile.split("\n")
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

// Create .htaccess for SPA routing
const htaccess = `Options -Indexes
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]`;

writeFileSync(resolve(__dirname, "../dist/.htaccess"), htaccess);
console.log("✅ .htaccess created\n");

const ftpDeploy = new FtpDeploy();

const remoteRoot = env.FTP_REMOTE_ROOT || "/public_html/primeos/";
const ftpHost = env.FTP_HOST || "89.117.7.117";
const ftpUser = env.FTP_USER || env.FTP_USERNAME || "u188684587";
const ftpPassword = env.FTP_PASSWORD;
const ftpPort = env.FTP_PORT ? Number(env.FTP_PORT) : 21;

if (!ftpPassword) {
  throw new Error("Missing FTP_PASSWORD in .env. Add it and rerun deploy.");
}

const config = {
  user: ftpUser,
  password: ftpPassword,
  host: ftpHost,
  port: ftpPort,
  localRoot: resolve(__dirname, "../dist"),
  remoteRoot,
  include: ["*", "**/*", ".htaccess"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

console.log("🚀 Deploying to primeos.primeodontologia.com.br...\n");
console.log(`   Host: ${config.host}`);
console.log(`   User: ${config.user}`);
console.log(`   Port: ${config.port}`);
console.log(`   Dir:  ${config.remoteRoot}\n`);

ftpDeploy.on("uploading", ({ transferredFileCount, totalFilesCount, filename }) => {
  console.log(`[${transferredFileCount}/${totalFilesCount}] ${filename}`);
});

ftpDeploy.on("log", (data) => console.log(data));

ftpDeploy
  .deploy(config)
  .then(() => console.log("\n✅ Deploy complete! https://primeos.primeodontologia.com.br"))
  .catch(err => console.error("❌ Deploy failed:", err));
  
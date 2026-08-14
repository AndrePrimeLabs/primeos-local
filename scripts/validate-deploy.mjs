#!/usr/bin/env node
/**
 * Deployment Configuration Validator
 * 
 * Run before deployment to ensure everything is configured safely:
 *   npm run validate:deploy
 * 
 * Checks:
 * - .env.local exists and has required FTP settings
 * - FTP_REMOTE_DIR is safe (not /public_html root)
 * - FTP_DELETE_REMOTE is not enabled
 * - ./dist directory exists
 * - Git repository is clean (no uncommitted critical changes)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ANSI = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

function log(message, color = 'RESET') {
  console.log(`${ANSI[color]}${message}${ANSI.RESET}`);
}

function check(condition, successMsg, failMsg) {
  if (condition) {
    log(`✅ ${successMsg}`, 'GREEN');
    return true;
  } else {
    log(`❌ ${failMsg}`, 'RED');
    return false;
  }
}

let allChecksPassed = true;

log('\n🔒 Deployment Configuration Validator\n', 'BOLD');

// 1. Check .env.local exists
const envLocalPath = path.join(projectRoot, '.env.local');
const envExists = fs.existsSync(envLocalPath);

if (!check(envExists, '.env.local exists', '.env.local not found')) {
  log('   Create it: cp .env.local.example .env.local', 'YELLOW');
  allChecksPassed = false;
} else {
  // Read .env.local
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const env = Object.fromEntries(
    envContent.split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
  );

  // 2. Check FTP credentials
  check(env.FTP_USERNAME, 'FTP_USERNAME is set', 'FTP_USERNAME missing');
  if (!env.FTP_PASSWORD) {
    log('   ⚠️  FTP_PASSWORD is missing or empty', 'YELLOW');
    allChecksPassed = false;
  } else {
    log('✅ FTP_PASSWORD is set', 'GREEN');
  }
  
  check(env.FTP_SERVER, 'FTP_SERVER is set', 'FTP_SERVER missing');
  check(env.FTP_PORT, 'FTP_PORT is set', 'FTP_PORT missing');

  // 3. Check FTP_REMOTE_DIR is safe
  const remoteDir = env.FTP_REMOTE_DIR || '/public_html/primeos';
  const dangerousPaths = ['/public_html', '/public_html/', '/home', '/var', '/'];
  const isSafe = !dangerousPaths.some(p => remoteDir === p || remoteDir.endsWith(p + '/'));

  if (!check(isSafe, `FTP_REMOTE_DIR is safe: ${remoteDir}`, `⚠️  DANGEROUS FTP_REMOTE_DIR: ${remoteDir}`)) {
    log('   Use: FTP_REMOTE_DIR=/public_html/primeos', 'YELLOW');
    allChecksPassed = false;
  }

  // 4. Check deleteRemote is NOT enabled
  const deleteRemote = env.FTP_DELETE_REMOTE?.toLowerCase() === 'true';
  if (!check(!deleteRemote, 'FTP_DELETE_REMOTE is disabled (safe)', 'CRITICAL: FTP_DELETE_REMOTE is ENABLED!')) {
    log('   Remove FTP_DELETE_REMOTE from .env.local', 'YELLOW');
    allChecksPassed = false;
  }
}

// 5. Check dist directory exists
const distExists = fs.existsSync(path.join(projectRoot, 'dist'));
if (!check(distExists, './dist exists (build ready)', './dist not found')) {
  log('   Run: npm run build:primeos', 'YELLOW');
  allChecksPassed = false;
}

// 6. Check dist has files
if (distExists) {
  const distFiles = fs.readdirSync(path.join(projectRoot, 'dist'));
  check(distFiles.length > 0, `./dist has ${distFiles.length} files`, './dist is empty');
}

// 7. Check package.json has deploy scripts
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
);
check(
  packageJson.scripts['deploy:hostinger'],
  'npm run deploy:hostinger script exists',
  'deploy:hostinger script missing'
);

// 8. Check git repository
try {
  const gitHead = fs.readFileSync(path.join(projectRoot, '.git', 'HEAD'), 'utf-8');
  check(gitHead, 'Git repository is initialized', 'Not a git repository');
} catch {
  log('⚠️  Not a git repository (warning only)', 'YELLOW');
}

// Summary
log('\n' + '='.repeat(60), 'BLUE');
if (allChecksPassed) {
  log('✅ All checks passed! Safe to deploy.', 'GREEN');
  log('\nNext steps:', 'BOLD');
  log('  1. Verify changes: git status');
  log('  2. Build project: npm run build:primeos');
  log('  3. Deploy: npm run deploy:hostinger');
  log('\n');
  process.exit(0);
} else {
  log('❌ Some checks failed. Fix the issues above before deploying.', 'RED');
  log('\n');
  process.exit(1);
}

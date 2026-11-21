const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const children = [];

function startProcess(name, args) {
  const proc = spawn(npmCmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
  });
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
    shutdown();
  });
  children.push(proc);
  return proc;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('Starting Wedding Budget Tracker...');
console.log('  Backend API : http://localhost:5001');
console.log('  Frontend UI : http://localhost:5173\n');

startProcess('backend', ['--prefix', 'backend', 'run', 'dev']);
startProcess('frontend', ['--prefix', 'frontend', 'run', 'dev']);

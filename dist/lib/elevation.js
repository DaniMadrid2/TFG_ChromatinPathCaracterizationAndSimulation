const { execFileSync } = require('node:child_process');

function isWindowsAdministrator() {
  if (process.platform !== 'win32') return false;
  const script = '([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)';
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' }).trim() === 'True';
}

function startElevatedServer(command, port, directory) {
  const quotePowerShell = (value) => `'${String(value).replace(/'/g, "''")}'`;
  const quoteWindows = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const args = [__dirname + '/../cli.cjs', command, String(port), directory].map(quoteWindows);
  const script = `Start-Process -FilePath ${quotePowerShell(process.execPath)} -ArgumentList @(${args.map(quotePowerShell).join(',')}) -WorkingDirectory ${quotePowerShell(directory)} -Verb RunAs -WindowStyle Normal -ErrorAction Stop | Out-Null`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { stdio: 'inherit' });
  console.log('[dnti_shaderdsl] Servidor de backups iniciado en una consola elevada.');
}

module.exports = { isWindowsAdministrator, startElevatedServer };

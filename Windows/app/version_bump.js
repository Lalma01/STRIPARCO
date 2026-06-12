const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function bumpVersion() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const commitCount = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim(), 10);
  const [major, minor] = pkg.version.split('.');
  const newVersion = `${major}.${minor}.${commitCount}`;
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Version bumped to', newVersion);
}

bumpVersion();

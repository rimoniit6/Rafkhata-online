const pkg = require('./package.json');
const fs = require('fs');
const path = require('path');

function findImports(dir, ext = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '.next') {
        walk(fullPath);
      } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

const files = findImports('./src');
const content = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const deps = Object.keys(pkg.dependencies || {});
const unused = [];

for (const dep of deps) {
  // Check for various import patterns
  const patterns = [
    `from '${dep}'`,
    `from "${dep}"`,
    `import * from "${dep}"`,
    `require("${dep}")`,
    `require('${dep}')`,
    dep, // For scoped packages like @radix-ui/react-dialog
  ];
  
  let found = false;
  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    unused.push(dep);
  }
}

console.log('Unused dependencies:', unused.join(', '));
console.log('Total checked:', deps.length);
console.log('Unused count:', unused.length);
const fs = require('fs');
const path = require('path');

const distRoot = path.resolve(__dirname, '..', 'dist');
const exts = ['.js', '.json', '.node', '.mjs', '.cjs'];

function addExt(spec) {
  if (!(spec.startsWith('./') || spec.startsWith('../'))) return spec;
  const base = spec.split('?')[0].split('#')[0];
  if (exts.some((e) => base.endsWith(e))) return spec;
  return spec + '.js';
}

function replace(content) {
  content = content.replace(/from\s+['"]([^'"]+)['"]/g, (m, p) => m.replace(p, addExt(p)));
  content = content.replace(/import\(\s*['"]([^'"]+)['"]\s*\)/g, (m, p) =>
    m.replace(p, addExt(p)),
  );
  return content;
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      const n = replace(c);
      if (n !== c) fs.writeFileSync(p, n, 'utf8');
    }
  }
}

if (fs.existsSync(distRoot)) {
  walk(distRoot);
}

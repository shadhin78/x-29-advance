import fs from 'fs';
import path from 'path';

function getFiles(dir, res = []) {
  if (!fs.existsSync(dir)) return res;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== '.next') {
        getFiles(full, res);
      }
    } else {
      res.push({
        path: full.replace(/\\/g, '/'),
        relPath: path.relative(process.cwd(), full).replace(/\\/g, '/'),
        size: fs.statSync(full).size
      });
    }
  }
  return res;
}

const all = getFiles('.');
const modernCodeFiles = all.filter(f => 
  (f.relPath.startsWith('app/') ||
   f.relPath.startsWith('components/') ||
   f.relPath.startsWith('features/')) &&
  (f.relPath.endsWith('.tsx') || f.relPath.endsWith('.ts'))
);

const modernContent = modernCodeFiles.map(f => ({
  path: f.relPath,
  code: fs.readFileSync(f.path, 'utf8')
}));

const cssFiles = [
  'css/style.css',
  'pages/Dashboard/Dashboard.css',
  'pages/Focus/Focus.css',
  'pages/Subjects/Subjects.css',
  'pages/Daily Actions/Daily Actions.css',
  'pages/Daily Actions/monthly target setup/monthly target setup.css',
  'pages/Daily Schedule/Daily Schedule.css',
  'pages/Pace Management/Pace Management.css',
  'pages/Outcome/Outcome.css',
  'pages/Exam Routine/Exam Routine.css',
  'pages/Master Config/Master Config.css',
  'pages/Analytics/Analytics.css'
];

console.log('=== CSS SELECTOR AUDIT ACROSS MODERN REACT COMPONENTS ===');

for (const cssPath of cssFiles) {
  if (!fs.existsSync(cssPath)) continue;
  const rawCss = fs.readFileSync(cssPath, 'utf8');
  
  // Extract classes (.className) and IDs (#idName)
  const classMatches = rawCss.match(/\.([a-zA-Z0-9_-]+)/g) || [];
  const idMatches = rawCss.match(/#([a-zA-Z0-9_-]+)/g) || [];
  
  // Unique identifiers
  const classes = [...new Set(classMatches.map(c => c.slice(1)))];
  const ids = [...new Set(idMatches.map(i => i.slice(1)))];
  
  let usedClasses = 0;
  let usedIds = 0;
  const usedClassList = [];
  const unusedClassList = [];

  for (const cls of classes) {
    // Look for exact word match in modern JSX
    const isUsed = modernContent.some(m => 
      m.code.includes(`"${cls}"`) || 
      m.code.includes(`'${cls}'`) ||
      m.code.includes(` ${cls} `) ||
      m.code.includes(` ${cls}"`) ||
      m.code.includes(`"${cls} `) ||
      m.code.includes(`'${cls} `) ||
      m.code.includes(` ${cls}'`) ||
      m.code.includes(`\`${cls}\``) ||
      m.code.includes(` ${cls}\``) ||
      m.code.includes(`\`${cls} `)
    );
    if (isUsed) {
      usedClasses++;
      usedClassList.push(cls);
    } else {
      unusedClassList.push(cls);
    }
  }

  for (const id of ids) {
    const isUsed = modernContent.some(m => 
      m.code.includes(`id="${id}"`) || 
      m.code.includes(`id='${id}'`) ||
      m.code.includes(`id: '${id}'`) ||
      m.code.includes(`"${id}"`)
    );
    if (isUsed) usedIds++;
  }

  console.log(`\nFILE: ${cssPath} (${rawCss.length} bytes)`);
  console.log(`  Total Classes: ${classes.length} (Used: ${usedClasses}, Unused: ${unusedClassList.length})`);
  console.log(`  Total IDs: ${ids.length} (Used: ${usedIds})`);
  if (usedClassList.length > 0) {
    console.log(`  Active Classes sample: ${usedClassList.slice(0, 8).join(', ')}${usedClassList.length > 8 ? '...' : ''}`);
  }
}

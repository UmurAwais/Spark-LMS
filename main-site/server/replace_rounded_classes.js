const fs = require('fs');
const path = require('path');

// Directories to search
const directories = [
  'src/components',
  'src/pages',
  'src/admin'
];

// Rounded class replacements (keeping rounded-full as is for circular elements)
const replacements = [
  { from: /rounded-3xl/g, to: 'rounded-md' },
  { from: /rounded-2xl/g, to: 'rounded-md' },
  { from: /rounded-xl/g, to: 'rounded-md' },
  { from: /rounded-lg/g, to: 'rounded-md' },
  // Don't replace rounded, rounded-sm, rounded-md, or rounded-full
];

let filesModified = 0;
let totalReplacements = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileReplacements = 0;

  replacements.forEach(({ from, to }) => {
    const matches = newContent.match(from);
    if (matches) {
      fileReplacements += matches.length;
      newContent = newContent.replace(from, to);
    }
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: ${fileReplacements} replacements`);
    filesModified++;
    totalReplacements += fileReplacements;
  }
}

function processDirectory(dir) {
  const fullPath = path.join(__dirname, '..', dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(fullPath);
  
  files.forEach(file => {
    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.js'))) {
      processFile(filePath);
    }
  });
}

console.log('🔄 Starting rounded class replacement...\n');

directories.forEach(dir => {
  console.log(`📁 Processing ${dir}...`);
  processDirectory(dir);
});

console.log(`\n✨ Complete!`);
console.log(`📊 Files modified: ${filesModified}`);
console.log(`📊 Total replacements: ${totalReplacements}`);

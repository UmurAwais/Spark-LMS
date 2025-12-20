const fs = require('fs');
const path = require('path');

// Directories to search
const directories = [
  'src/components',
  'src/pages'
];

let filesModified = 0;
let totalAdditions = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileAdditions = 0;

  // Pattern 1: onClick handlers without cursor-pointer
  const onClickPattern = /(<(?:div|span|p|img|svg|i)[^>]*?)onClick=\{[^}]*?\}([^>]*?)(className="([^"]*?)")?([^>]*?>)/g;
  content = content.replace(onClickPattern, (match, before, middle, classNameAttr, classes, after) => {
    if (match.includes('cursor-pointer') || match.includes('cursor-not-allowed')) {
      return match;
    }
    
    if (classNameAttr) {
      // Has className, add cursor-pointer to it
      fileAdditions++;
      modified = true;
      return `${before}onClick={${match.match(/onClick=\{([^}]*)\}/)[1]}}${middle}className="${classes} cursor-pointer"${after}`;
    } else {
      // No className, add it
      fileAdditions++;
      modified = true;
      return `${before}onClick={${match.match(/onClick=\{([^}]*)\}/)[1]}}${middle} className="cursor-pointer"${after}`;
    }
  });

  // Pattern 2: type="button" without cursor-pointer
  const typeButtonPattern = /<button([^>]*?)type="button"([^>]*?)(className="([^"]*?)")?([^>]*?>)/g;
  content = content.replace(typeButtonPattern, (match, before, middle, classNameAttr, classes, after) => {
    if (match.includes('cursor-pointer') || match.includes('cursor-not-allowed')) {
      return match;
    }
    
    if (classNameAttr) {
      fileAdditions++;
      modified = true;
      return `<button${before}type="button"${middle}className="${classes} cursor-pointer"${after}`;
    } else {
      fileAdditions++;
      modified = true;
      return `<button${before}type="button"${middle} className="cursor-pointer"${after}`;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: ${fileAdditions} cursor-pointer additions`);
    filesModified++;
    totalAdditions += fileAdditions;
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

console.log('🖱️  Adding cursor-pointer to onClick handlers and icon buttons...\n');

directories.forEach(dir => {
  console.log(`📁 Processing ${dir}...`);
  processDirectory(dir);
});

console.log(`\n✨ Complete!`);
console.log(`📊 Files modified: ${filesModified}`);
console.log(`📊 Total cursor-pointer additions: ${totalAdditions}`);

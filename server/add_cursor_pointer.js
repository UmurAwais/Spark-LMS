const fs = require('fs');
const path = require('path');

// Directories to search
const directories = [
  'src/components',
  'src/pages'
];

let filesModified = 0;
let totalAdditions = 0;

// Patterns to match clickable elements that should have cursor-pointer
const patterns = [
  // Buttons without cursor-pointer
  {
    regex: /<button([^>]*?)className="([^"]*?)"(?![^>]*cursor-pointer)/g,
    replacement: (match, attrs, classes) => {
      if (classes.includes('cursor-pointer') || classes.includes('cursor-not-allowed')) {
        return match;
      }
      return `<button${attrs}className="${classes} cursor-pointer"`;
    },
    description: 'buttons'
  },
  // onClick handlers on divs without cursor-pointer
  {
    regex: /<div([^>]*?)onClick=\{[^}]*?\}([^>]*?)className="([^"]*?)"(?![^>]*cursor-pointer)/g,
    replacement: (match, before, after, classes) => {
      if (classes.includes('cursor-pointer') || classes.includes('cursor-not-allowed')) {
        return match;
      }
      return `<div${before}onClick={${match.match(/onClick=\{([^}]*)\}/)[1]}}${after}className="${classes} cursor-pointer"`;
    },
    description: 'clickable divs'
  },
  // Links without cursor-pointer
  {
    regex: /<Link([^>]*?)className="([^"]*?)"(?![^>]*cursor-pointer)/g,
    replacement: (match, attrs, classes) => {
      if (classes.includes('cursor-pointer')) {
        return match;
      }
      return `<Link${attrs}className="${classes} cursor-pointer"`;
    },
    description: 'Link components'
  },
  // NavLink without cursor-pointer
  {
    regex: /<NavLink([^>]*?)className="([^"]*?)"(?![^>]*cursor-pointer)/g,
    replacement: (match, attrs, classes) => {
      if (classes.includes('cursor-pointer')) {
        return match;
      }
      return `<NavLink${attrs}className="${classes} cursor-pointer"`;
    },
    description: 'NavLink components'
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileAdditions = 0;

  // Simple approach: add cursor-pointer to buttons, Links, and onClick elements
  const newContent = content
    // Add to buttons that don't have it
    .replace(/<button([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, before, classes, after) => {
      if (classes.includes('cursor-pointer') || classes.includes('cursor-not-allowed')) {
        return match;
      }
      fileAdditions++;
      modified = true;
      return `<button${before}className="${classes} cursor-pointer"${after}>`;
    })
    // Add to Link components that don't have it
    .replace(/<Link([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, before, classes, after) => {
      if (classes.includes('cursor-pointer')) {
        return match;
      }
      fileAdditions++;
      modified = true;
      return `<Link${before}className="${classes} cursor-pointer"${after}>`;
    })
    // Add to NavLink components that don't have it
    .replace(/<NavLink([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, before, classes, after) => {
      if (classes.includes('cursor-pointer')) {
        return match;
      }
      fileAdditions++;
      modified = true;
      return `<NavLink${before}className="${classes} cursor-pointer"${after}>`;
    })
    // Add to anchor tags that don't have it
    .replace(/<a([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, before, classes, after) => {
      if (classes.includes('cursor-pointer')) {
        return match;
      }
      fileAdditions++;
      modified = true;
      return `<a${before}className="${classes} cursor-pointer"${after}>`;
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

console.log('🖱️  Starting cursor-pointer addition...\n');

directories.forEach(dir => {
  console.log(`📁 Processing ${dir}...`);
  processDirectory(dir);
});

console.log(`\n✨ Complete!`);
console.log(`📊 Files modified: ${filesModified}`);
console.log(`📊 Total cursor-pointer additions: ${totalAdditions}`);

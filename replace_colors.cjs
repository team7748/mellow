const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  // Text colors
  { regex: /text-emerald-(?:800|900|950)(?:\/\d+)?/g, replace: 'text-ink-dark' },
  { regex: /text-emerald-(?:500|600|700)(?:\/\d+)?/g, replace: 'text-primary' },
  { regex: /text-slate-(?:400|500|600)(?:\/\d+)?/g, replace: 'text-ink-secondary' },
  { regex: /text-slate-(?:700|800)(?:\/\d+)?/g, replace: 'text-ink-DEFAULT' },
  { regex: /text-slate-900(?:\/\d+)?/g, replace: 'text-ink-dark' },
  { regex: /text-leaf(?:\/\d+)?/g, replace: 'text-primary' },
  // For text-ink, match exact \bink\b so it doesn't replace text-ink-dark
  { regex: /\btext-ink\b(?!\-(?:dark|secondary|DEFAULT))/g, replace: 'text-ink-DEFAULT' },
  
  // Backgrounds
  { regex: /bg-emerald-(?:800|900|950)(?:\/\d+)?/g, replace: 'bg-primary-hover' },
  { regex: /bg-emerald-(?:500|600|700)(?:\/\d+)?/g, replace: 'bg-primary' },
  { regex: /bg-emerald-(?:100|200)(?:\/\d+)?/g, replace: 'bg-primary-active' },
  { regex: /bg-emerald-50(?:\/\d+)?/g, replace: 'bg-primary-soft' },
  { regex: /bg-leaf(?:\/\d+)?/g, replace: 'bg-primary' },
  
  // Borders
  { regex: /border-emerald-(?:800|900|950)(?:\/\d+)?/g, replace: 'border-primary' },
  { regex: /border-emerald-(?:500|600|700)(?:\/\d+)?/g, replace: 'border-primary' },
  { regex: /border-emerald-(?:50|100|200)(?:\/\d+)?/g, replace: 'border-primary/20' },
  { regex: /border-slate-(?:100|200|300)(?:\/\d+)?/g, replace: 'border-border' },
  { regex: /border-leaf(?:\/\d+)?/g, replace: 'border-primary' },
  
  // Rings
  { regex: /ring-emerald-(?:500|600|700)(?:\/\d+)?/g, replace: 'ring-primary' },
  { regex: /ring-emerald-(?:50|100|200)(?:\/\d+)?/g, replace: 'ring-primary/20' },
  { regex: /ring-slate-(?:100|200|300)(?:\/\d+)?/g, replace: 'ring-border' },
  { regex: /ring-leaf(?:\/\d+)?/g, replace: 'ring-primary' },
  
  // Shadows
  { regex: /shadow-sm shadow-emerald-900\/5/g, replace: 'shadow-soft' },
  { regex: /shadow-\[0_2px_12px_rgba\(4,120,87,0\.02\)\]/g, replace: 'shadow-soft' },
  { regex: /shadow-\[0_4px_20px_rgba\(4,120,87,0\.05\)\]/g, replace: 'shadow-soft' },
  
  // Fills
  { regex: /fill-emerald-(?:500|600|700)(?:\/\d+)?/g, replace: 'fill-primary' },
  { regex: /fill-leaf(?:\/\d+)?/g, replace: 'fill-primary' },

  // Base Colors
  { regex: /\bbg-white\b/g, replace: 'bg-card' },
  { regex: /\bbg-\[#fdfdfb\]/g, replace: 'bg-card' }
];

let filesChanged = 0;

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // First pass replacements
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replace);
    });
    
    // Special case for hover:bg-white which becomes hover:bg-card which is fine
    // But text-ink/50 became text-ink-DEFAULT/50. Let's fix that.
    content = content.replace(/text-ink-DEFAULT\/(\d+)/g, 'text-ink-DEFAULT');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesChanged++;
      console.log(`Updated: ${filePath}`);
    }
  }
});

console.log(`\nTotal files updated: ${filesChanged}`);

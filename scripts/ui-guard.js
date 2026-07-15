const fs = require('fs');
const path = require('path');

let hasViolations = false;

function logViolation(file, lineNum, content, message) {
  console.error(`\x1b[31m❌ VIOLATION in [${file}:${lineNum}]: ${message}\x1b[0m`);
  console.error(`   Code: "${content.trim()}"`);
  hasViolations = true;
}

const stylesDir = path.resolve('src/app/styles');
const specifiedFiles = process.argv.slice(2).filter(Boolean).map(file => path.resolve(file));
const hasSpecifiedFiles = specifiedFiles.length > 0;
const specifiedFileSet = new Set(specifiedFiles);

// 1. Check direct section block selector declaration (section) in all CSS files
const cssFiles = ['tokens.css', 'base.css', 'utilities.css', 'components.css', 'layouts.css'];
const cssFilesToScan = hasSpecifiedFiles
  ? cssFiles.filter(file => specifiedFileSet.has(path.join(stylesDir, file)))
  : cssFiles;
cssFilesToScan.forEach(file => {
  const filePath = path.join(stylesDir, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Use block parsing to examine CSS selectors cleanly and ignore comments
  const blocks = content.split('}');
  blocks.forEach(block => {
    const parts = block.split('{');
    if (parts.length < 2) return;
    
    // Clean comments from selector
    const selector = parts[0].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!selector) return;
    
    // Check if the tag "section" is selected directly
    const selectors = selector.split(',').map(s => s.trim());
    const selectsSectionDirectly = selectors.some(sel => {
      // Matches exactly "section", or "section" in compound selectors, but not classes/IDs (.section, #section) or pseudo classes
      return sel === 'section' || sel.split(/\s+/).includes('section');
    });

    if (selectsSectionDirectly) {
      const linesBefore = content.split(block)[0].split('\n');
      const startLine = linesBefore.length;
      logViolation(`src/app/styles/${file}`, startLine, selector + ' { ... }', 'Direct "section" tag selector declaration is forbidden. Use layout classes.');
    }
  });

  // 2. Check !important in components.css
  if (file === 'components.css') {
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Exclude comments
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
      if (line.includes('!important')) {
        logViolation(`src/app/styles/${file}`, index + 1, line, '"!important" flag is forbidden inside components/base CSS.');
      }
    });
  }
});

// Helper to check if file path is exempt from transform/position/inline check
function isFileExempt(relPath) {
  const normalized = relPath.replace(/\\/g, '/').toLowerCase();
  return [
    'pricing',
    'profile',
    'page.js',
    'freelancers',
    'card',
    'uicomponents.js',
    'portal'
  ].some(term => normalized.includes(term));
}

// 4. Check transform in non-card components (JS/JSX/TS/TSX files only)
function checkTransform(file, content) {
  if (file.endsWith('.css')) return; // CSS files are the correct location for transitions and transforms
  
  const relPath = path.relative(path.resolve(), file);
  if (isFileExempt(relPath)) return;

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) return;
    if (line.includes('transform:') && !line.includes('text-transform')) {
      // Exclude simple dynamic variables, indicator rotate, and alignments
      if (line.includes('translateX(-50%)') || line.includes('translateY(-50%)') || line.includes('translate(-50%') || line.includes('rotate(')) return;
      
      const isAllowedTransform = 
        line.toLowerCase().includes('card') ||
        line.toLowerCase().includes('modal') ||
        line.toLowerCase().includes('tooltip') ||
        line.toLowerCase().includes('mockup') ||
        line.toLowerCase().includes('dialog') ||
        line.toLowerCase().includes('arrow');

      if (!isAllowedTransform) {
        logViolation(relPath, index + 1, line, 'transform is forbidden outside pricing-card, modal, tooltip, mockup, dialog, arrow, or rotate.');
      }
    }
  });
}

// Check position: absolute (JS/JSX/TS/TSX files only)
function checkAbsolutePosition(file, content) {
  if (file.endsWith('.css')) return; // CSS files are the correct location for layout absolute position declarations
  
  const relPath = path.relative(path.resolve(), file);
  if (isFileExempt(relPath)) return;

  const normalizedPath = relPath.replace(/\\/g, '/').toLowerCase();
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) return;
    
    if (line.includes('position: absolute') || line.includes('position: \'absolute\'') || line.includes('position: "absolute"')) {
      const isAllowedAbsolute = 
        normalizedPath.includes('modal') ||
        normalizedPath.includes('tooltip') ||
        normalizedPath.includes('mockup') ||
        normalizedPath.includes('dialog') ||
        normalizedPath.includes('popup') ||
        normalizedPath.includes('arrow') ||
        normalizedPath.includes('overlay') ||
        line.toLowerCase().includes('modal') ||
        line.toLowerCase().includes('tooltip') ||
        line.toLowerCase().includes('mockup') ||
        line.toLowerCase().includes('dialog') ||
        line.toLowerCase().includes('popup') ||
        line.toLowerCase().includes('arrow') ||
        line.toLowerCase().includes('overlay');
        
      if (!isAllowedAbsolute) {
        logViolation(relPath, index + 1, line, 'position: absolute is forbidden outside modal, tooltip, mockup, dialog, popup, or arrow.');
      }
    }
  });
}

// Check style=" or inline style usage style={{ ... }} in /app/ UI layer
function checkInlineStyles(file, content) {
  const relPath = path.relative(path.resolve(), file);
  if (isFileExempt(relPath)) return;

  const normalizedPath = relPath.replace(/\\/g, '/').toLowerCase();
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) return;
    
    // Fail if style=" is found (inline HTML style attribute)
    if (line.includes('style="')) {
      logViolation(relPath, index + 1, line, 'Direct style="..." inline HTML attribute is forbidden.');
    }
    
    // Fail if inline JSX style={{ ... }} is found inside /app/ UI layer
    if (normalizedPath.includes('src/app/')) {
      if (line.includes('style={{') && !line.includes('--')) {
        logViolation(relPath, index + 1, line, 'Inline JSX styles style={{...}} are forbidden in the /app UI layer.');
      }
    }
  });
}

// 5. Check direct color hex usage instead of design tokens (excluding tokens.css)
function checkHexUsage(file, content) {
  const relPath = path.relative(path.resolve(), file);
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) return;
    
    // Hex code regex matching: #3b82f6, #fff, etc.
    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    let match;
    while ((match = hexRegex.exec(line)) !== null) {
      const hex = match[0];
      // Exclude standard hex codes if they are not colors (like anchor hashes or playwright locator syntax)
      if (line.includes('href="#') || line.includes('id="#') || line.includes('file://') || line.includes('.webp') || line.includes('.png') || line.includes('http')) continue;
      // Exclude SVG path fills/strokes
      if (line.includes('fill=') || line.includes('stroke=')) continue;
      
      logViolation(relPath, index + 1, line, `Direct color hex code usage "${hex}" is forbidden. Use design tokens (var(--...)) instead.`);
    }
  });
}

// Recursively scan directories
const pathsToScan = hasSpecifiedFiles
  ? specifiedFiles
  : [
      path.resolve('src/app'),
      path.resolve('src/components/ui')
    ];

function scanFiles(dirOrFile) {
  if (!fs.existsSync(dirOrFile)) return;
  const stat = fs.statSync(dirOrFile);
  
  if (stat.isDirectory()) {
    fs.readdirSync(dirOrFile).forEach(subFile => {
      scanFiles(path.join(dirOrFile, subFile));
    });
  } else if (stat.isFile()) {
    const isCSS = dirOrFile.endsWith('.css');
    const isJS = dirOrFile.endsWith('.js') || dirOrFile.endsWith('.jsx') || dirOrFile.endsWith('.ts') || dirOrFile.endsWith('.tsx');
    
    if (isCSS || isJS) {
      const relPath = path.relative(path.resolve(), dirOrFile);
      
      // Exclude tokens.css, email/PDF templates, system error boundaries, and payment instructions
      const normalizedPath = relPath.replace(/\\/g, '/').toLowerCase();
      const isExcluded = [
        'tokens.css',
        '/lib/',
        'not-found.js',
        'error.js',
        'early-access',
        'proposal-preview',
        'payment-instructions',
        'dashboard',
        'profilecardclient',
        'seopagelayout',
        'templateseopage',
        'portalclientview',
        'checkout',
        'faqaccordion',
        'terms',
        'privacy',
        'refund-policy',
        'security',
        'contact',
        'pricingredirectoverlay',
        'uicomponents.js',
        'src/app/components'
      ].some(term => normalizedPath.includes(term));
      
      if (isExcluded) {
        return;
      }
      
      const content = fs.readFileSync(dirOrFile, 'utf-8');
      checkHexUsage(dirOrFile, content);
      checkTransform(dirOrFile, content);
      checkAbsolutePosition(dirOrFile, content);
      checkInlineStyles(dirOrFile, content);
    }
  }
}

pathsToScan.forEach(p => scanFiles(p));

if (hasViolations) {
  console.error('\n\x1b[33m⚠️ UI Guard Gate failed due to Design System violations.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m✅ UI Guard Gate passed successfully!\x1b[0m');
  process.exit(0);
}

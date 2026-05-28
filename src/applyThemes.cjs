const fs = require('fs');
const path = require('path');

const templatesDir = 'd:/Projects for Github/Billio/src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx') && f !== 'types.tsx');

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Apply borderStyle to invoice-print-area
  // Look for: padding: '...', (or similar near boxSizing)
  // We'll just inject it after boxSizing: 'border-box',
  if (!content.includes('border: borderStyle ===')) {
    content = content.replace(/boxSizing:\s*'border-box',/, 
      "boxSizing: 'border-box',\n        border: borderStyle === 'boxed' ? `2px solid ${accent}` : borderStyle === 'lines' ? '1px solid #e2e8f0' : 'none',");
  }

  // 2. Apply headerLayout to the Header container.
  // Most templates have: display: 'flex', justifyContent: 'space-between'
  // Let's replace the first instance of it (which is always the header)
  
  if (!content.includes('headerLayout === \'centered\' ? \'center\'')) {
    // A bit hacky but works for the templates we have
    content = content.replace(/justifyContent:\s*'space-between',/, 
      "justifyContent: headerLayout === 'split' ? 'space-between' : headerLayout === 'centered' ? 'center' : 'flex-start',\n        flexDirection: headerLayout === 'centered' ? 'column' : 'row',\n        textAlign: headerLayout === 'centered' ? 'center' : 'left',");
  }

  // Ensure the business info text aligns center if headerLayout is centered
  if (content.includes('flex: 1') && !content.includes('textAlign: headerLayout')) {
      // Find the first flex: 1 (which is usually the business info wrapper)
      // Actually, we added textAlign to the parent, but flex children might need it.
      content = content.replace(/flex:\s*1,?\s*/, "flex: headerLayout === 'split' ? 1 : 'none', textAlign: headerLayout === 'centered' ? 'center' : 'left', ");
  }

  // Also remove duplicate headerLayout from MinimalModern due to my previous script
  content = content.replace(/const headerLayout = themeOverrides\?\.headerLayout \?\? 'split';\r?\n\s*const headerLayout = themeOverrides\?\.headerLayout \?\? 'split';/g, 
    "const headerLayout = themeOverrides?.headerLayout ?? 'split';");

  fs.writeFileSync(filePath, content);
  console.log(`Applied Layout to ${file}`);
}

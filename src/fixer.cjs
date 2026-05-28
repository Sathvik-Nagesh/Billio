const fs = require('fs');
const path = require('path');

const templatesDir = 'd:/Projects for Github/Billio/src/templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx') && f !== 'types.tsx');

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Watermark fix
  content = content.replace(/zIndex:\s*0/g, 'zIndex: 50');

  // 2. Amount In Words fix
  const amountRegex1 = /<div style={{[^}]*}}>\s*\{L\.amountInWords\}:\s*\{calculations\.amountInWords\}\s*<\/div>/g;
  const amountRegex2 = /<div style={{[^}]*}}>\s*\{calculations\.amountInWords\}\s*<\/div>/g;
  
  const boldAmount = `<div style={{ marginTop: '4mm', padding: '3mm', border: \`1px solid \${accent}40\`, borderRadius: '4px', backgroundColor: \`\${accent}05\` }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '1mm', fontWeight: 600 }}>{L.amountInWords}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{calculations.amountInWords}</div>
          </div>`;

  if (amountRegex1.test(content)) {
    content = content.replace(amountRegex1, boldAmount);
  } else if (amountRegex2.test(content)) {
    content = content.replace(amountRegex2, boldAmount);
  }

  // 3. Header Layout and Border Style Extraction
  if (!content.includes('const borderStyle')) {
    content = content.replace(/const logoSizePx =/, `const headerLayout = themeOverrides?.headerLayout ?? 'split';\n  const borderStyle = themeOverrides?.borderStyle ?? 'lines';\n  const logoSizePx =`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}

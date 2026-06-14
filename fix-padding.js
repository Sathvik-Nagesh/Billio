const fs = require('fs');
const files = [
  'src/templates/PublicationFocus.tsx',
  'src/templates/ElegantSerif.tsx',
  'src/templates/BoldContemporary.tsx',
  'src/templates/MinimalModern.tsx',
  'src/templates/PremiumCorporate.tsx',
];
const from = "padding: '1.5mm 2mm'";
const to = "padding: '2mm 2mm'";
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const count = (c.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  c = c.split(from).join(to);
  fs.writeFileSync(f, c);
  console.log(`${f}: replaced ${count} occurrence(s)`);
});
console.log('All done!');

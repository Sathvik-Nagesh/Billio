const fs = require('fs');
const pngToIco = require('png-to-ico');

pngToIco('build/Logo.png')
  .then(buf => fs.writeFileSync('build/icon.ico', buf))
  .catch(console.error);

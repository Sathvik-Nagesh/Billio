import fs from 'fs';
import pngToIco from 'png-to-ico';

async function buildIco() {
  try {
    const buf = await pngToIco('build/Logo.png');
    fs.writeFileSync('build/icon.ico', buf);
    console.log('Successfully wrote icon.ico');
  } catch (err) {
    console.error(err);
  }
}

buildIco();

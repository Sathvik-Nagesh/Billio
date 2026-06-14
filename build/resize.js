import Jimp from 'jimp';

Jimp.read('build/Logo.png')
  .then(image => {
    return image
      .resize(256, 256)
      .writeAsync('build/Logo256.png');
  })
  .then(() => {
    console.log('Successfully resized Logo.png to 256x256');
  })
  .catch(err => {
    console.error('Error resizing logo:', err);
  });

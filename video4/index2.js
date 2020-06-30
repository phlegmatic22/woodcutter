//var robot = require('robotjs');
const { Image } = require('image-js');
const screenshot = require('screenshot-desktop')
const { getPaletteFromURL } = require('color-thief-node');

var d = new Date().getTime();

/* function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
} */

async function execute() {
  await screenshot({ filename: 'shot.jpg' });
  let image = await Image.load('shot.jpg');

  let x0 = 96, y0 = 40, w = 43, h = 9;

  let cropped1 = image.crop({
    x: x0,
    y: y0,
    width: w,
    height: h
  });
  let found = false;
  await cropped1.save("cropped.jpg");
  const colorPallete = await getPaletteFromURL('cropped.jpg');

  for (const element of colorPallete) {
  

    if (element[0] < 90 && element[1] > 150 && element[2] > 150){
      console.log('good color!')
      found = true;
      break;
    }

  };

  var d2 = new Date().getTime();
  console.log('runtime ', (d2-d)/1000)
  return found;
}






execute().catch(console.error);


const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const showErrorMessage = () => console.log('Something went wrong... Try again');

const editImage = async function(image, action) {
  switch (action) {
    case 'make image brighter':
      image.brightness(0.3);
      break;
    case 'increase contrast':
      image.contrast(0.3);
      break;
    case 'make image b&w':
      image.greyscale();
      break;
    case 'invert image':
      image.invert();
      break;
    default:
      break;
  }
};

const addTextWatermarkToImage = async function(image, outputFile, text) {
  try {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
  }
  catch {
    showErrorMessage();
  }

  console.log('Success');
  startApp();
};

const addImageWatermarkToImage = async function(image, outputFile, watermarkFile) {
  try {
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
  }
  catch {
    showErrorMessage();
  }

  console.log('Success');
  startApp();
};

const prepareOutputFilename = inputFilename => {
  const name = inputFilename.substring(0, inputFilename.lastIndexOf('.'));
  const ext = inputFilename.substring(inputFilename.lastIndexOf('.'), inputFilename.length);

  return name + '-with-watermark' + ext;
};

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file
  const input = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }]);
  
  const inputPath = './img/' + input.inputImage;
  
  if (fs.existsSync(inputPath)) {
    const image = await Jimp.read(inputPath);

    const editAnswer = await inquirer.prompt([{
      name: 'edit',
      message: 'Do you want any extra modification?',
      type: 'confirm',
    }]);

    if (editAnswer.edit) {
      const editOptions = await inquirer.prompt([{
        name: 'option',
        type: 'list',
        choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image'],
        message: 'Choice modification type:',
      }]);

      editImage(image, editOptions.option);
    }


    const markOptions = await inquirer.prompt([{
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
      message: 'Choice watermark type:',
    }]);
  
    if(markOptions.watermarkType === 'Text watermark') {
      const text = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      }]);
      markOptions.watermarkText = text.value;
      addTextWatermarkToImage(image, './img/' + prepareOutputFilename(input.inputImage), markOptions.watermarkText);
    }
    else {
      const markImage = await inquirer.prompt([{
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      }])
      markOptions.watermarkImage = markImage.filename;
      const watermarkPath = './img/' + markOptions.watermarkImage;
      if (fs.existsSync(watermarkPath)) {
        addImageWatermarkToImage(image, './img/' + prepareOutputFilename(input.inputImage), watermarkPath);
      } else {
        showErrorMessage();
      }
    }
  }
   else {
    showErrorMessage();
   }
}

startApp();

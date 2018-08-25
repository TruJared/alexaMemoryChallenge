const Alexa = require('ask-sdk-core');

const stories = require('./stories');

// * helpers //
// // todo figure out how to make modular //
// returns true if the skill is running on a device with a display (show|spot)
const supportsDisplay = (handlerInput) => {
  const hasDisplay = handlerInput.requestEnvelope.context
    && handlerInput.requestEnvelope.context.System
    && handlerInput.requestEnvelope.context.System.device
    && handlerInput.requestEnvelope.context.System.device.supportedInterfaces
    && handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
  return hasDisplay;
};
const getDisplay = (response, attributes, imageUrl, displayType) => {
  const image = new Alexa.ImageHelper().addImageInstance(imageUrl).getImage();
  const currentScore = attributes.correctCount;
  let displayScore = '';
  console.log(`the display type is => ${displayType}`);

  if (typeof attributes.correctCount !== 'undefined') {
    displayScore = `Score: ${currentScore}`;
  } else {
    displayScore = "Score: 0. Let's get started!";
  }

  const myTextContent = new Alexa.RichTextContentHelper()
    .withPrimaryText(`Question #${attributes.counter + 1}<br/>`)
    .withSecondaryText(attributes.lastResult)
    .withTertiaryText(`<br/> <font size='4'>${displayScore}</font>`)
    .getTextContent();

  if (displayType === 'BodyTemplate7') {
    // use background image
    response.addRenderTemplateDirective({
      type: displayType,
      backButton: 'visible',
      backgroundImage: image,
      title: 'Memory Challenge',
      textContent: myTextContent,
    });
  } else {
    response.addRenderTemplateDirective({
      // use 340x340 image on the right with text on the left.
      type: displayType,
      backButton: 'visible',
      image,
      title: 'Memory Challenge',
      textContent: myTextContent,
    });
  }

  return response;
};

const getNextStory = (handlerInput) => {
  const shuffle = (arr) => {
    let ctr = arr.length;
    let temp;
    let index;
    while (ctr > 0) {
      index = Math.floor(Math.random() * ctr);
      ctr--;
      temp = arr[ctr];
      arr[ctr] = arr[index];
      arr[index] = temp;
    }
    return arr;
  };
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  let storiesDeck = [];

  if (!attributes.counter) {
    // skill launched for first time - no counter set
    storiesDeck = shuffle(stories); // eslint-disable-line no-use-before-define
    attributes.storiesDeck = storiesDeck;
    attributes.counter = 0;
    attributes.correctCount = 0;
    attributes.wrongCount = 0;
  } else {
    storiesDeck = attributes.storiesDeck; // eslint-disable-line prefer-destructuring
  }

  const story = storiesDeck[attributes.counter];
  attributes.lastQuestion = story;
  handlerInput.attributesManager.setSessionAttributes(attributes);
  return story;
};

const checkAnswer = (handlerInput, answerSlot) => {
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  let status = '';
  let message = '';

  if (attributes.lastQuestion.answer.includes(answerSlot)) {
    console.log('correct');
    message = `Yup! ${answerSlot} is correct. `;
    attributes.correctCount += 1;
    status = true;
  } else {
    console.log('wrong');
    message = `Nope! ${answerSlot} is incorrect. `;
    attributes.wrongCount += 1;
    status = false;
  }
  attributes.counter += 1;
  handlerInput.attributesManager.setSessionAttributes(attributes);
  return { status, message };
};

module.exports = {
  supportsDisplay,
  getDisplay,
  getNextStory,
  checkAnswer,
};

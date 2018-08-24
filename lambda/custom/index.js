const Alexa = require('ask-sdk-core');

const WELCOME_MESSAGE = 'Welcome to memory challenge. I will read you a short passage, and then ask you question based on that. Are you ready?';
const HELP_MESSAGE = 'I will read you a short passage,and then ask you question based on that. Are you ready?';
const backgroundImageUrl = 'http://ajotwani.s3.amazonaws.com/alexa/background.png';

// * helper functions //
// todo figure out how to make modular //
// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
  const hasDisplay = handlerInput.requestEnvelope.context
    && handlerInput.requestEnvelope.context.System
    && handlerInput.requestEnvelope.context.System.device
    && handlerInput.requestEnvelope.context.System.device.supportedInterfaces
    && handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
  return hasDisplay;
}

function getDisplay(response, attributes, imageUrl, displayType) {
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
}

function getNextStory(handlerInput) {
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
}

function checkAnswer(handlerInput, answerSlot) {
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
}

// * request handlers //
// todo figure out how to make modular //
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = WELCOME_MESSAGE;
    const repromptSpeechOutput = HELP_MESSAGE;
    let response = '';

    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if (supportsDisplay(handlerInput)) {
      const displayType = 'BodyTemplate7';
      const imageUrl = backgroundImageUrl;
      response = getDisplay(handlerInput.responseBuilder, attributes, imageUrl, displayType);
    } else {
      response = handlerInput.responseBuilder;
    }

    return response
      .speak(speechOutput)
      .reprompt(repromptSpeechOutput)
      .getResponse();
  },
};

const StoryHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return (
      request.type === 'IntentRequest'
      && (request.intent.name === 'StartStoryIntent'
        || request.intent.name === 'AMAZON.StartOverIntent'
        || request.intent.name === 'AMAZON.YesIntent')
    );
  },
  handle(handlerInput) {
    const story = getNextStory(handlerInput);
    const speechOutput = story.question;

    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let response = '';

    if (supportsDisplay(handlerInput)) {
      const imageUrl = attributes.lastQuestion.image;
      const displayType = 'BodyTemplate2';
      response = getDisplay(handlerInput.responseBuilder, attributes, imageUrl, displayType);
    } else {
      response = handlerInput.responseBuilder;
    }

    return response
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const AnswerHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest'
      && request.intent.name === 'AnswerIntent'
      && attributes.counter < attributes.storiesDeck.length - 1
    );
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const answerSlot = handlerInput.requestEnvelope.request.intent.slots.answer.value;
    const result = checkAnswer(handlerInput, answerSlot);
    const story = getNextStory(handlerInput);
    const speechOutput = `${result.message}Here's your ${attributes.counter + 1}th question - ${
      story.question
    }`;

    let response = '';

    attributes.lastResult = result.message;
    handlerInput.attributesManager.setSessionAttributes(attributes);

    if (supportsDisplay(handlerInput)) {
      const imageUrl = attributes.lastQuestion.image;
      const displayType = 'BodyTemplate2';
      response = getDisplay(handlerInput.responseBuilder, attributes, imageUrl, displayType);
    } else {
      response = handlerInput.responseBuilder;
    }

    return response
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const FinalScoreHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest'
      && request.intent.name === 'AnswerIntent'
      && attributes.counter === attributes.storiesDeck.length - 1
    );
  },
  handle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    let response = '';

    if (supportsDisplay(handlerInput)) {
      const imageUrl = backgroundImageUrl;
      const displayType = 'BodyTemplate7';
      response = getDisplay(handlerInput.responseBuilder, attributes, imageUrl, displayType);
    } else {
      response = handlerInput.responseBuilder;
    }

    return response
      .speak(
        `${attributes.lastResult} Thank you for playing Memory Challenge. Your final score is ${
          attributes.correctCount
        } out of ${attributes.counter + 1}`,
      )
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StoryHandler,
    AnswerHandler,
    FinalScoreHandler,
    ErrorHandler,
  )
  .lambda();

// * stories //
// todo move to api //
const stories = [
  {
    question:
      "Jeff loves sports. His favorite sports in the Olympics are ice skating and skiing for the Winter Olympics, and basketball and volleyball for the Summer Olympics. What are Jeff's favorite games for the Winter Olympics?",
    answer: ['skating', 'ice skating', 'skiing'],
    image: 'https://ajotwani.s3.amazonaws.com/alexa/winter2.png',
  },
  {
    question:
      "Mike loves sports. His favorite sports in the Olympics are ice skating and skiing for the Winter Olympics, and basketball and volleyball for the Summer Olympics. What are John's favorite games for the Winter Olympics?",
    answer: ['skating', 'ice skating', 'skiing'],
    image: 'https://ajotwani.s3.amazonaws.com/alexa/winter2.png',
  },
  {
    question:
      'While traveling, Samantha likes to take her tooth brush, hair brush, face cream, and hair dryer. What does Samantha like to carry when she travels?',
    answer: ['tooth brush', 'hair brush', 'hair dryer', 'face cream'],
    image: 'https://ajotwani.s3.amazonaws.com/alexa/travel2.png',
  },
  {
    question:
      "Mark loves sports. His favorite sports in the Olympics are ice skating and skiing for the Winter Olympics, and basketball and volleyball for the Summer Olympics. What are John's favorite games for the Winter Olympics?",
    answer: ['skating', 'ice skating', 'skiing'],
    image: 'https://ajotwani.s3.amazonaws.com/alexa/winter2.png',
  },
  {
    question:
      'While traveling, Jessica likes to take her tooth brush, hair brush, face cream, and hair dryer. What does Samantha like to carry when she travels?',
    answer: ['tooth brush', 'hair brush', 'hair dryer', 'face cream'],
    image: 'https://ajotwani.s3.amazonaws.com/alexa/travel2.png',
  },
];

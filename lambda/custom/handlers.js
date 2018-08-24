const {
  supportsDisplay, getDisplay, getNextStory, checkAnswer,
} = require('./helpers');

const WELCOME_MESSAGE = 'Welcome to memory challenge. I will read you a short passage, and then ask you question based on that. Are you ready?';
const HELP_MESSAGE = 'I will read you a short passage,and then ask you question based on that. Are you ready?';
const backgroundImageUrl = 'http://ajotwani.s3.amazonaws.com/alexa/background.png';

// request handlers
// // todo figure out how to make modular //
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

export {
  LaunchRequestHandler, StoryHandler, AnswerHandler, FinalScoreHandler, ErrorHandler,
};

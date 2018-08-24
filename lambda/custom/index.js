const Alexa = require('ask-sdk-core');
const {
  LaunchRequestHandler,
  StoryHandler,
  AnswerHandler,
  FinalScoreHandler,
  ErrorHandler,
} = require('./handlers');

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

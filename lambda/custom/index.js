const Alexa = require('ask-sdk-core');
const customHandlers = require('./customHandlers');

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    customHandlers.LaunchRequestHandler,
    customHandlers.StoryHandler,
    customHandlers.AnswerHandler,
    customHandlers.FinalScoreHandler,
  )
  .addErrorHandlers(customHandlers.ErrorHandler)
  .lambda();

'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var functions = require('firebase-functions'); // Cloud Functions for Firebase library
var DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
var requestwithpromise = require('request-promise');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(function (request, response) {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  console.log('Access token: ', JSON.stringify(request.body.originalRequest.data.user.accessToken));
  if (request.body.result) {
    processV1Request(request, response);
  } else if (request.body.queryResult) {
    processV2Request(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
});
/*
* Function to handle v1 webhook requests from Dialogflow
*/
function processV1Request(request, response) {
  var action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  var parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  var inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  var requestSource = request.body.originalRequest ? request.body.originalRequest.source : undefined;
  var googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  var app = new DialogflowApp({ request: request, response: response });
  // Create handlers for Dialogflow actions as well as a 'default' handler
  var actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': function inputWelcome() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      } else {
        sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      }
    },

    'input.store.a.thing': function inputStoreAThing() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log("parameters: ", parameters);

      if (parameters.thing && parameters.place && parameters.thing.trim().length > 0 && parameters.thing.trim().length > 0) {

        var options = {
          method: 'POST',
          uri: 'https://us-central1-a-place-for-everything.cloudfunctions.net/api/api/thingsinplaces',
          headers: {
            'Authorization': ' Bearer ' + request.body.originalRequest.data.user.accessToken,
            'User-Agent': 'Google-Actions'
          },
          body: parameters,
          json: true
        };

        requestwithpromise(options).then(function (parsedBody) {
          // parsedBody = 'OK'
          if (requestSource === googleAssistantRequest) {
            sendGoogleResponse('Ok. The ' + parameters.thing + ' is ' + parameters.place + '.', true);
          } else {
            sendResponse('Ok. The ' + parameters.thing + ' is ' + parameters.place + '.');
          }
        }).catch(function (err) {
          console.log('Err: ', err);
          if (requestSource === googleAssistantRequest) {
            sendGoogleResponse('Something went wrong when I tried to remember that. Can you try again? ');
          } else {
            sendResponse('Something went wrong when I tried to remember that. Can you try again? ');
          }
        });
      } else {
        if (requestSource === googleAssistantRequest) {
          sendGoogleResponse('I didn\'t quite get that. Can you try again? ');
        } else {
          sendResponse('I didn\'t quite get that. Can you try again? ');
        }
      }
    },

    'input.find.a.thing': function inputFindAThing() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      console.log('Finding the ', parameters.thing);

      if (parameters.thing) {
        var options = {
          // uri: 'https://a-place-for-everything.firebaseapp.com/api/thingsinplaces/find?thing='
          //       + parameters.thing,
          uri: 'https://us-central1-a-place-for-everything.cloudfunctions.net/api/api/thingsinplaces/find?thing=' + parameters.thing,
          headers: {
            'Authorization': ' Bearer ' + request.body.originalRequest.data.user.accessToken,
            'User-Agent': 'Google-Actions'
          },
          json: true // Automatically parses the JSON string in the response
        };

        requestwithpromise(options).then(function (thingArray) {
          if (thingArray.length > 0) {
            if (requestSource === googleAssistantRequest) {
              sendGoogleResponse('The ' + thingArray[0].thing + ' is ' + thingArray[0].place, true);
            } else {
              sendResponse('The ' + thingArray[0].thing + ' is ' + thingArray[0].place);
            }
          } else {
            if (requestSource === googleAssistantRequest) {
              sendGoogleResponse('I couldn\'t find the ' + parameters.thing, true);
            } else {
              sendResponse('I couldn\'t find the ' + parameters.thing);
            }
          }
        }).catch(function (err) {
          console.log('Err: ', err);
          if (requestSource === googleAssistantRequest) {
            sendGoogleResponse('Something went wrong when I tried to find the ' + parameters.thing, true);
          } else {
            sendResponse('Something went wrong when I tried to find the ' + parameters.thing);
          }
        });
      } else {
        if (requestSource === googleAssistantRequest) {
          sendGoogleResponse('I didn\'t quite get that. Can you try again? ');
        } else {
          sendResponse('I didn\'t quite get that. Can you try again? ');
        }
      }
    },

    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': function inputUnknown() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
    // Default handler for unknown or undefined actions
    'default': function _default() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        var responseToUser = {
          //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
          //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        var _responseToUser = {
          //data: richResponsesV1, // Optional, uncomment to enable
          //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(_responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse(responseToUser, endConversation) {
    if (typeof responseToUser === 'string') {
      if (endConversation) {
        app.tell(responseToUser); // Google Assistant response
      } else {
        app.ask(responseToUser); // Google Assistant response
      }
    } else {
      // If speech or displayText is defined use it to respond
      var googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext.apply(app, _toConsumableArray(responseToUser.googleOutputContexts));
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      var responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      var _responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      _responseJson.speech = responseToUser.speech || responseToUser.displayText;
      _responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      _responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      _responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(_responseJson));
      response.json(_responseJson); // Send response to Dialogflow
    }
  }
}
// Construct rich response for Google Assistant (v1 requests only)
var app = new DialogflowApp();
var googleRichResponse = app.buildRichResponse().addSimpleResponse('This is the first simple response for Google Assistant').addSuggestions(['Suggestion Chip', 'Another Suggestion Chip'])
// Create a basic card and add it to the rich response
.addBasicCard(app.buildBasicCard('This is a basic card.  Text in a\n basic card can include "quotes" and most other unicode characters\n including emoji \uD83D\uDCF1.  Basic cards also support some markdown\n formatting like *emphasis* or _italics_, **strong** or __bold__,\n and ***bold itallic*** or ___strong emphasis___ as well as other things\n like line  \nbreaks') // Note the two spaces before '\n' required for a
// line break to be rendered in the card
.setSubtitle('This is a subtitle').setTitle('Title: this is a title').addButton('This is a button', 'https://assistant.google.com/').setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png', 'Image alternate text')).addSimpleResponse({ speech: 'This is another simple response',
  displayText: 'This is the another simple response 💁' });
// Rich responses for Slack and Facebook for v1 webhook requests
var richResponsesV1 = {
  'slack': {
    'text': 'This is a text response for Slack.',
    'attachments': [{
      'title': 'Title: this is a title',
      'title_link': 'https://assistant.google.com/',
      'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji 📱.  Attachments also upport line\nbreaks.',
      'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
      'fallback': 'This is a fallback.'
    }]
  },
  'facebook': {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [{
          'title': 'Title: this is a title',
          'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
          'subtitle': 'This is a subtitle',
          'default_action': {
            'type': 'web_url',
            'url': 'https://assistant.google.com/'
          },
          'buttons': [{
            'type': 'web_url',
            'url': 'https://assistant.google.com/',
            'title': 'This is a button'
          }]
        }]
      }
    }
  }
};
/*
* Function to handle v2 webhook requests from Dialogflow
*/
function processV2Request(request, response) {
  // An action is a string used to identify what needs to be done in fulfillment
  var action = request.body.queryResult.action ? request.body.queryResult.action : 'default';
  // Parameters are any entites that Dialogflow has extracted from the request.
  var parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  var inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  var requestSource = request.body.originalDetectIntentRequest ? request.body.originalDetectIntentRequest.source : undefined;
  // Get the session ID to differentiate calls from different users
  var session = request.body.session ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  var actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': function inputWelcome() {
      sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': function inputUnknown() {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
    },
    // Default handler for unknown or undefined actions
    'default': function _default() {
      var responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      var responseJson = { fulfillmentText: responseToUser }; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      var _responseJson2 = {};
      // Define the text response
      _responseJson2.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        _responseJson2.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        _responseJson2.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(_responseJson2));
      response.json(_responseJson2);
    }
  }
}
var richResponseV2Card = {
  'title': 'Title: this is a title',
  'subtitle': 'This is an subtitle.  Text can include unicode characters including emoji 📱.',
  'imageUri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  'buttons': [{
    'text': 'This is a button',
    'postback': 'https://assistant.google.com/'
  }]
};
var richResponsesV2 = [{
  'platform': 'ACTIONS_ON_GOOGLE',
  'simple_responses': {
    'simple_responses': [{
      'text_to_speech': 'Spoken simple response',
      'display_text': 'Displayed simple response'
    }]
  }
}, {
  'platform': 'ACTIONS_ON_GOOGLE',
  'basic_card': {
    'title': 'Title: this is a title',
    'subtitle': 'This is an subtitle.',
    'formatted_text': 'Body text can include unicode characters including emoji 📱.',
    'image': {
      'image_uri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png'
    },
    'buttons': [{
      'title': 'This is a button',
      'open_uri_action': {
        'uri': 'https://assistant.google.com/'
      }
    }]
  }
}, {
  'platform': 'FACEBOOK',
  'card': richResponseV2Card
}, {
  'platform': 'SLACK',
  'card': richResponseV2Card
}];
'use strict';

require('babel-polyfill');

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _aplaceforeverything = require('./aplaceforeverything.routes');

var _aplaceforeverything2 = _interopRequireDefault(_aplaceforeverything);

var _oauth = require('./oauth.routes');

var _oauth2 = _interopRequireDefault(_oauth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var functions = require('firebase-functions');
var admin = require('firebase-admin');

// import dialogflowFulfillment from './dialogFlowFulfillment.js';

admin.initializeApp(functions.config().firebase);
var app = (0, _express2.default)();
app.use((0, _cors2.default)());
// app.use(oauth);
app.use(_aplaceforeverything2.default);
exports.api = functions.https.onRequest(app);
exports.auth = _oauth2.default.auth;
exports.userloggedin = _oauth2.default.userloggedin;
exports.token = _oauth2.default.token;
// exports.dialogflowFirebaseFulfillment = dialogflowFulfillment.dialogflowFirebaseFulfillment;
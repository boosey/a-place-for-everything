import 'babel-polyfill';
import cors from 'cors';
import express from 'express';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
import aplaceforeverything from './aplaceforeverything.routes';
import oauth from './oauth.routes';
// import dialogflowFulfillment from './dialogFlowFulfillment.js';

admin.initializeApp(functions.config().firebase);
const app = express();
app.use(cors());
// app.use(oauth);
app.use(aplaceforeverything);
exports.api = functions.https.onRequest(app);
exports.auth = oauth.auth;
exports.userloggedin = oauth.userloggedin;
exports.token = oauth.token;
// exports.dialogflowFirebaseFulfillment = dialogflowFulfillment.dialogflowFirebaseFulfillment;

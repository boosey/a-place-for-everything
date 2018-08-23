'use strict';

var functions = require('firebase-functions');
var jwt = require('jsonwebtoken');

var jwt_signing_secret = 'thisisthesecret'; // this should really be in a config file somewhere
var projectName = 'a-place-for-everything'; // can probably get this from the app object

var verifyClientId = 'thingsinplacesgoogleclientid';
var verifyClientSecret = 'thingsinplacesgoogleclientidsecret';
var verifyBaseRedirectURI = 'https://oauth-redirect.googleusercontent.com/r/' + projectName;
var verifyResponseType = 'code';
var grantTypeAuthorizationCode = 'authorization_code';
var grantTypeRefreshToken = 'refresh_token';
var tokenTypeAccess = 'ACCESS';
var tokenTypeRefresh = 'REFRESH';
var app_oauth_route = "https://a-place-for-everything.firebaseapp.com/index-oauth";

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.auth = functions.https.onRequest(function (req, res) {
  console.log("client_id: ", req.query.client_id);
  console.log("verify:    ", verifyClientId);
  console.log("redirect_uri: ", req.query.redirect_uri);
  console.log("verify:      :", verifyBaseRedirectURI);
  console.log("response_type: ", req.query.response_type);
  console.log("verify:        ", verifyResponseType);
  console.log("state: ", req.query.state);
  console.log("req: ", req);

  if (req.query.client_id === verifyClientId && req.query.redirect_uri === verifyBaseRedirectURI && req.query.response_type === verifyResponseType) {

    // redirect to oauth login page
    var redirect_uri = app_oauth_route + "?state=" + req.query.state;
    console.log("redirect to oauth login page: ", redirect_uri);
    res.redirect(redirect_uri);
  } else {
    res.status(400).send({ "error": "oauth Authorization Code request invalid" });
  }
});

exports.userloggedin = functions.https.onRequest(function (req, res) {
  // create AUTH code
  // user object comes in body with Google Oauth state too
  var reqBody = JSON.parse(req.body);
  console.log("userloggedin req:", req);
  console.log("userloggedin user:", reqBody.uid);

  var authCodeExpiration = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

  var auth_code = jwt.sign({
    client_id: verifyClientId,
    uid: reqBody.uid,
    email: reqBody.email,
    exp: authCodeExpiration
  }, jwt_signing_secret);

  res.send({
    "authorization_code": auth_code,
    "redirectURI": verifyBaseRedirectURI
  });
});

exports.token = functions.https.onRequest(function (req, res) {
  console.log("client_id: ", req.body.client_id);
  console.log("client_secret: ", req.body.client_secret);
  console.log("grant_type: ", req.body.grant_type);
  console.log("code: ", req.body.code);
  console.log("refresh_token: ", req.body.refresh_token);
  console.log("body: ", req.body);

  if (req.body.client_id == verifyClientId && req.body.client_secret == verifyClientSecret) {

    if (req.body.grant_type == grantTypeAuthorizationCode) {
      // decode the auth decode
      try {
        var decodedAuthCode = jwt.verify(req.body.code, jwt_signing_secret);
        if (decodedAuthCode.client_id == verifyClientId) {
          console.log("decodedAuthCode: ", decodedAuthCode);

          var _accessTokenExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year
          var access_token = jwt.sign({
            client_id: req.body.client_id,
            uid: decodedAuthCode.uid,
            token_type: tokenTypeAccess,
            exp: _accessTokenExpiration
          }, jwt_signing_secret);

          var refresh_token = jwt.sign({
            client_id: req.body.client_id,
            uid: decodedAuthCode.uid,
            token_type: tokenTypeAccess
          }, jwt_signing_secret);

          var retAuthCodeGrant = {
            'token_type': "bearer",
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': _accessTokenExpiration
          };
          console.log("authCode Grant return: ", retAuthCodeGrant);
          res.json(retAuthCodeGrant);
        } else {
          res.status(400).send({ "error": "invalid_grant", "grant_type": "authorization_code" });
        }
      } catch (err) {
        // err
        console.log("auth code decoding error: ", err);
        res.status(400).send({ "error": "could not decode authorization code; possibly expired" });
      }
    } else if (req.body.grant_type == grantTypeRefreshToken) {
      try {
        var decodedRefreshToken = jwt.verify(req.body.refresh_token, jwt_signing_secret);
        if (decodedRefreshToken.client_id == verifyClientId && decodedRefreshToken.token_type == tokenTypeRefresh) {
          var access_token = jwt.sign({
            client_id: req.body.client_id,
            uid: decodedRefreshToken.uid,
            token_type: tokenTypeAccess,
            exp: accessTokenExpiration
          }, jwt_signing_secret);

          res.json({
            'token_type': "bearer",
            'access_token': access_token,
            'expires_in': accessTokenExpiration
          });
        } else {
          res.status(400).send({ "error": "invalid_grant", "grant_type": "refresh_token" });
        }
      } catch (err) {
        res.status(400).send({ "error": "could not decode refresh token" });
      }
    } else {
      res.status(400).send({ "error": "unknown grant_type" });
    }
  } else {
    res.status(400).send({ "error": "invalid_grant - request level client_id and client_secret verification" });
  }
});
'use strict';

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jwt = require('jsonwebtoken');

var jwt_signing_secret = 'thisisthesecret'; // this should really be in a config file somewhere

module.exports = function (req, res, next) {

  // console.log("headers: ", JSON.stringify(req.headers));
  var authString = req.get("authorization");
  var userAgent = req.get("user-agent");
  if (authString) {
    var parts = authString.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      var token = parts[1];
      // console.log("token: !", token,"!");
      if (userAgent === 'Google-Actions') {
        var decodedToken = jwt.verify(token, jwt_signing_secret);
        // console.log("decodedToken: ", decodedToken);
        var d_uid = decodedToken.uid;
        if (d_uid) {
          req.decodedUserId = d_uid;
          // console.log('d_uid: ', d_uid);
          next();
        } else {
          console.log('error verifying Google-Actions token:');
          res.send(401);
        }
      } else {
        _firebaseAdmin2.default.auth().verifyIdToken(token).then(function (decodedToken) {
          var d_uid = decodedToken.uid;
          if (d_uid) {
            req.decodedUserId = d_uid;
            // console.log('d_uid: ', d_uid);
            next();
          }
        }).catch(function (error) {
          // Handle error
          console.log('error verifying token: ', error);
          res.send(401);
        });
      }
    } else {
      console.log("didn't find Bearer or token");
      res.send(401);
    }
  } else {
    console.log("no Authorization header");
    res.send(401);
  }
};
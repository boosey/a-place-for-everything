'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _verifyauthMw = require('./verifyauth.mw.js');

var _verifyauthMw2 = _interopRequireDefault(_verifyauthMw);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _express.Router();

router.use(_verifyauthMw2.default);

//GET all things for a user
router.route('/api/thingsinplaces').get(function (req, res, next) {
  (0, _util.getDB)('thingsinplaces/' + req.decodedUserId).then(function (retThingsinplaces) {
    res.send((0, _util.convertToArray)(retThingsinplaces));
    return;
  }).catch(function (error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

//FIND a thing by thing name
router.route('/api/thingsinplaces/find').get(function (req, res) {
  _firebaseAdmin2.default.database().ref('thingsinplaces/' + req.decodedUserId + '/').orderByChild('thingInLowerCase').equalTo(req.query.thing.trim().toLowerCase()).limitToFirst(1).once('value').then(function (snapshot) {
    var value = snapshot.val();
    // console.log("thing found: ", value);
    res.send((0, _util.convertToArray)(value));
  }).catch(function (error) {
    console.log('error finding thing: ', error);
    res.send(500);
  });
});

//POST a new thing in a place for a user
router.route('/api/thingsinplaces').post(function (req, res) {
  req.body.thing = req.body.thing.trim();
  req.body.place = req.body.place.trim();
  req.body.thingInLowerCase = req.body.thing.toLowerCase();
  _firebaseAdmin2.default.database().ref('/thingsinplaces/' + req.decodedUserId).push(req.body);
  res.send(200);
});

//GET a specific thing for a user by recordid
router.route('/api/thingsinplaces/:recordid').get(function (req, res) {
  (0, _util.getDB)('thingsinplaces/' + req.decodedUserId + '/' + req.params.recordid).then(function (retThinginplace) {
    res.send({ retThinginplace: retThinginplace });
    return;
  }).catch(function (error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

//DELETE a specific thing for a user
router.route('/api/thingsinplaces/:recordid').delete(function (req, res) {
  (0, _util.delDB)('thingsinplaces/' + req.decodedUserId + '/' + req.params.recordid).then(function () {
    res.send(200);
    return;
  }).catch(function (error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

//UPDATE a specific thing for a user
router.route('/api/thingsinplaces/:recordid').put(function (req, res) {
  req.body.thingInLowerCase = req.body.thing.toLowerCase();
  (0, _util.updateDB)('thingsinplaces/' + req.decodedUserId + '/' + req.params.recordid, req.body).then(function () {
    res.send(200);
    return;
  }).catch(function (error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

exports.default = router;
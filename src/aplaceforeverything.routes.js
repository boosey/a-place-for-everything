import { Router } from 'express';
import admin from 'firebase-admin';
import verifyAuth from './verifyauth.mw.js';

import { getDB, convertToArray, delDB, updateDB } from './util';

const router = new Router();

router.use(verifyAuth);

//GET all things for a user
router.route('/api/thingsinplaces').get((req, res, next) => {
  getDB(`thingsinplaces/${req.decodedUserId}`).then(retThingsinplaces => {
      res.send(convertToArray(retThingsinplaces));
      return;
    }).catch(function(error) {
      console.log('error getting things: ', error);
      res.send(500);
    });
});

//FIND a thing by thing name
router.route('/api/thingsinplaces/find').get((req, res) => {
  admin.database().ref(`thingsinplaces/${req.decodedUserId}/`)
    .orderByChild('thingInLowerCase')
    .equalTo(req.query.thing.trim().toLowerCase())
    .limitToFirst(1)
    .once('value')
    .then(snapshot => {
      var value = snapshot.val();
      // console.log("thing found: ", value);
      res.send(convertToArray(value));
    })
    .catch(function(error) {
      console.log('error finding thing: ', error);
      res.send(500);
    });
});

//POST a new thing in a place for a user
router.route('/api/thingsinplaces').post((req, res) => {
  req.body.thing = req.body.thing.trim();
  req.body.place = req.body.place.trim();
  req.body.thingInLowerCase = req.body.thing.toLowerCase();
  admin.database().ref(`/thingsinplaces/${req.decodedUserId}`).push(req.body);
  res.send(200);
});

//GET a specific thing for a user by recordid
router.route('/api/thingsinplaces/:recordid').get((req, res) => {
  getDB(`thingsinplaces/${req.decodedUserId}/${req.params.recordid}`).then(retThinginplace => {
    res.send({ retThinginplace });
    return;
  }).catch(function(error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

//DELETE a specific thing for a user
router.route('/api/thingsinplaces/:recordid').delete((req,res) => {
  delDB(`thingsinplaces/${req.decodedUserId}/${req.params.recordid}`).then(() => {
        res.send(200);
        return;
      }).catch(function(error) {
          console.log('error getting things: ', error);
          res.send(500);
        });
});

//UPDATE a specific thing for a user
router.route('/api/thingsinplaces/:recordid').put((req, res) => {
  req.body.thingInLowerCase = req.body.thing.toLowerCase();
  updateDB(`thingsinplaces/${req.decodedUserId}/${req.params.recordid}`, req.body).then(() => {
    res.send(200);
    return;
  }).catch(function(error) {
    console.log('error getting things: ', error);
    res.send(500);
  });
});

export default router;

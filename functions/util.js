'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertToArray = exports.updateDB = exports.delDB = exports.getDB = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getDB = exports.getDB = function getDB(path) {
  return new Promise(function (resolve) {
    _firebaseAdmin2.default.database().ref(path).once('value', function (snapshot) {
      return resolve(snapshot.val());
    });
  });
};
var delDB = exports.delDB = function delDB(path) {
  return new Promise(function (resolve) {
    _firebaseAdmin2.default.database().ref(path).remove();
    resolve();
  });
};
var updateDB = exports.updateDB = function updateDB(path, update) {
  return new Promise(function (resolve) {
    _firebaseAdmin2.default.database().ref(path).update(update).then(function () {
      return resolve();
    });
  });
};
var convertToArray = exports.convertToArray = function convertToArray(object) {
  if (!object) {
    return [];
  }
  return Object.keys(object).map(function (key) {
    return _extends({}, object[key], { id: key });
  });
};
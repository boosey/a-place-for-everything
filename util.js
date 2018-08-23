import admin from 'firebase-admin';

export const getDB = path => new Promise((resolve) => {
  admin.database().ref(path).once('value', snapshot => resolve(snapshot.val()));
})
export const delDB = path => new Promise((resolve) => {
  admin.database().ref(path).remove();
  resolve();
})
export const updateDB = (path, update) => new Promise((resolve) => {
  admin.database().ref(path).update(update).then(() => resolve());
})
export const convertToArray = object => {
  if (!object) {
    return [];
  }
  return Object.keys(object).map(key => ({ ...object[key], id: key}));
};

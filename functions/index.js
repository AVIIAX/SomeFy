/**
 * Import function triggers from their respective submodules:
 *
  
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const admin = require("firebase-admin");
admin.initializeApp();

const { updateTopHits } = require("./updateTopHits");
const { updateMostLiked } = require("./updateMostLiked");

exports.updateTopHits = updateTopHits;
exports.updateMostLiked = updateMostLiked;

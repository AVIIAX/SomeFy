/**
 * Import function triggers from their respective submodules:
 *
  
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = require("firebase-functions");

//const { updateTopHits } = require("./funcs/updateTopHits");
//const { updateMostLiked } = require("./funcs/updateMostLiked");
const { boostTrack } = require("./funcs/boostTrack");
const { demoteExpiredBoosts } = require("./funcs/demoteExpiredBoosts");

//exports.updateTopHits = updateTopHits;
//exports.updateMostLiked = updateMostLiked;
exports.boostTrack = boostTrack;
exports.demoteExpiredBoosts = demoteExpiredBoosts;

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.boostTrack = onCall(async (request) => {
  // Log only specific fields (avoid circular references)
  console.log("🔍 Authenticated User:", request.auth?.uid || "No auth");
  console.log("🎵 Track ID:", request.data?.trackId || "No trackId");

  // Ensure authentication
  if (!request.auth || !request.auth.uid) {
    console.error("🚨 No authentication detected in Cloud Function!");
    throw new HttpsError("unauthenticated", "You must be signed in to boost a track.");
  }

  const userId = request.auth.uid;
  const { trackId } = request.data;

  if (!trackId) {
    throw new HttpsError("invalid-argument", "Track ID is required.");
  }

  const db = admin.firestore();
  const trackRef = db.collection("track").doc(trackId);
  const userRef = db.collection("user").doc(userId);

  try {
    const userDoc = await userRef.get();
    const trackDoc = await trackRef.get();

    if (!userDoc.exists || !trackDoc.exists) {
      throw new HttpsError("not-found", "User or track not found.");
    }

    const userData = userDoc.data();
    const trackData = trackDoc.data();

    if (userData.credits < 5) {
      throw new HttpsError("failed-precondition", "Not enough credits.");
    }

    await db.runTransaction(async (transaction) => {
      transaction.update(trackRef, {
        boost: (trackData.boost || 0) + 1,
        boostExpiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        ),
      });

      transaction.update(userRef, {
        credits: userData.credits - 5,
      });
    });

    console.log("🎉 Boost successful!");
    return { success: true };
  } catch (error) {
    console.error("❌ Boost error:", error);
    throw new HttpsError("internal", "Failed to boost track.");
  }
});

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
  }
  
exports.demoteExpiredBoosts = onSchedule("every 1 hours", async (event) => {
  const db = admin.firestore();
  const now = new Date();

  try {
    // 1) Query all tracks where boostExpiresAt is in the past
    const snapshot = await db.collection("track")
      .where("boostExpiresAt", "<=", admin.firestore.Timestamp.fromDate(now))
      .get();

    if (snapshot.empty) {
      console.log("No tracks to demote.");
      return;
    }

    // 2) Batch updates to demote tracks
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const currentLevel = data.level || 0;
      let newLevel = currentLevel;

      if (currentLevel === 2) {
        newLevel = 1; // Demote from level 2 to level 1
      } else if (currentLevel === 1) {
        newLevel = 0; // Demote from level 1 to level 0
      } else {
        return; // No change needed for level 0
      }

      batch.update(doc.ref, {
        level: newLevel,
        boostExpiresAt: admin.firestore.FieldValue.delete(), // Remove expiration field if demoted
      });
    });

    await batch.commit();
    console.log(`Demoted ${snapshot.size} expired tracks.`);
  } catch (error) {
    console.error("Error demoting expired boosts:", error);
  }
});

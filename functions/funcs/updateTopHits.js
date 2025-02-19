exports.updateTopHits = onSchedule("every 5 minutes", async (event) => {
  const db = admin.firestore();

  try {
    // Query the top 10 tracks from the "track" collection, sorted by views descending
    const tracksSnapshot = await db.collection("track")
      .orderBy("views", "desc")
      .limit(10)
      .get();

    // Build an array of track IDs
    const topTrackIds = [];
    tracksSnapshot.forEach(doc => {
      topTrackIds.push(doc.id);
    });

    // Update (or create) the "topHits" document in the "playlists" collection
    // Set the "tracks" field to be the array of track IDs
    await db.collection("playlists").doc("topHits").set({
      tracks: topTrackIds,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log("Top Hits updated successfully.");
  } catch (error) {
    console.error("Error updating Top Hits:", error);
  }
});
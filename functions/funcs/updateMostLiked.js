const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

exports.updateMostLiked = onSchedule("every 5 minutes", async (event) => {
    const db = admin.firestore();
  
    try {
      // Retrieve all track documents
      const tracksSnapshot = await db.collection("track").get();
  
      // Build an array of objects with track id and likes count (length of liked array)
      const tracksWithLikes = [];
      tracksSnapshot.forEach(doc => {
        const data = doc.data();
        // If "liked" is not defined or not an array, default to an empty array.
        const likedArray = Array.isArray(data.liked) ? data.liked : [];
        tracksWithLikes.push({
          id: doc.id,
          likesCount: likedArray.length
        });
      });
  
      // Sort the array in descending order based on likesCount
      tracksWithLikes.sort((a, b) => b.likesCount - a.likesCount);
  
      // Extract the top 10 track IDs
      const topTrackIds = tracksWithLikes.slice(0, 10).map(track => track.id);
  
      // Update (or create) the "mostLiked" document in the "playlists" collection
      await db.collection("playlists").doc("mostLiked").set({
        tracks: topTrackIds,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  
      console.log("Most Liked updated successfully.");
    } catch (error) {
      console.error("Error updating Most Liked:", error);
    }
  });
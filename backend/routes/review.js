import express from "express";
import db from "../db/index.js";

const router = express.Router();

// Get reviews for a show
router.get("/show/:showId", async (req, res) => {
  try {
    const reviews = await db.collection("reviews")
      .find({ showId: req.params.showId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch show reviews" });
  }
});

// Create review
router.post("/", async (req, res) => {
  try {
    const { showId, rating, comment, userId } = req.body;

    if (!showId || !rating || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newReview = {
      showId,
      rating,
      comment: comment || "",
      userId,
      createdAt: new Date(),
    };

    await db.collection("reviews").insertOne(newReview);
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Get reviews for user
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await db.collection("reviews")
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});

export default router;
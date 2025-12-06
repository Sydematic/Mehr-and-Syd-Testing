import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase with Service Role Key (backend only!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET playlists by user ID
router.get("/:id/playlists", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("userId", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET favorites by user ID
router.get("/:id/favorites", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("userId", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET reviews by user ID
router.get("/:id/reviews", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("userId", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;

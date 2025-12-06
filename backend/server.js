import express from "express";
import cors from "cors";
import verifyToken from "./middleware/auth.js";

import showRouter from "./routes/show.js";
import playlistsRouter from "./routes/playlists.js";
import ratingsRouter from "./routes/ratings.js";
import usersRouter from "./routes/users.js";
import reviewRouter from "./routes/review.js";

const app = express();
app.use(express.json());

// Enable CORS for frontend
app.use(cors({
  origin: "http://localhost:5173",
}));

// Basic health check
app.get("/", (_req, res) => res.send('Backend server ran successfully!'));
app.get("/health", (_req, res) => res.json({ ok: true }));

// Protected ping test
app.get("/private/ping", verifyToken, (req, res) => {
  res.json({ ok: true, user: req.user ?? null });
});

// Routes
app.use("/shows", verifyToken, showRouter);
app.use("/playlists", playlistsRouter);  // optional: add verifyToken if needed
app.use("/ratings", ratingsRouter);

// User routes (playlists, favorites, reviews)
app.use("/api/users", usersRouter);

// Reviews routes by show or user
app.use("/api/reviews", reviewRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`"SceneIt" server running on http://localhost:${PORT}`));

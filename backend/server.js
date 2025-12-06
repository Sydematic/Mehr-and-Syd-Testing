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

// =========================================
// CORS CONFIG — ALLOWS LOCAL + NETLIFY + MOBILE
// =========================================
const allowedOrigins = [
  "http://localhost:5173",               // Vite local dev
  "http://localhost:3000",               // Optional local dev
  process.env.FRONTEND_URL,              // Netlify (Render env variable)
  "https://sceneit1111.netlify.app",     // Hard-coded fallback
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, mobile app, internal calls)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("🚫 BLOCKED BY CORS:", origin);
        return callback(new Error("CORS not allowed from: " + origin), false);
      }
    },
    credentials: true,
  })
);

// =========================================
// HEALTH CHECKS
// =========================================
app.get("/", (_req, res) =>
  res.send('Backend server ran successfully!')
);

app.get("/health", (_req, res) =>
  res.json({ ok: true })
);

// =========================================
// PROTECTED TEST ROUTE
// =========================================
app.get("/private/ping", verifyToken, (req, res) => {
  res.json({
    ok: true,
    user: req.user ?? null,
  });
});

// =========================================
// API ROUTES
// =========================================
app.use("/shows", verifyToken, showRouter);
app.use("/playlists", playlistsRouter);
app.use("/ratings", ratingsRouter);

// User routes
app.use("/api/users", usersRouter);

// Reviews routes
app.use("/api/reviews", reviewRouter);

// =========================================
// START SERVER
// =========================================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`"SceneIt" server running on port ${PORT}`);
});

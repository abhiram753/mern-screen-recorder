// server.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

const { Pool } = pkg;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

// PostgreSQL connection using connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // full Render Postgres URL
  ssl: { rejectUnauthorized: false },
});

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// --- API Routes ---

// Upload recording
app.post("/api/recordings", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filename = req.file.filename;
    const filepath = `/uploads/${filename}`;

    await pool.query(
      "INSERT INTO recordings (filename, filepath) VALUES ($1, $2)",
      [filename, filepath]
    );

    res.json({ message: "✅ Upload successful", filename, filepath });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "❌ Failed to save recording" });
  }
});

// Get all recordings
app.get("/api/recordings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recordings ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch recordings" });
  }
});

// Get a specific recording
app.get("/api/recordings/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recordings WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const recording = result.rows[0];
    res.sendFile(path.resolve(`.${recording.filepath}`));
  } catch (err) {
    console.error("Fetch single error:", err);
    res.status(500).json({ error: "❌ Failed to fetch recording" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

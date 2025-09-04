import express from "express";
import multer from "multer";
import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = 5000;

// --- Enable CORS ---
app.use(cors());

// --- Serve uploads folder statically ---
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


// --- MySQL Connection ---
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Abhiharshi@135",
  database: "screen_recorder",
});

// --- Storage Setup (store in uploads/) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// --- API Routes ---

// Upload recording
app.post("/api/recordings", upload.single("video"), async (req, res) => {
  try {
    const filename = req.file.filename;
    const filepath = `/uploads/${filename}`; // public URL

    await db.query(
      "INSERT INTO recordings (filename, filepath) VALUES (?, ?)",
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
    const [rows] = await db.query("SELECT * FROM recordings ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "❌ Failed to fetch recordings" });
  }
});

// Get a specific recording by id
app.get("/api/recordings/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM recordings WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    const recording = rows[0];
    res.sendFile(path.resolve(`.${recording.filepath}`));
  } catch (err) {
    console.error("Fetch single error:", err);
    res.status(500).json({ error: "❌ Failed to fetch recording" });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});



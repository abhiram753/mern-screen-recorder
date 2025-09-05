// server.js (mock DB version)
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

// Path to mock database
const DB_FILE = path.join(process.cwd(), "recordings.json");
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

// Helper functions
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// --- API Routes ---

// Upload recording
app.post("/api/recordings", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const recordings = readDB();
  const newRec = {
    id: uuidv4(),
    filename: req.file.filename,
    filepath: `/uploads/${req.file.filename}`,
    created_at: new Date().toISOString(),
  };
  recordings.push(newRec);
  writeDB(recordings);

  res.json({ message: "✅ Upload successful", ...newRec });
});

// Get all recordings
app.get("/api/recordings", (req, res) => {
  const recordings = readDB();
  res.json(recordings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

// Get a specific recording
app.get("/api/recordings/:id", (req, res) => {
  const recordings = readDB();
  const recording = recordings.find((r) => r.id === req.params.id);
  if (!recording) return res.status(404).json({ error: "Not found" });

  res.sendFile(path.resolve(`.${recording.filepath}`));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock server running on port ${PORT}`);
});


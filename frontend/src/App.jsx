import { useState, useRef } from "react";
import { Play, Square, Download, Upload, List } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RecordingsList from "./RecordingsList";

// Use environment variable if deployed
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Recorder() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setRecordedBlob(blob);
      chunks.current = [];
    };

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    const formData = new FormData();
    formData.append("video", recordedBlob, "recording.webm");

    try {
      const res = await fetch(`${API_URL}/api/recordings`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Upload successful! Check 'Recordings List'.");
        setVideoUrl(null);
        setRecordedBlob(null);
      } else {
        alert("❌ Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error uploading file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">🎥 Screen Recorder</h1>
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-lg">
        {videoUrl ? (
          <video controls src={videoUrl} className="rounded-lg mb-4 w-full" />
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
            <span className="text-gray-500">No recording yet</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          {!recording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
            >
              <Play size={18} /> Start
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
            >
              <Square size={18} /> Stop
            </button>
          )}

          {videoUrl && (
            <>
              <a
                href={videoUrl}
                download="recording.webm"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
              >
                <Download size={18} /> Download
              </a>

              <button
                onClick={handleUpload}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
              >
                <Upload size={18} /> Upload
              </button>
            </>
          )}

          <Link
            to="/recordings"
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
          >
            <List size={18} /> Recordings List
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Recorder />} />
        <Route path="/recordings" element={<RecordingsList />} />
      </Routes>
    </Router>
  );
}


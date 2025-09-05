import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RecordingsList() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null);     // Error state

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recordings`);
        if (!res.ok) throw new Error("Failed to fetch recordings");
        const data = await res.json();
        setRecordings(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load recordings");
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700 text-xl">Loading recordings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6">📂 Saved Recordings</h2>
      {recordings.length === 0 ? (
        <p className="text-gray-500">No recordings found.</p>
      ) : (
        <div className="grid gap-6 w-full max-w-5xl sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {recordings.map((rec) => {
            const videoSrc = `${API_URL}${rec.filepath}`;
            return (
              <div
                key={rec.id}
                className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex flex-col items-center"
              >
                <h3 className="font-semibold text-lg mb-2 text-center break-words">
                  {rec.filename}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {rec.created_at ? new Date(rec.created_at).toLocaleString() : ""}
                </p>
                <video controls src={videoSrc} className="rounded-lg mb-3 w-full max-w-[400px]" />
                <a
                  href={videoSrc}
                  download={rec.filename}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
                >
                  Download
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

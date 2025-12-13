import Layout from "../components/Layout";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

// --- Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const SCRAPE_ENDPOINT = `${API_BASE_URL}/scrape`;
const STATUS_ENDPOINT = `${API_BASE_URL}/status`;
const POLLING_INTERVAL = 3000; // 3 seconds
// ---------------------

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

export default function Extract({ theme, toggleTheme }) {
  const [single, setSingle] = useState("");
  const [bulk, setBulk] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileKey, setFileKey] = useState(Date.now());

  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  const canRun = useMemo(() => {
    return single.trim() !== "" || bulk.trim() !== "" || file !== null;
  }, [single, bulk, file]);

  const handleFile = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (
        !uploadedFile.name.endsWith(".txt") &&
        !uploadedFile.name.endsWith(".csv")
      ) {
        setError("Invalid file type. Please upload a .txt or .csv file.");
        setFile(null);
        setFileName("");
        setFileKey(Date.now());
        return;
      }
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setError(null);
      setTaskStatus(null);
      setTaskId(null);
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
    setFileKey(Date.now());
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (event) =>
        reject(new Error("Error reading file: " + event.target.error));
      reader.readAsText(file);
    });
  };

  // --- Polling Logic ---
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (id) => {
      try {
        const response = await fetch(`${STATUS_ENDPOINT}/${id}`);
        if (response.status === 404) {
          stopPolling();
          setIsLoading(false);
          setError(`Task ID ${id} not found or expired.`);
          return;
        }

        const data = await response.json();
        setTaskStatus(data);

        const status = data.status;
        if (status === "COMPLETED" || status === "FAILED") {
          stopPolling();
          setIsLoading(false);
          if (status === "FAILED") setError(data.error || "Task failed.");
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError(
          "Failed to fetch task status. Check console for network details."
        );
      }
    },
    [stopPolling]
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // --- Run Extraction ---
  const runExtraction = async () => {
    if (!canRun || isLoading) return;

    setIsLoading(true);
    setError(null);
    setTaskId(null);
    setTaskStatus(null);
    stopPolling();

    try {
      let urls = [];
      if (single.trim()) urls.push(single.trim());
      if (bulk.trim())
        urls = urls.concat(bulk.split("\n").map((url) => url.trim()));
      if (file) {
        const content = await readFileContent(file);
        urls = urls.concat(content.split(/\r?\n/).map((url) => url.trim()));
      }

      const validatedUrls = urls.filter(
        (url) => url.length > 0 && isValidUrl(url)
      );
      const uniqueUrls = [...new Set(validatedUrls)];

      if (uniqueUrls.length === 0) throw new Error("No valid URLs found.");

      const payload = { urls: uniqueUrls };

      const startResponse = await fetch(SCRAPE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || "Task initiation failed."
        );
      }

      const startData = await startResponse.json();
      const newTaskId = startData.task_id;

      if (!newTaskId) throw new Error("API did not return a task_id.");

      setTaskId(newTaskId);

      // Show initial progress
      setTaskStatus({
        status: "PENDING",
        progress: 0,
        total_urls: uniqueUrls.length,
        urls_processed: 0,
        time_elapsed_seconds: 0,
      });

      // Start polling
      intervalRef.current = setInterval(
        () => pollStatus(newTaskId),
        POLLING_INTERVAL
      );
    } catch (err) {
      console.error("Extraction Setup Failed:", err);
      setError(err.message || "Unknown error occurred.");
      setIsLoading(false);
      stopPolling();
    }
  };

  // --- Render Status ---
  const renderStatusDisplay = () => {
    if (!taskId) {
      return canRun ? (
        <div className="text-center text-sm opacity-70 p-2">
          Click "Start Extraction" to process your URLs.
        </div>
      ) : null;
    }

    const statusData = taskStatus || {
      status: "PENDING",
      progress: 0,
      total_urls: 0,
      urls_processed: 0,
      time_elapsed_seconds: 0,
    };

    const {
      status,
      urls_processed,
      total_urls,
      data,
      error: taskError,
      time_elapsed_seconds,
    } = statusData;

    // Compute dynamic progress
    const displayProgress = total_urls
      ? ((urls_processed / total_urls) * 100).toFixed(1)
      : 0;

    const intermediateStatuses = [
      "PENDING",
      "PROCESSING",
      "RESOLVING_URLS",
      "SCRAPING",
    ];

    // Show progress bar for all intermediate statuses
    if (intermediateStatuses.includes(status)) {
      const formattedTime = time_elapsed_seconds
        ? new Date(time_elapsed_seconds * 1000).toISOString().substring(11, 19)
        : "00:00:00";

      return (
        <div className="p-4 bg-yellow-600/90 text-yellow-100 rounded-lg border border-yellow-400 shadow-md space-y-2">
          <p className="font-bold flex items-center">
            ⏳ Task Status: {status}
          </p>
          <p className="text-xs font-mono opacity-80">Task ID: {taskId}</p>

          {/* PROGRESS BAR */}
          <div className="w-full bg-yellow-200 rounded-full h-2.5 dark:bg-yellow-700">
            <div
              className="bg-yellow-400 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p className="text-sm">
            Progress: {displayProgress}% ({urls_processed} / {total_urls} URLs
            processed)
          </p>
          <p className="text-xs opacity-70">Time Elapsed: {formattedTime}</p>
        </div>
      );
    }

    // Failed
    if (status === "FAILED") {
      return (
        <div className="p-4 bg-red-600/90 text-red-100 rounded-lg border border-red-400 shadow-md">
          <p className="font-bold mb-1 flex items-center">❌ Task Failed</p>
          <p className="text-xs font-mono opacity-80 mb-2">Task ID: {taskId}</p>
          <p className="text-sm">{taskError || "An unknown error occurred."}</p>
        </div>
      );
    }

    // Completed
    if (status === "COMPLETED") {
      const results = data || [];
      const totalEmails = results.reduce(
        (sum, item) => sum + (item.emails?.length || 0),
        0
      );
      const successfulUrls = results.filter(
        (item) => item.status === "success"
      ).length;
      const failedUrls = total_urls - successfulUrls;

      return (
        <div className="p-4 bg-green-400/90 text-green-950 rounded-lg border border-green-600 shadow-md">
          <p className="font-extrabold mb-1 flex items-center">
            ✅ Extraction Complete!
          </p>
          <p className="text-xs font-mono opacity-80 mb-2">
            Task ID: {taskId} | Duration: {time_elapsed_seconds.toFixed(2)}s
          </p>

          <p className="text-sm font-semibold">
            Results Summary:
            <ul className="list-disc list-inside mt-1 ml-4 text-xs font-normal space-y-0.5">
              <li>Total URLs Processed: {total_urls}</li>
              <li>Successfully Scraped URLs: {successfulUrls}</li>
              <li>Failed URLs: {failedUrls}</li>
              <li>Total Emails Found: {totalEmails}</li>
            </ul>
          </p>

          <p className="text-sm font-bold mt-3">
            Full Results ({results.length} records):
          </p>
          <pre className="mt-2 p-3 rounded bg-gray-900/80 text-white overflow-auto text-xs max-h-40 border border-gray-700">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto py-20"
      >
        <h2 className="text-3xl font-extrabold mb-4">
          Website Email Extraction
        </h2>
        <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 opacity-90">
                Single Website URL
              </label>
              <input
                value={single}
                onChange={(e) => {
                  setSingle(e.target.value);
                  setError(null);
                  setTaskStatus(null);
                  setTaskId(null);
                }}
                placeholder="https://example.com (must include http/https)"
                className="w-full p-3 rounded-lg bg-transparent border border-white/8 focus:border-white/20 transition duration-150"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 opacity-90">
                Bulk URLs (one per line)
              </label>
              <textarea
                value={bulk}
                onChange={(e) => {
                  setBulk(e.target.value);
                  setError(null);
                  setTaskStatus(null);
                  setTaskId(null);
                }}
                rows={6}
                placeholder="https://site1.com\nhttps://site2.org\n..."
                className="w-full p-3 rounded-lg bg-transparent border border-white/8 focus:border-white/20 transition duration-150"
              />

              {/* File Upload */}
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="file"
                  key={fileKey}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
                <label
                  htmlFor="file"
                  className="px-3 py-2 rounded-lg border border-white/6 hover:border-white/20 cursor-pointer transition duration-150"
                >
                  Upload File
                </label>
                <span className="text-sm opacity-70 truncate max-w-[200px]">
                  {fileName || "No file selected (.txt or .csv)"}
                </span>
                {file && (
                  <button
                    onClick={removeFile}
                    className="text-red-400 hover:text-red-300 text-sm ml-auto"
                    title="Remove file"
                  >
                    (Remove)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 text-right">
            <button
              disabled={!canRun || isLoading}
              onClick={runExtraction}
              className="px-5 py-2 rounded-lg font-bold transition duration-300 disabled:opacity-40 bg-gradient-to-r from-[#A06CD5] to-[#4ADE80] text-black hover:shadow-lg"
            >
              {isLoading ? "Processing..." : "Start Extraction"}
            </button>
          </div>

          {/* Status & Results */}
          <div className="pt-4 border-t border-white/10 mt-6">
            {error && (
              <div className="p-4 mb-4 bg-red-600/90 text-red-100 rounded-lg border border-red-400 shadow-md">
                <p className="font-bold mb-1 flex items-center">❌ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {renderStatusDisplay()}
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}

// import Layout from "../components/Layout";
// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function Extract({ theme, toggleTheme }) {
//   const [single, setSingle] = useState("");
//   const [bulk, setBulk] = useState("");
//   const [fileName, setFileName] = useState("");
//   const canRun = single.trim() !== "" || bulk.trim() !== "" || fileName !== "";
//   const handleFile = (e) => {
//     const f = e.target.files[0];
//     if (f) setFileName(f.name);
//     else setFileName("");
//   };
//   const run = () => {
//     alert(
//       "Start extraction. single:" +
//         single +
//         " bulkLen:" +
//         bulk.split("\n").length +
//         " file:" +
//         fileName
//     );
//   };
//   return (
//     <Layout theme={theme} toggleTheme={toggleTheme}>
//       <motion.section
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="max-w-3xl mx-auto py-20"
//       >
//         <h2 className="text-3xl font-extrabold mb-4">
//           Website Email Extraction
//         </h2>
//         <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
//           <div>
//             <label className="block text-sm mb-1">Single Website URL</label>
//             <input
//               value={single}
//               onChange={(e) => setSingle(e.target.value)}
//               placeholder="https://example.com"
//               className="w-full p-3 rounded-lg bg-transparent border border-white/8"
//             />
//           </div>
//           <div>
//             <label className="block text-sm mb-1">
//               Bulk URLs (one per line)
//             </label>
//             <textarea
//               value={bulk}
//               onChange={(e) => setBulk(e.target.value)}
//               rows={6}
//               className="w-full p-3 rounded-lg bg-transparent border border-white/8"
//             />
//             <div className="mt-2 flex items-center gap-3">
//               <input
//                 id="file"
//                 type="file"
//                 accept=".txt,.csv"
//                 onChange={handleFile}
//                 className="hidden"
//               />
//               <label
//                 htmlFor="file"
//                 className="px-3 py-2 rounded-lg border border-white/6 cursor-pointer"
//               >
//                 Upload file
//               </label>
//               <span className="text-sm opacity-70">
//                 {fileName || "No file"}
//               </span>
//             </div>
//           </div>
//           <div className="text-right">
//             <button
//               disabled={!canRun}
//               onClick={run}
//               className="px-5 py-2 rounded-lg font-bold disabled:opacity-40 bg-gradient-to-r from-[#A06CD5] to-[#4ADE80] text-black"
//             >
//               Start Extraction
//             </button>
//           </div>
//         </div>
//       </motion.section>
//     </Layout>
//   );
// }

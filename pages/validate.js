import Layout from "../components/Layout";
import { useState } from "react";
import { motion } from "framer-motion";

// --- API Configuration ---
const API_BASE_URL = "http://127.0.0.1:8000";
const EXTRACT_SHEET_ENDPOINT = `${API_BASE_URL}/extract/sheet`;
const VERIFY_UPLOAD_ENDPOINT = `${API_BASE_URL}/verify/upload`;
const VERIFY_ARRAY_ENDPOINT = `${API_BASE_URL}/verify/array`;
const STATUS_ENDPOINT = `${API_BASE_URL}/email/verify/status`;
const POLLING_INTERVAL = 3000; // 3 seconds

export default function Validate({ theme, toggleTheme }) {
  const [single, setSingle] = useState("");
  const [bulk, setBulk] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);

  // Google Sheet inputs
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetColumn, setSheetColumn] = useState("");
  const [sheetStartRow, setSheetStartRow] = useState("1");
  const [sheetEndRow, setSheetEndRow] = useState("");

  // File upload inputs
  const [fileEmailColumn, setFileEmailColumn] = useState("");
  const [fileUrlColumn, setFileUrlColumn] = useState("");
  const [fileStartRow, setFileStartRow] = useState("1");
  const [fileEndRow, setFileEndRow] = useState("");

  // Save-to-file for single/bulk only
  const [saveToFile, setSaveToFile] = useState(true);

  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canRun =
    !isProcessing &&
    (single.trim() !== "" ||
      bulk.trim() !== "" ||
      file ||
      sheetUrl.trim() !== "");

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    } else {
      setFile(null);
      setFileName("");
    }
  };

  // --- Poll task status ---
  const pollStatus = async (task_id) => {
    try {
      const res = await fetch(`${STATUS_ENDPOINT}/${task_id}`);
      const data = await res.json();
      setTaskStatus(data);

      if (data.status !== "COMPLETED" && data.status !== "FAILED") {
        setTimeout(() => pollStatus(task_id), POLLING_INTERVAL);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // --- Run validation ---
  const run = async () => {
    if (!canRun) return;
    setIsProcessing(true);
    setTaskStatus(null);
    setTaskId(null);

    try {
      let responseData = null;

      // 1. Google Sheet URL
      if (sheetUrl.trim()) {
        const extractRes = await fetch(EXTRACT_SHEET_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet_url: sheetUrl.trim(),
            column: sheetColumn || "",
            start_row: sheetStartRow || "1",
            end_row: sheetEndRow || "",
          }),
        });
        const extractData = await extractRes.json();
        const emailsFromSheet = extractData.emails || [];
        if (!emailsFromSheet.length) {
          alert("No emails found in the Google Sheet");
          setIsProcessing(false);
          return;
        }

        const verifyRes = await fetch(VERIFY_ARRAY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: emailsFromSheet }), // save_to_file not used
        });
        responseData = await verifyRes.json();
      }
      // 2. Single/Bulk Emails
      else if (single.trim() || bulk.trim()) {
        const emails = [];
        if (single.trim()) emails.push(single.trim());
        if (bulk.trim()) emails.push(...bulk.split("\n").map((e) => e.trim()));

        const verifyRes = await fetch(VERIFY_ARRAY_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails, save_to_file: saveToFile }),
        });
        responseData = await verifyRes.json();
      }
      // 3. File Upload
      else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("email_column", fileEmailColumn || "");
        formData.append("url_column", fileUrlColumn || "");
        formData.append("start_row", fileStartRow || "1");
        formData.append("end_row", fileEndRow || "");

        const verifyRes = await fetch(VERIFY_UPLOAD_ENDPOINT, {
          method: "POST",
          body: formData,
        });
        responseData = await verifyRes.json();
      }

      if (responseData?.task_id) {
        setTaskId(responseData.task_id);
        pollStatus(responseData.task_id);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error starting verification");
      setIsProcessing(false);
    }
  };

  // --- Render Task Status ---
  const renderStatusDisplay = () => {
    if (!taskId) {
      return canRun ? (
        <div className="text-center text-sm opacity-70 p-2">
          Click "Start Validation" to process your emails.
        </div>
      ) : null;
    }

    const statusData = taskStatus || {
      status: "PENDING",
      progress: 0,
      total_items: 0,
      items_processed: 0,
      time_elapsed_seconds: 0,
      results: [],
      error: null,
      authentic_email_count: 0,
      output_file_name: null,
    };

    const {
      status,
      items_processed,
      total_items,
      results,
      error: taskError,
      time_elapsed_seconds,
      output_file_name,
      authentic_email_count,
      progress,
    } = statusData;

    // Progress calculation
    const displayProgress =
      progress !== undefined
        ? progress.toFixed(1)
        : total_items
        ? ((items_processed / total_items) * 100).toFixed(1)
        : 0;

    const intermediateStatuses = [
      "PENDING",
      "PROCESSING",
      "VERIFYING_EMAILS",
      "SCRAPING",
      "RESOLVING_URLS",
    ];

    // Intermediate progress
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

          {/* Progress bar */}
          <div className="w-full bg-yellow-200 rounded-full h-2.5 dark:bg-yellow-700">
            <div
              className="bg-yellow-400 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p className="text-sm">
            Progress: {displayProgress}% ({items_processed || 0} /{" "}
            {total_items || 100})
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
      return (
        <div className="p-4 bg-green-400/90 text-green-950 rounded-lg border border-green-600 shadow-md space-y-2">
          <p className="font-extrabold mb-1 flex items-center">
            ✅ Verification Complete!
          </p>
          <p className="text-xs font-mono opacity-80 mb-2">
            Task ID: {taskId} | Duration: {time_elapsed_seconds.toFixed(2)}s
          </p>
          <p className="text-sm font-semibold">
            Summary:
            <ul className="list-disc list-inside mt-1 ml-4 text-xs font-normal space-y-0.5">
              <li>Total Items Processed: {total_items}</li>
              <li>Authentic Emails Found: {authentic_email_count || 0}</li>
              {output_file_name && <li>Output File: {output_file_name}</li>}
            </ul>
          </p>
          {results && results.length > 0 && (
            <>
              <p className="text-sm font-bold mt-2">Full Results:</p>
              <pre className="mt-2 p-3 rounded bg-gray-900/80 text-white overflow-auto text-xs max-h-40 border border-gray-700">
                {JSON.stringify(results, null, 2)}
              </pre>
            </>
          )}
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
        <h2 className="text-3xl font-extrabold mb-4">Email Validation</h2>
        <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          {/* Single Email */}
          <div>
            <label className="block text-sm mb-1">Single Email</label>
            <input
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder="name@example.com"
              className="w-full p-3 rounded-lg bg-transparent border border-white/8"
            />
          </div>

          {/* Bulk Emails */}
          <div>
            <label className="block text-sm mb-1">
              Bulk Emails (one per line)
            </label>
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-lg bg-transparent border border-white/8"
            />
          </div>

          {/* Save to file checkbox for single/bulk */}
          {(single.trim() || bulk.trim()) && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveToFile}
                onChange={(e) => setSaveToFile(e.target.checked)}
              />
              <label className="text-sm">Save results to Excel file</label>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm mb-1">
              Upload File (.txt, .csv, .xlsx)
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="filev"
                type="file"
                accept=".txt,.csv,.xlsx"
                onChange={handleFile}
                className="hidden"
              />
              <label
                htmlFor="filev"
                className="px-3 py-2 rounded-lg border border-white/6 cursor-pointer"
              >
                Upload file
              </label>
              <span className="text-sm opacity-70">
                {fileName || "No file"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
                value={fileEmailColumn}
                onChange={(e) => setFileEmailColumn(e.target.value)}
                placeholder="Email Column (e.g., B)"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
              <input
                value={fileUrlColumn}
                onChange={(e) => setFileUrlColumn(e.target.value)}
                placeholder="URL Column (optional)"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
              <input
                value={fileStartRow}
                onChange={(e) => setFileStartRow(e.target.value)}
                placeholder="Start Row"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
              <input
                value={fileEndRow}
                onChange={(e) => setFileEndRow(e.target.value)}
                placeholder="End Row (optional)"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
            </div>
          </div>

          {/* Google Sheet URL */}
          <div>
            <label className="block text-sm mb-1">Google Sheet URL</label>
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="w-full p-3 rounded-lg bg-transparent border border-white/8"
            />
            <div className="grid grid-cols-3 gap-3 mt-2">
              <input
                value={sheetColumn}
                onChange={(e) => setSheetColumn(e.target.value)}
                placeholder="Column (e.g., B)"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
              <input
                value={sheetStartRow}
                onChange={(e) => setSheetStartRow(e.target.value)}
                placeholder="Start Row"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
              <input
                value={sheetEndRow}
                onChange={(e) => setSheetEndRow(e.target.value)}
                placeholder="End Row (optional)"
                className="p-2 rounded-lg bg-transparent border border-white/8"
              />
            </div>
          </div>

          {/* Start Button */}
          <div className="text-right">
            <button
              disabled={!canRun}
              onClick={run}
              className="px-5 py-2 rounded-lg font-bold disabled:opacity-40 bg-gradient-to-r from-[#A06CD5] to-[#4ADE80] text-black"
            >
              {isProcessing ? "Processing..." : "Start Validation"}
            </button>
          </div>

          {/* Status Display */}
          {renderStatusDisplay()}
        </div>
      </motion.section>
    </Layout>
  );
}

// import Layout from "../components/Layout";
// import { useState } from "react";
// import { motion } from "framer-motion";

// export default function Validate({ theme, toggleTheme }) {
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
//       "Start validation. single:" +
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
//         <h2 className="text-3xl font-extrabold mb-4">Email Validation</h2>
//         <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
//           <div>
//             <label className="block text-sm mb-1">Single Email</label>
//             <input
//               value={single}
//               onChange={(e) => setSingle(e.target.value)}
//               placeholder="name@example.com"
//               className="w-full p-3 rounded-lg bg-transparent border border-white/8"
//             />
//           </div>
//           <div>
//             <label className="block text-sm mb-1">
//               Bulk Emails (one per line)
//             </label>
//             <textarea
//               value={bulk}
//               onChange={(e) => setBulk(e.target.value)}
//               rows={6}
//               className="w-full p-3 rounded-lg bg-transparent border border-white/8"
//             />
//             <div className="mt-2 flex items-center gap-3">
//               <input
//                 id="filev"
//                 type="file"
//                 accept=".txt,.csv"
//                 onChange={handleFile}
//                 className="hidden"
//               />
//               <label
//                 htmlFor="filev"
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
//               Start Validation
//             </button>
//           </div>
//         </div>
//       </motion.section>
//     </Layout>
//   );
// }

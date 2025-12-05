import Layout from "../components/Layout";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Extract({ theme, toggleTheme }) {
  const [single, setSingle] = useState("");
  const [bulk, setBulk] = useState("");
  const [fileName, setFileName] = useState("");
  const canRun = single.trim() !== "" || bulk.trim() !== "" || fileName !== "";
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) setFileName(f.name);
    else setFileName("");
  };
  const run = () => {
    alert(
      "Start extraction. single:" +
        single +
        " bulkLen:" +
        bulk.split("\n").length +
        " file:" +
        fileName
    );
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
        <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div>
            <label className="block text-sm mb-1">Single Website URL</label>
            <input
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3 rounded-lg bg-transparent border border-white/8"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Bulk URLs (one per line)
            </label>
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-lg bg-transparent border border-white/8"
            />
            <div className="mt-2 flex items-center gap-3">
              <input
                id="file"
                type="file"
                accept=".txt,.csv"
                onChange={handleFile}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="px-3 py-2 rounded-lg border border-white/6 cursor-pointer"
              >
                Upload file
              </label>
              <span className="text-sm opacity-70">
                {fileName || "No file"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <button
              disabled={!canRun}
              onClick={run}
              className="px-5 py-2 rounded-lg font-bold disabled:opacity-40 bg-gradient-to-r from-[#A06CD5] to-[#4ADE80] text-black"
            >
              Start Extraction
            </button>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}

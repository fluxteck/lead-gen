import Layout from "../components/Layout";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Search({ theme, toggleTheme }) {
  const [query, setQuery] = useState("");
  const doSearch = () => {
    alert("Search requested:\n" + query + "\n(Backend integration needed)");
  };
  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto py-20"
      >
        <h2 className="text-3xl font-extrabold mb-4">Business Search</h2>
        <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl">
          <label className="block mb-2">
            Enter command (e.g. "Hotels in New Delhi")
          </label>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-transparent border border-white/8 focus:outline-none"
              placeholder="Type business + location..."
            />
            <button
              onClick={doSearch}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A06CD5] to-[#4ADE80] text-black font-bold"
            >
              Search
            </button>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}

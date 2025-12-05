import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function Home({ theme, toggleTheme }) {
  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <section className="text-center py-20">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
        >
          Lead Automation, simplified.
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto text-lg"
        >
          Extract emails, validate contacts, and verify WhatsApp numbers — all
          from a sleek, minimal frontend ready to plug into your backend.
        </motion.p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl">
            <h4 className="font-bold mb-2">Business Search</h4>
            <p className="text-sm">
              Natural language search for local businesses (type + location).
            </p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl">
            <h4 className="font-bold mb-2">Website Email Extraction</h4>
            <p className="text-sm">
              Single or bulk URL extraction with file upload support.
            </p>
          </div>
          <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl">
            <h4 className="font-bold mb-2">Validation Suite</h4>
            <p className="text-sm">
              Email validation and WhatsApp verification in bulk or
              single-entry.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}


import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  ArrowUpRight,
  X,
  AlertCircle,
} from "lucide-react";

function isValidVideoUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtu.be",
    ];

    if (!allowedHosts.includes(host)) {
      return false;
    }

    if (host.includes("youtu.be")) {
      return url.pathname.length > 1;
    }

    return (
      (url.pathname === "/watch" && url.searchParams.has("v")) ||
      /^\/(shorts|embed|live)\/[^/]+/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export default function VideoForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isValidVideoUrl(url.trim())) {
      setStatus("error");
      return;
    }

    setStatus("ready");
  };

  const handleChange = (event) => {
    setUrl(event.target.value);
    setStatus("idle");
  };

  const clearUrl = () => {
    setUrl("");
    setStatus("idle");
  };

  return (
    <motion.section
      className="video-form-container"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <form onSubmit={handleSubmit}>
        <div className={`glass-url-bar ${status === "error" ? "field-error" : ""}`}>
          <div className="glass-url-icon">
            <Link2 size={21} strokeWidth={1.8} />
          </div>

          <input
            type="url"
            placeholder="Collez votre lien vidéo ici..."
            value={url}
            onChange={handleChange}
            aria-label="Lien de la vidéo"
          />

          {url && (
            <button
              type="button"
              className="clear-button"
              onClick={clearUrl}
              aria-label="Effacer le lien"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="submit"
            className="glass-submit-button"
            disabled={!url.trim()}
            aria-label="Analyser le lien"
            title="Analyser le lien"
          >
            <ArrowUpRight size={20} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status === "error" && (
            <motion.div
              className="error-text"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <AlertCircle size={15} />
              Veuillez saisir un lien YouTube valide.
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div
              className="success-text"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Lien reconnu ! L'analyse sera disponible après
              l'intégration du système de téléchargement.
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.section>
  );
}

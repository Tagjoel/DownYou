
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  ArrowUpRight,
  X,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
  Play,
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

    if (!allowedHosts.includes(host)) return false;

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
  const [videoData, setVideoData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUrl = url.trim();

    if (!isValidVideoUrl(cleanUrl)) {
      setStatus("error");
      setErrorMessage("Veuillez saisir un lien YouTube valide.");
      setVideoData(null);
      return;
    }

    try {
      setStatus("loading");
      setVideoData(null);
      setErrorMessage("");

      const params = new URLSearchParams({ url: cleanUrl });

      const response = await fetch(
        `http://127.0.0.1:8000/api/video-info?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Impossible de récupérer cette vidéo.");
      }

      setVideoData(data);
      setStatus("success");
    } catch (error) {
      console.error("Erreur API :", error);
      setErrorMessage(
        error.message || "Impossible de contacter le serveur."
      );
      setStatus("server-error");
    }
  };

  const handleChange = (event) => {
    setUrl(event.target.value);
    setStatus("idle");
    setVideoData(null);
    setErrorMessage("");
  };

  const clearUrl = () => {
    setUrl("");
    setStatus("idle");
    setVideoData(null);
    setErrorMessage("");
  };

  return (
    <motion.section
      className="video-form-container"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <form onSubmit={handleSubmit}>
        <div
          className={`glass-url-bar ${
            status === "error" ? "field-error" : ""
          }`}
        >
          <div className="glass-url-icon">
            <Link2 size={21} strokeWidth={1.8} />
          </div>

          <input
            type="url"
            placeholder="Collez votre lien vidéo ici..."
            value={url}
            onChange={handleChange}
            aria-label="Lien de la vidéo"
            disabled={status === "loading"}
          />

          {url && status !== "loading" && (
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
            disabled={!url.trim() || status === "loading"}
            aria-label="Analyser le lien"
            title="Analyser le lien"
          >
            {status === "loading" ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <ArrowUpRight size={20} />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {(status === "error" || status === "server-error") && (
            <motion.div
              className="error-text"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <AlertCircle size={15} />
              {errorMessage}
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div
              className="loading-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoaderCircle size={15} className="animate-spin" />
              Récupération des informations...
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {status === "success" && videoData && (
          <motion.div
            className="video-preview-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4 }}
          >
            <div className="video-preview-header">
              <div className="video-preview-status">
                <CheckCircle2 size={15} />
                <span>Vidéo reconnue</span>
              </div>
              <span className="video-provider">
                {videoData.provider}
              </span>
            </div>

            <div className="video-preview-content">
              <div className="video-thumbnail">
                <img
                  src={videoData.thumbnail}
                  alt={`Miniature de ${videoData.title}`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <div className="thumbnail-play">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>

              <div className="video-preview-info">
                <h2>{videoData.title}</h2>
                <p>{videoData.author}</p>
                <span className="video-preview-label">
                  Aperçu de la vidéo
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

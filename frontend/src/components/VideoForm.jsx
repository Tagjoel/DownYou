
import { useRef, useState } from "react";
import {
  Link2,
  Upload,
  FileVideo,
  Music,
  Video,
  Download,
  LoaderCircle,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

export default function VideoForm() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("mp4");

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  const handleVideoInfo = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setVideoInfo(null);

    if (!url.trim()) {
      setError("Veuillez coller un lien YouTube.");
      return;
    }

    try {
      setLoadingInfo(true);

      const response = await fetch(
        `${API_URL}/api/video-info?url=${encodeURIComponent(url)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Impossible de récupérer la vidéo.");
      }

      setVideoInfo(data);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) return;

    const allowedExtensions = [
      ".mp4",
      ".mov",
      ".mkv",
      ".avi",
      ".webm",
      ".m4v",
    ];

    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setError("Ce format vidéo n'est pas accepté.");
      return;
    }

    if (selectedFile.size > 500 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 500 Mo.");
      return;
    }

    setFile(selectedFile);
  };

  const handleConversion = async () => {
    if (!file) {
      setError("Veuillez d'abord sélectionner une vidéo.");
      return;
    }

    setError("");
    setSuccess("");
    setConverting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("output_format", format);

    try {
      const response = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "La conversion a échoué.");
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const originalName = file.name.replace(/\.[^/.]+$/, "");

      link.href = downloadUrl;
      link.download = `${originalName}.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(
        `Conversion terminée ! Ton fichier ${format.toUpperCase()} a été téléchargé.`
      );
    } catch (err) {
      setError(err.message || "Une erreur est survenue pendant la conversion.");
    } finally {
      setConverting(false);
    }
  };

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes) => {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
      : `${(bytes / 1024).toFixed(0)} Ko`;
  };

  return (
    <section className="video-form-section">

      {/* RECONNAISSANCE YOUTUBE */}

      <form className="video-form" onSubmit={handleVideoInfo}>
        <div className="video-input-wrapper">
          <Link2 size={20} />

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Collez votre lien YouTube ici..."
          />

          <button type="submit" disabled={loadingInfo}>
            {loadingInfo ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              "Analyser"
            )}
          </button>
        </div>
      </form>

      {videoInfo && (
        <div className="video-preview-card">
          <div className="video-preview-header">
            <span className="video-preview-status">
              <CheckCircle2 size={16} />
              Vidéo reconnue
            </span>
            <span className="video-provider">{videoInfo.provider}</span>
          </div>

          <div className="video-preview-content">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="video-thumbnail"
            />

            <div className="video-preview-info">
              <h3>{videoInfo.title}</h3>
              <p>{videoInfo.author}</p>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATEUR */}

      <div className="converter-divider">
        <span>OU CONVERTIR UN FICHIER VIDÉO</span>
      </div>

      {/* IMPORTATION DU FICHIER */}

      <div className="converter-card">

        <div className="converter-heading">
          <div className="converter-icon">
            <FileVideo size={23} />
          </div>

          <div>
            <h3>Convertisseur vidéo</h3>
            <p>Transformez vos vidéos en MP4 ou en MP3.</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.mkv,.avi,.webm,.m4v,video/*"
          onChange={handleFileChange}
          hidden
        />

        {!file ? (
          <button
            type="button"
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">
              <Upload size={25} />
            </div>

            <strong>Importer une vidéo</strong>

            <span>
              Cliquez pour sélectionner un fichier depuis votre ordinateur
            </span>

            <small>MP4, MOV, MKV, AVI, WEBM · Maximum 500 Mo</small>
          </button>
        ) : (
          <div className="selected-file">
            <div className="selected-file-icon">
              <FileVideo size={23} />
            </div>

            <div className="selected-file-info">
              <strong>{file.name}</strong>
              <span>{formatSize(file.size)}</span>
            </div>

            <button
              type="button"
              className="remove-file-button"
              onClick={removeFile}
              disabled={converting}
              aria-label="Retirer le fichier"
            >
              <X size={19} />
            </button>
          </div>
        )}

        {/* CHOIX DU FORMAT */}

        <div className="format-selection">
          <label>Format de sortie</label>

          <div className="format-options">

            <button
              type="button"
              className={`format-option ${format === "mp4" ? "active" : ""}`}
              onClick={() => setFormat("mp4")}
              disabled={converting}
            >
              <Video size={21} />
              <span>
                <strong>MP4</strong>
                <small>Vidéo</small>
              </span>
              {format === "mp4" && <CheckCircle2 size={17} />}
            </button>

            <button
              type="button"
              className={`format-option ${format === "mp3" ? "active" : ""}`}
              onClick={() => setFormat("mp3")}
              disabled={converting}
            >
              <Music size={21} />
              <span>
                <strong>MP3</strong>
                <small>Audio</small>
              </span>
              {format === "mp3" && <CheckCircle2 size={17} />}
            </button>

          </div>
        </div>

        {/* BOUTON DE CONVERSION */}

        <button
          type="button"
          className="convert-button"
          onClick={handleConversion}
          disabled={!file || converting}
        >
          {converting ? (
            <>
              <LoaderCircle className="spin" size={19} />
              Conversion en cours...
            </>
          ) : (
            <>
              <Download size={19} />
              Convertir en {format.toUpperCase()}
            </>
          )}
        </button>

        {converting && (
          <p className="conversion-loading">
            FFmpeg traite votre fichier. Veuillez patienter...
          </p>
        )}

      </div>

      {/* MESSAGES */}

      {error && (
        <div className="converter-message error-message">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="converter-message success-message">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

    </section>
  );
}

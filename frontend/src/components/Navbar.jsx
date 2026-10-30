import { Cloud, Code2, Settings2 } from "lucide-react";

export default function Navbar() {
  return (
    <header className="topbar">
      <a href="#home" className="brand">
        <div className="brand-symbol">
          <Cloud size={19} strokeWidth={1.8} />
        </div>
        <span>Download You</span>
      </a>

      <div className="topbar-center">
        <span className="status-dot" />
        <span>Espace de téléchargement</span>
      </div>

      <div className="topbar-actions">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className="icon-button"
        >
          <Code2 size={17} />
        </a>

        <button
          type="button"
          className="icon-button"
          aria-label="Paramètres"
          title="Paramètres"
        >
          <Settings2 size={17} />
        </button>
      </div>
    </header>
  );
}
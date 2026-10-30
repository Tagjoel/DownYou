
import { Cloud, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <a href="#home" className="footer-brand">
        <div className="footer-logo">
          <Cloud size={16} strokeWidth={1.8} />
        </div>
        <span>Download You</span>
      </a>

      <div className="footer-center">
        <ShieldCheck size={13} />
        <span>Simple, rapide et sécurisé</span>
      </div>

      <div className="footer-copyright">
        © {new Date().getFullYear()} Download You. Tous droits réservés.
      </div>
    </footer>
  );
}

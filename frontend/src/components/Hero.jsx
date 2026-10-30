
import { motion } from "framer-motion";
import VideoForm from "./VideoForm";

export default function Hero() {
  return (
    <main className="hero" id="home">
      <div className="hero-background">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
      </div>

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1>
          Vos vidéos.
          <br />
          <span>En toute simplicité.</span>
        </h1>

        <VideoForm />
      </motion.div>
    </main>
  );
}

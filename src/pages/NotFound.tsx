import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-game-bg">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-perception font-orbitron">404</h1>
        <p className="text-xl text-game-text-dim mb-4">Oops! Page not found</p>
        <Link to="/" className="text-perception hover:text-perception-glow underline font-mono">
          Return to Game
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
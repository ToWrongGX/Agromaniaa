import '../styles/home.css';
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="heroBg">
      <div className="heroContent">
        <h1>AgriFarm Hub</h1>
        <p>Connecting farmers, buyers, and markets with smarter tools and insights.</p>
        <div className="heroActions">
          <Link to="/marketplace" className="btn primary">Explore Marketplace</Link>
          <Link to="/add-crop" className="btn alt">Add Your Crop</Link>
        </div>
      </div>
    </div>
  );
}
import mascotAsset from "@/assets/explyn-mascot.png.asset.json";

interface ExplynMascotProps {
  className?: string;
  active?: boolean;
}

const ExplynMascot = ({ className = "", active = false }: ExplynMascotProps) => (
  <div className={`mascot-stage ${active ? "mascot-stage-active" : ""} ${className}`} aria-hidden="true">
    <span className="mascot-scanline" />
    <img src={mascotAsset.url} alt="" className="mascot-image" draggable={false} />
    <span className="mascot-pixel mascot-pixel-one">+</span>
    <span className="mascot-pixel mascot-pixel-two">·</span>
    <span className="mascot-pixel mascot-pixel-three">01</span>
  </div>
);

export default ExplynMascot;
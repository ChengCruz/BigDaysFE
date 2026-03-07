// src/components/pages/Backgrounds/gallery/BackgroundGallery.tsx
import type { AiBackground } from "../../../../types/aiBackground";
import { BackgroundCard } from "./BackgroundCard";

interface BackgroundGalleryProps {
  backgrounds: AiBackground[];
  onSelect: (bg: AiBackground) => void;
}

export function BackgroundGallery({
  backgrounds,
  onSelect,
}: BackgroundGalleryProps) {
  if (backgrounds.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {backgrounds.map((bg) => (
        <BackgroundCard
          key={bg.id}
          background={bg}
          onClick={() => onSelect(bg)}
        />
      ))}
    </div>
  );
}

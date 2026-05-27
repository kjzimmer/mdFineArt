import { useState } from 'react';
import { PaintingCard } from './PaintingCard';
import Lightbox from './Lightbox';
import type { Painting } from '../../types';

export function GalleryGrid({ paintings }: { paintings: Painting[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openAt = (index: number) => setSelectedIndex(index);
  const close = () => setSelectedIndex(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paintings.map((painting, i) => (
          <PaintingCard key={painting.id} painting={painting} onView={() => openAt(i)} />
        ))}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          paintings={paintings}
          index={selectedIndex}
          onClose={close}
          onNavigate={(nextIndex) => setSelectedIndex(nextIndex)}
        />
      )}
    </>
  );
}

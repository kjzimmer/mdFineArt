import { useState } from 'react';
import { WorkCard } from './PaintingCard';
import Lightbox from './Lightbox';
import { InquireModal } from './InquireModal';
import type { Work } from '../../types';

export function GalleryGrid({ works }: { works: Work[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inquiryWork, setInquiryWork] = useState<Work | null>(null);

  const openAt = (index: number) => setSelectedIndex(index);
  const close = () => setSelectedIndex(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {works.map((work, i) => (
          <WorkCard
            key={work.id}
            work={work}
            onView={() => openAt(i)}
          />
        ))}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          works={works}
          index={selectedIndex}
          onClose={close}
          onNavigate={(nextIndex) => setSelectedIndex(nextIndex)}
          onInquire={(w) => setInquiryWork(w)}
        />
      )}

      {inquiryWork && (
        <InquireModal
          work={inquiryWork}
          onClose={() => setInquiryWork(null)}
        />
      )}
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { WorkCard } from './PaintingCard';
import Lightbox from './Lightbox';
import { InquireModal } from './InquireModal';
import type { Work } from '../../types';

export function GalleryGrid({
  works,
  initialSlug,
  onOpenWork,
}: {
  works: Work[];
  initialSlug?: string;
  onOpenWork?: (work: Work | null) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inquiryWork, setInquiryWork] = useState<Work | null>(null);
  const appliedInitialSlug = useRef(false);

  const openAt = (index: number) => {
    setSelectedIndex(index);
    onOpenWork?.(works[index] ?? null);
  };
  const close = () => {
    setSelectedIndex(null);
    onOpenWork?.(null);
  };

  useEffect(() => {
    if (appliedInitialSlug.current || !initialSlug || works.length === 0) return;
    const index = works.findIndex((w) => w.slug === initialSlug);
    if (index !== -1) {
      appliedInitialSlug.current = true;
      openAt(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug, works]);

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
          onNavigate={(nextIndex) => openAt(nextIndex)}
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

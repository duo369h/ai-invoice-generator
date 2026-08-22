'use client';

import { useEffect } from 'react';

const REVEAL_TARGETS = [
  { section: '#for-photographers', item: '#fp-section-reveal', threshold: 0.2 },
  { section: '#resources', item: '#resources-surface-reveal', threshold: 0.15 },
  { section: '#founder-trust', item: '#founder-trust-reveal', threshold: 0.15 },
  { section: '#final-cta', item: '#final-cta-reveal', threshold: 0.15 },
];

export default function HomeBodyReveal() {
  useEffect(() => {
    const observers = REVEAL_TARGETS.flatMap(({ section, item, threshold }) => {
      const sectionElement = document.querySelector(section);
      const itemElement = document.querySelector(item);

      if (!sectionElement || !itemElement) return [];

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          itemElement.classList.add('revealed');
          observer.disconnect();
        }
      }, { threshold });

      observer.observe(sectionElement);
      return [observer];
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}

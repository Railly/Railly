import { useEffect, useRef, useState } from 'react';

interface ViewCounterProps {
  slug: string;
}

export default function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);
  const didLogViewRef = useRef(false);

  useEffect(() => {
    if (!didLogViewRef.current) {
      // Increment view count
      const incrementUrl = `https://raillyhugo.com/api/views?type=blog&incr=1&id=${encodeURIComponent(slug)}`;
      fetch(incrementUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.views != null) {
            setViews(data.views);
          }
        })
        .catch((error) => {
          console.error('Error tracking view:', error);
        });

      didLogViewRef.current = true;
    }
  }, [slug]);

  if (views === null) {
    return <span className="text-sm text-flexoki-tx-2">— views</span>;
  }

  return (
    <span className="text-sm text-flexoki-tx-2">
      {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
    </span>
  );
}

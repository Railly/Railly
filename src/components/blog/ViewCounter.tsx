import { useEffect, useRef, useState } from "react";

interface ViewCounterProps {
  slug: string;
  increment?: boolean;
  className?: string;
}

export default function ViewCounter({
  slug,
  increment = false,
  className = "text-sm text-flexoki-tx-2",
}: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);
  const didLogViewRef = useRef(false);

  useEffect(() => {
    if (!didLogViewRef.current) {
      // Increment view count only if increment prop is true
      const url = increment
        ? `https://raillyhugo.com/api/views?type=blog&incr=1&id=${encodeURIComponent(slug)}`
        : `https://raillyhugo.com/api/views?type=blog&id=${encodeURIComponent(slug)}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.views != null) {
            setViews(data.views);
          }
        })
        .catch((error) => {
          console.error("Error fetching views:", error);
        });

      didLogViewRef.current = true;
    }
  }, [slug, increment]);

  if (views === null) {
    return null;
  }

  return (
    <span className={className}>
      {views.toLocaleString()} {views === 1 ? "view" : "views"}
    </span>
  );
}

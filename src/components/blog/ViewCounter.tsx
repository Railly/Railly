import { useEffect, useRef, useState } from "react";

interface ViewCounterProps {
  slug: string;
  increment?: boolean;
  className?: string;
}

const incrementedSlugs = new Set<string>();

export default function ViewCounter({
  slug,
  increment = false,
  className = "text-sm text-flexoki-tx-2",
}: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!slug || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;

    const shouldIncrement = increment && !incrementedSlugs.has(slug);
    if (shouldIncrement) {
      incrementedSlugs.add(slug);
    }

    const params = new URLSearchParams({ id: slug });
    if (shouldIncrement) {
      params.append("incr", "1");
    }
    const url = `/api/views?${params.toString()}`;

    let isMounted = true;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.views != null) {
            setViews(data.views);
          } else {
            setViews(0);
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Error fetching views:", error);
          setViews(0);
        }
      });

    return () => {
      isMounted = false;
    };
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

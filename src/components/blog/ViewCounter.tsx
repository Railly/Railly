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
    // Make sure we have a slug before making the request
    if (!slug || didLogViewRef.current) {
      return;
    }

    // Build URL with increment parameter if needed
    const params = new URLSearchParams({ id: slug });
    if (increment) {
      params.append("incr", "1");
    }
    const url = `/api/views?${params.toString()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.views != null) {
          setViews(data.views);
        } else {
          setViews(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching views:", error);
        setViews(0);
      });

    didLogViewRef.current = true;
  }, [slug, increment]);

  // Don't render anything until we have data
  if (views === null) {
    return null;
  }

  return (
    <span className={className}>
      {views.toLocaleString()} {views === 1 ? "view" : "views"}
    </span>
  );
}

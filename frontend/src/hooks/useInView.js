import { useEffect, useRef, useState } from "react";

export function useInView({ threshold = 0.14, rootMargin = "0px 0px -8%" } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(() => typeof window === "undefined" || !("IntersectionObserver" in window));

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isVisible };
}

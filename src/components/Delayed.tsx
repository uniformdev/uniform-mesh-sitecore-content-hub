import { useEffect, useState } from 'react';

export function Delayed({ delayMs, children }: { delayMs: number; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return <>{show ? children : null}</>;
}

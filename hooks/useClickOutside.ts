import { useEffect, RefObject } from 'react';

// React 19 types useRef<T>(null) as RefObject<T | null> — accept null in the generic
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void
): void {
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handler();
            }
        };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, [ref, handler]);
}

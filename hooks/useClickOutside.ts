import { useEffect, RefObject } from 'react';

// React 19 types useRef<T>(null) as RefObject<T | null> — accept null in the generic
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void
): void {
    useEffect(() => {
        const onMouse = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) handler();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handler();
        };
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouse);
            document.removeEventListener('keydown', onKey);
        };
    }, [ref, handler]);
}

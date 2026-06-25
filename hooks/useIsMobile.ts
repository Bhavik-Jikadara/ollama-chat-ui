import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const handler = () => {
            clearTimeout(timer);
            timer = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100);
        };
        window.addEventListener('resize', handler);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handler);
        };
    }, [breakpoint]);
    return isMobile;
}

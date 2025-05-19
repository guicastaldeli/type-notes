import { useState, useEffect } from "react";

export default function useScreenSize() {
    const [screenSize, setScreenSize] = useState({
        w: typeof window !== 'undefined' ? window.innerWidth : 0,
        h: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    useEffect(() => {
        if(typeof window === 'undefined') return;

        const handleResize = () => {
            setScreenSize({
                w: window.innerWidth,
                h: window.innerHeight
            });
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return screenSize;
}
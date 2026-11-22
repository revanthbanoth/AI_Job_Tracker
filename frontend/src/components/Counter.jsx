import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

const Counter = ({ from = 0, to = 0, duration = 1.2, className = '' }) => {
    const shouldReduceMotion = useReducedMotion();
    const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? to : from);

    useEffect(() => {
        if (shouldReduceMotion) {
            setDisplayValue(to);
            return;
        }

        const controls = animate(from, to, {
            duration,
            ease: [0.16, 1, 0.3, 1], // Smooth exponential ease-out
            onUpdate: (value) => {
                setDisplayValue(Math.round(value));
            }
        });

        return () => controls.stop();
    }, [from, to, duration, shouldReduceMotion]);

    return <span className={className}>{displayValue}</span>;
};

export default Counter;

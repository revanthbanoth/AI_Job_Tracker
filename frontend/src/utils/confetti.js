import confetti from 'canvas-confetti';

export const triggerOfferConfetti = () => {
    // Check if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const warmPalette = ['#D4663A', '#5B8C6A', '#E08E45', '#C2572D', '#82A78F'];

    // Left cannon
    confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: warmPalette,
        disableForReducedMotion: true
    });

    // Right cannon
    confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: warmPalette,
        disableForReducedMotion: true
    });

    // Center burst with slight delay
    setTimeout(() => {
        confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.6 },
            colors: warmPalette,
            disableForReducedMotion: true
        });
    }, 200);
};

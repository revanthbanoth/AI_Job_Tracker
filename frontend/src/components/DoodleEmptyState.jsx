import React from 'react';

export const DoodleEmptyState = ({
    type = 'application',
    title = 'Nothing here yet',
    description = 'Everyone starts at zero. Take the first step today.',
    actionLabel,
    onAction,
    actionIcon
}) => {
    return (
        <div className="text-center py-16 px-6 flex flex-col items-center justify-center max-w-md mx-auto">
            {/* Doodle Illustration */}
            <div className="w-28 h-28 mb-6 relative flex items-center justify-center">
                {type === 'application' && (
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* Soft Warm Background Circle */}
                        <circle cx="60" cy="60" r="48" className="fill-terracotta-50 dark:fill-card-subtle" />
                        {/* Folded paper */}
                        <rect x="36" y="28" width="48" height="64" rx="4" className="stroke-text dark:stroke-muted fill-card" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Paper fold corner */}
                        <path d="M68 28V40H84" className="stroke-text dark:stroke-muted" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Lines of text */}
                        <path d="M46 48H62" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M46 58H74" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        <path d="M46 66H70" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        <path d="M46 74H58" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        {/* Sprout / Little green growth */}
                        <path d="M84 76C84 70 88 66 94 66C94 72 90 76 84 76Z" className="fill-secondary stroke-secondary" strokeWidth="1.5" />
                        <path d="M84 76C84 72 80 70 76 70C76 74 78 76 84 76Z" className="fill-secondary stroke-secondary" strokeWidth="1.5" />
                        <path d="M84 76V86" className="stroke-secondary" strokeWidth="2" strokeLinecap="round" />
                        {/* Sparkle */}
                        <path d="M30 36L32 40L36 42L32 44L30 48L28 44L24 42L28 40L30 36Z" className="fill-warning" />
                    </svg>
                )}

                {type === 'resume' && (
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="60" cy="60" r="48" className="fill-sage-50 dark:fill-card-subtle" />
                        {/* Resume sheet */}
                        <rect x="38" y="24" width="44" height="68" rx="6" className="stroke-text dark:stroke-muted fill-card" strokeWidth="2.5" />
                        {/* Candidate avatar silhouette */}
                        <circle cx="50" cy="38" r="5" className="stroke-secondary fill-secondary/20" strokeWidth="2" />
                        <path d="M44 48C44 45 47 44 50 44C53 44 56 45 56 48" className="stroke-secondary" strokeWidth="2" strokeLinecap="round" />
                        {/* Text bullets */}
                        <path d="M60 36H74" className="stroke-text dark:stroke-muted" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M60 42H70" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        <path d="M44 56H76" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        <path d="M44 64H76" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        <path d="M44 72H68" className="stroke-border dark:stroke-border" strokeWidth="2" strokeLinecap="round" />
                        {/* Stamp/Badge */}
                        <circle cx="76" cy="78" r="10" className="fill-primary/10 stroke-primary" strokeWidth="2" />
                        <path d="M72 78L75 81L80 75" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}

                {type === 'search' && (
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="60" cy="60" r="48" className="fill-terracotta-50 dark:fill-card-subtle" />
                        {/* Magnifying lens */}
                        <circle cx="54" cy="52" r="18" className="stroke-text dark:stroke-muted fill-card" strokeWidth="2.5" />
                        <path d="M67 65L82 80" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
                        {/* Doodle question / spark */}
                        <path d="M51 46C51 44 53 42 55 42C57 42 59 44 58 47C56.5 49 55 50 55 53" className="stroke-text dark:stroke-muted" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="55" cy="57" r="1" className="fill-text dark:fill-muted" />
                    </svg>
                )}
            </div>

            {/* Typography */}
            <h3 className="font-serif text-2xl font-bold text-text mb-2 tracking-tight">
                {title}
            </h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
                {description}
            </p>

            {/* Optional Call to Action */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary-hover shadow-warm transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    {actionIcon}
                    <span>{actionLabel}</span>
                </button>
            )}
        </div>
    );
};

export default DoodleEmptyState;

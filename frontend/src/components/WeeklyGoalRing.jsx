import { motion, useReducedMotion } from 'framer-motion';
import { Target, CheckCircle2 } from 'lucide-react';

const WeeklyGoalRing = ({ current = 0, target = 5 }) => {
    const shouldReduceMotion = useReducedMotion();
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(1, Math.max(0, current / (target || 1)));
    const strokeDashoffset = circumference - progress * circumference;
    const isCompleted = current >= target;

    return (
        <div className="bg-card border border-border rounded-card p-5 shadow-warm flex flex-col sm:flex-row items-center gap-5">
            {/* Animated SVG Ring */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-border"
                    />
                    {/* Animated Progress Arc */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={isCompleted ? '#5B8C6A' : '#D4663A'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: shouldReduceMotion ? strokeDashoffset : strokeDashoffset }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-serif font-bold text-xl text-text leading-none">
                        {current}
                        <span className="text-xs text-muted font-sans font-normal">/{target}</span>
                    </span>
                    <span className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-0.5">
                        {Math.round(progress * 100)}%
                    </span>
                </div>
            </div>

            {/* Microcopy & Info */}
            <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    <Target size={14} />
                    <span>Weekly Application Goal</span>
                </div>
                <h4 className="text-lg font-serif font-bold text-text">
                    {isCompleted ? 'Weekly Goal Achieved!' : `${Math.max(0, target - current)} more to hit your target`}
                </h4>
                <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                    {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-sage font-medium">
                            <CheckCircle2 size={14} />
                            Consistent pacing dramatically improves response rates. Excellent momentum!
                        </span>
                    ) : (
                        "Aim for 5 thoughtful applications each week to keep conversations moving forward."
                    )}
                </p>
            </div>
        </div>
    );
};

export default WeeklyGoalRing;

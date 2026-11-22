import { useState, useEffect } from 'react';
import { Sparkles, Heart, RefreshCw, Zap, Coffee, CloudRain, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
    {
        id: 'energized',
        label: 'Energized',
        emoji: '⚡',
        icon: Zap,
        color: 'border-amber/40 bg-amber/15 text-amber-700 dark:text-amber-300',
        quote: "Ride this momentum! Use this energy surge to practice an interview answer or submit that dream application."
    },
    {
        id: 'steady',
        label: 'Steady',
        emoji: '🌿',
        icon: Compass,
        color: 'border-sage/40 bg-sage/15 text-sage',
        quote: "Consistency is your superpower. One thoughtful application and follow-up beats ten rushed submissions."
    },
    {
        id: 'tired',
        label: 'Fatigued',
        emoji: '☕',
        icon: Coffee,
        color: 'border-stone-400/30 bg-stone-500/10 text-stone-700 dark:text-stone-300',
        quote: "Job search fatigue is completely real. Give yourself permission to log off early or take a 20-minute walk. Rest is productive."
    },
    {
        id: 'overwhelmed',
        label: 'Overwhelmed',
        emoji: '🌊',
        icon: CloudRain,
        color: 'border-terracotta/40 bg-terracotta/15 text-terracotta',
        quote: "Pause and breathe. You don't need to do everything today. Pick just ONE micro-task—polish 1 bullet—and celebrate that win."
    }
];

const MoodCheckInWidget = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [selectedMoodId, setSelectedMoodId] = useState(() => {
        try {
            const saved = localStorage.getItem('daily_mood_checkin');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.date === todayStr) {
                    return parsed.moodId;
                }
            }
        } catch (e) {
            // Ignore
        }
        return null;
    });

    const handleSelectMood = (id) => {
        setSelectedMoodId(id);
        try {
            localStorage.setItem('daily_mood_checkin', JSON.stringify({
                date: todayStr,
                moodId: id
            }));
        } catch (e) {
            // Ignore
        }
    };

    const handleReset = () => {
        setSelectedMoodId(null);
        try {
            localStorage.removeItem('daily_mood_checkin');
        } catch (e) {
            // Ignore
        }
    };

    const activeMood = MOODS.find(m => m.id === selectedMoodId);

    return (
        <div className="bg-card border border-border rounded-card p-5 shadow-warm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Heart size={16} />
                    </div>
                    <h3 className="font-serif text-base font-bold text-text">Search Mindset Check-in</h3>
                </div>
                {selectedMoodId && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[11px] text-muted hover:text-text flex items-center gap-1 transition-colors cursor-pointer"
                        title="Change response"
                    >
                        <RefreshCw size={11} />
                        <span>Update</span>
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {!activeMood ? (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3"
                    >
                        <p className="text-xs text-muted font-sans leading-relaxed">
                            How are you feeling about the job search today? Checking in helps keep search burnout at bay.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {MOODS.map(mood => (
                                <button
                                    key={mood.id}
                                    type="button"
                                    onClick={() => handleSelectMood(mood.id)}
                                    className="p-2.5 rounded-xl border border-border bg-card-subtle/50 hover:bg-card hover:border-primary/40 hover:shadow-warm-sm transition-all text-center group cursor-pointer"
                                >
                                    <span className="text-xl block mb-1 group-hover:scale-110 transition-transform">
                                        {mood.emoji}
                                    </span>
                                    <span className="font-serif text-xs font-semibold text-text block">
                                        {mood.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="selected"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-2.5"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{activeMood.emoji}</span>
                            <span className="text-xs font-semibold text-text font-serif">
                                Feeling {activeMood.label} today
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-card-subtle text-muted border border-border font-mono ml-auto">
                                Checked In
                            </span>
                        </div>
                        <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans ${activeMood.color}`}>
                            {activeMood.quote}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoodCheckInWidget;

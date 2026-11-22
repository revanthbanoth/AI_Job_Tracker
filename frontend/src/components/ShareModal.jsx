import { useState, useEffect } from 'react';
import { Share2, Copy, Check, ShieldCheck, X, RefreshCw, PowerOff, ExternalLink } from 'lucide-react';
import api from '../services/api';

const ShareModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [shareSettings, setShareSettings] = useState({ shareToken: null, shareTokenEnabled: false, shareUrl: null });
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const fetchSettings = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get('/api/share/settings');
                setShareSettings(data);
            } catch (err) {
                console.error('Failed to fetch share settings', err);
                setError('Could not load sharing settings.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [isOpen]);

    const handleGenerate = async () => {
        setActionLoading(true);
        setError('');
        try {
            const { data } = await api.post('/api/share/generate');
            setShareSettings(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate link.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async () => {
        setActionLoading(true);
        setError('');
        try {
            const { data } = await api.post('/api/share/revoke');
            setShareSettings(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to disable link.');
        } finally {
            setActionLoading(false);
        }
    };

    const fullShareUrl = shareSettings.shareToken && shareSettings.shareTokenEnabled
        ? `${window.location.origin}/share/${shareSettings.shareToken}`
        : '';

    const handleCopy = () => {
        if (!fullShareUrl) return;
        navigator.clipboard.writeText(fullShareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-modal shadow-warm-xl w-full max-w-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card-subtle/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sage/15 text-sage">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg font-bold text-text">Shareable Progress Link</h3>
                            <p className="text-xs text-muted font-sans">Let coaches or peers celebrate and support your journey.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-card transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Security Notice */}
                    <div className="p-3.5 rounded-xl bg-sage/10 border border-sage/25 flex items-start gap-3">
                        <ShieldCheck size={20} className="text-sage shrink-0 mt-0.5" />
                        <div className="text-xs text-text leading-relaxed">
                            <span className="font-semibold text-sage block mb-0.5">Privacy First</span>
                            Mentors can only see your total application count, stage funnel, and company names. Your private notes, salary figures, and recruiter contacts remain completely hidden.
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-8 text-center text-xs text-muted">
                            Loading sharing status...
                        </div>
                    ) : shareSettings.shareTokenEnabled && fullShareUrl ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                                    Your Live Share Link
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={fullShareUrl}
                                        className="w-full px-3 py-2.5 bg-card-subtle border border-border rounded-xl text-xs font-mono text-text focus:outline-none select-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-warm-sm ${
                                            copied
                                                ? 'bg-sage text-white'
                                                : 'bg-primary hover:bg-primary-hover text-white'
                                        }`}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs">
                                <a
                                    href={fullShareUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                    <span>Preview public page</span>
                                    <ExternalLink size={12} />
                                </a>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={actionLoading}
                                        className="p-1.5 text-muted hover:text-text hover:bg-card-subtle rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Generate a new token (revokes current link)"
                                    >
                                        <RefreshCw size={12} className={actionLoading ? 'animate-spin' : ''} />
                                        <span>Reset Link</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleRevoke}
                                        disabled={actionLoading}
                                        className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Disable link"
                                    >
                                        <PowerOff size={12} />
                                        <span>Disable</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-3">
                            <p className="text-xs text-muted font-sans max-w-sm mx-auto">
                                You currently don&rsquo;t have an active share link. Generate one to share your pipeline with a mentor or peer.
                            </p>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={actionLoading}
                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-warm"
                            >
                                <Share2 size={14} />
                                <span>{actionLoading ? 'Creating...' : 'Create Shareable Link'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-border bg-card-subtle/30 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-card hover:bg-card-subtle text-text border border-border rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;

import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import HeadingUnderline from '../components/HeadingUnderline';
import DoodleEmptyState from '../components/DoodleEmptyState';
import Counter from '../components/Counter';
import AtsScoreModal from '../components/AtsScoreModal';
import { motion, useReducedMotion } from 'framer-motion';
import {
    UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle,
    ArrowUpRight, Sparkles, ShieldCheck, Target, AlertTriangle, Info
} from 'lucide-react';

const Resumes = () => {
    const shouldReduceMotion = useReducedMotion();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResumeForInspect, setSelectedResumeForInspect] = useState(null);
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchResumes = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/resumes`).catch(() => ({ data: [] }));
                const validData = Array.isArray(data) ? data : [];

                const formattedResumes = validData.map(r => ({
                    id: r._id,
                    _id: r._id,
                    name: r.name || 'Untitled Resume',
                    fileName: r.fileName || r.name,
                    size: r.size || 'Unknown size',
                    atsScore: r.atsScore || 0,
                    healthScore: r.healthScore ?? r.atsScore ?? 0,
                    matchScore: r.matchScore ?? null,
                    healthBreakdown: r.healthBreakdown || {},
                    matchBreakdown: r.matchBreakdown || {},
                    deductions: r.deductions || [],
                    recognizedSkills: r.recognizedSkills || [],
                    matchedKeywords: r.matchedKeywords || [],
                    missingKeywords: r.missingKeywords || [],
                    bulletFixes: r.bulletFixes || [],
                    formatAnomalies: r.formatAnomalies || [],
                    scoreHistory: r.scoreHistory || [],
                    targetRole: r.targetRole || '',
                    targetJobDescription: r.targetJobDescription || '',
                    uploadDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : 'Recent',
                    status: r.status,
                    resumeUrl: r.resumeUrl
                }));
                setResumes(formattedResumes);
            } catch (error) {
                console.error('Failed to fetch resumes', error);
                setResumes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: shouldReduceMotion ? 0 : 0.08,
                delayChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 14 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 24
            }
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('name', selectedFile.name);

        try {
            const { data } = await api.post(`/api/resumes`, formData);

            const newResume = {
                id: data._id,
                _id: data._id,
                name: data.name,
                fileName: data.fileName || data.name,
                size: data.size,
                atsScore: data.atsScore,
                healthScore: data.healthScore ?? data.atsScore,
                matchScore: data.matchScore ?? null,
                healthBreakdown: data.healthBreakdown || {},
                matchBreakdown: data.matchBreakdown || {},
                deductions: data.deductions || [],
                recognizedSkills: data.recognizedSkills || [],
                matchedKeywords: data.matchedKeywords || [],
                missingKeywords: data.missingKeywords || [],
                bulletFixes: data.bulletFixes || [],
                formatAnomalies: data.formatAnomalies || [],
                scoreHistory: data.scoreHistory || [],
                targetRole: data.targetRole || '',
                targetJobDescription: data.targetJobDescription || '',
                uploadDate: new Date(data.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                status: data.status,
                resumeUrl: data.resumeUrl
            };

            setResumes([newResume, ...resumes]);
            setIsUploadOpen(false);
            setSelectedFile(null);
            // Open the deterministic inspector automatically for the new resume
            setSelectedResumeForInspect(newResume);
        } catch (error) {
            console.error('Failed to upload resume', error);
            const serverMsg = error.response?.data?.message;
            alert(serverMsg || error.message || 'Failed to upload resume. Please ensure your file is a valid PDF or Word document (max 10MB).');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) return;
        try {
            await api.delete(`/api/resumes/${id}`);
            setResumes(resumes.filter(r => r.id !== id && r._id !== id));
            if (selectedResumeForInspect && (selectedResumeForInspect.id === id || selectedResumeForInspect._id === id)) {
                setSelectedResumeForInspect(null);
            }
        } catch (error) {
            console.error('Failed to delete resume', error);
        }
    };

    const handleOpenFile = async (e, resume) => {
        if (e) e.preventDefault();
        // 1. If already a valid signed Cloudinary URL or public raw upload URL, open directly
        if (resume.resumeUrl && (resume.resumeUrl.includes('api.cloudinary.com') || resume.resumeUrl.includes('/raw/upload/'))) {
            window.open(resume.resumeUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // 2. Fetch fresh signed URL from backend
        try {
            const resumeId = resume.id || resume._id;
            const { data } = await api.get(`/api/resumes/${resumeId}/file?json=true`);
            if (data && data.url) {
                window.open(data.url, '_blank', 'noopener,noreferrer');
                return;
            }
        } catch (err) {
            console.warn('Could not fetch signed url, trying direct redirect:', err);
        }

        // 3. Fallback: open via backend file route with auth token
        const token = sessionStorage.getItem('token') || (sessionStorage.getItem('userInfo') ? JSON.parse(sessionStorage.getItem('userInfo')).token : null) || localStorage.getItem('token');
        const baseUrl = api.defaults.baseURL || '';
        const fileUrl = `${baseUrl}/api/resumes/${resume.id || resume._id}/file?token=${encodeURIComponent(token || '')}`;
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="h-10 w-64 bg-card-subtle animate-pulse rounded-lg" />
                <div className="h-4 w-96 bg-card-subtle animate-pulse rounded-lg" />
                <div className="space-y-4 pt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-card border border-border rounded-card animate-pulse shadow-warm" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-6"
        >
            {/* Page Header */}
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-text tracking-tight relative inline-block">
                        Resumes & ATS Engine
                        <HeadingUnderline />
                    </h2>
                    <p className="text-muted mt-2 text-sm sm:text-base font-sans">
                        Transparent, 100% deterministic ATS scoring. Every point deduction explained with actionable fixes.
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-medium shadow-warm hover:shadow-warm-lg transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                    <UploadCloud size={18} />
                    <span>Upload Resume</span>
                </button>
            </motion.div>

            {/* Resumes Container */}
            {resumes.length === 0 ? (
                <motion.div variants={item} className="bg-card border border-border rounded-card p-6 shadow-warm">
                    <DoodleEmptyState
                        type="resume"
                        title="No resumes uploaded yet"
                        description="Upload your primary resume (PDF or DOCX) to get transparent ATS insights, bullet quality analysis, and deterministic job matching scores."
                        actionLabel="Upload First Resume"
                        onAction={() => setIsUploadOpen(true)}
                    />
                </motion.div>
            ) : (
                <motion.div variants={container} className="grid grid-cols-1 gap-4">
                    {resumes.map((resume) => {
                        const healthScore = resume.healthScore ?? resume.atsScore ?? 0;
                        const matchScore = resume.matchScore;
                        const overallScore = resume.atsScore;
                        const score = healthScore;
                        const hasWarnings = (resume.formatAnomalies || []).length > 0;

                        const scoreTone =
                            score === 0 ? { label: 'Pending Review', color: 'bg-card-subtle text-muted border-border' } :
                            score >= 85 ? { label: 'Exceptional ATS Health', color: 'bg-sage/15 text-sage border-sage/30' } :
                            score >= 70 ? { label: 'Strong Fit', color: 'bg-amber/15 text-amber border-amber/30' } :
                            { label: 'Needs Polish', color: 'bg-primary/15 text-primary border-primary/30' };

                        return (
                            <motion.div
                                key={resume.id || resume._id}
                                variants={item}
                                whileHover={{ y: -2 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                className="bg-card border border-border rounded-card p-5 shadow-warm hover:shadow-warm-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-terracotta/10 text-primary rounded-xl shrink-0 mt-0.5">
                                        <FileText size={24} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-text font-serif font-semibold text-lg hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedResumeForInspect(resume)}>
                                                {resume.name}
                                            </h4>
                                            {resume.fileHash && (
                                                <span className="font-mono text-[10px] bg-card-subtle border border-border px-1.5 py-0.5 rounded text-muted" title={`SHA-256 Hash: ${resume.fileHash}`}>
                                                    sha256:{resume.fileHash.slice(0, 8)}…
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted">
                                            <span className="font-mono">{resume.size}</span>
                                            <span>•</span>
                                            <span>Uploaded {resume.uploadDate}</span>
                                            <span>•</span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${scoreTone.color}`}>
                                                <CheckCircle2 size={12} />
                                                {scoreTone.label}
                                            </span>

                                            {hasWarnings && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-amber/15 text-amber-700 dark:text-amber-400 border-amber/30">
                                                    <AlertTriangle size={11} />
                                                    ATS Warning
                                                </span>
                                            )}
                                        </div>

                                        {/* Recognized Skills Tag Preview */}
                                        {Array.isArray(resume.recognizedSkills) && resume.recognizedSkills.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                <span className="text-[11px] text-muted font-medium">Recognized:</span>
                                                {resume.recognizedSkills.slice(0, 5).map((skill, sIdx) => (
                                                    <span key={sIdx} className="px-2 py-0.5 rounded-md bg-card-subtle border border-border text-[11px] text-text font-mono">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {resume.recognizedSkills.length > 5 && (
                                                    <span className="text-[11px] text-muted font-medium">
                                                        +{resume.recognizedSkills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                                    <div className="text-left md:text-right cursor-pointer" onClick={() => setSelectedResumeForInspect(resume)}>
                                        <div className="text-xs text-muted mb-0.5 font-medium flex items-center md:justify-end gap-1">
                                            <span>Deterministic ATS Score</span>
                                            <Info size={11} />
                                        </div>
                                        <div className="flex items-baseline md:justify-end gap-1">
                                            <span className={`text-2xl font-serif font-bold ${
                                                score === 0 ? 'text-muted' :
                                                score >= 85 ? 'text-sage' :
                                                score >= 70 ? 'text-amber' :
                                                'text-primary'
                                            }`}>
                                                {score > 0 ? <Counter to={score} /> : '—'}
                                            </span>
                                            {score > 0 && <span className="text-xs text-muted">/100</span>}
                                        </div>
                                        {matchScore !== null && (
                                            <div className="text-[10px] text-sage font-medium">
                                                Match: {matchScore}% • Combined: {overallScore}/100
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden md:block h-8 w-px bg-border" />

                                    <div className="flex items-center gap-2">
                                        {/* Inspect ATS Breakdown Button */}
                                        <button
                                            onClick={() => setSelectedResumeForInspect(resume)}
                                            className="px-3.5 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-warm-sm"
                                            title="View transparent point breakdown, deductions, and keyword match"
                                        >
                                            <Sparkles size={14} />
                                            <span>Inspect ATS</span>
                                        </button>

                                        {resume.resumeUrl ? (
                                            <a
                                                href={resume.resumeUrl}
                                                onClick={(e) => handleOpenFile(e, resume)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-card-subtle hover:bg-card text-text border border-border rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                title="View or download resume file"
                                            >
                                                <span>File</span>
                                                <ArrowUpRight size={13} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted italic px-2">Unavailable</span>
                                        )}

                                        <button
                                            onClick={() => handleDelete(resume.id || resume._id)}
                                            aria-label="Delete resume"
                                            title="Delete resume"
                                            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Upload Modal */}
            <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setSelectedFile(null); }} title="Upload Resume Version">
                <form onSubmit={handleUpload} className="space-y-5">
                    <div
                        onClick={triggerFileSelect}
                        className={`border-2 border-dashed rounded-card p-8 transition-all cursor-pointer text-center ${
                            selectedFile
                                ? 'bg-terracotta/5 border-primary/50'
                                : 'border-border hover:border-primary/40 hover:bg-card-subtle'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors ${
                            selectedFile ? 'bg-primary/10 text-primary' : 'bg-card-subtle text-muted'
                        }`}>
                            <UploadCloud size={26} />
                        </div>
                        <p className="text-base font-medium text-text mb-1">
                            {selectedFile ? selectedFile.name : 'Click to select or drag your resume here'}
                        </p>
                        <p className="text-xs text-muted font-sans">
                            {selectedFile
                                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB ready for parsing`
                                : 'Supports PDF and DOCX files up to 10MB'}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.docx,.doc,.txt"
                        />
                    </div>

                    <div className="bg-card-subtle p-3.5 rounded-xl border border-border text-xs text-muted flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                        <span>
                            <strong>Deterministic ATS Engine:</strong> Text is extracted and parsed into standard sections, skills taxonomy, and bullet points. File hash caching ensures the exact same resume always gives the exact same score.
                        </span>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }}
                            className="px-4 py-2.5 text-muted hover:text-text rounded-xl transition-colors text-sm font-medium cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || uploading}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                        >
                            {uploading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />}
                            <span>{uploading ? 'Parsing & Scoring...' : (selectedFile ? 'Upload & Parse Deterministically' : 'Select File')}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ATS Score Inspector Modal */}
            <AtsScoreModal
                isOpen={Boolean(selectedResumeForInspect)}
                onClose={() => setSelectedResumeForInspect(null)}
                resume={selectedResumeForInspect}
                onScoreUpdated={(updated) => {
                    setResumes(prev => prev.map(r => (r.id === updated._id || r._id === updated._id) ? { ...r, ...updated, id: updated._id } : r));
                    setSelectedResumeForInspect(prev => ({ ...prev, ...updated, id: updated._id }));
                }}
            />
        </motion.div>
    );
};

export default Resumes;

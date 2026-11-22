import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import HeadingUnderline from '../components/HeadingUnderline';
import DoodleEmptyState from '../components/DoodleEmptyState';
import Counter from '../components/Counter';
import { motion, useReducedMotion } from 'framer-motion';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

const Resumes = () => {
    const shouldReduceMotion = useReducedMotion();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchResumes = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/resumes`).catch(e => ({ data: [] }));
                const validData = Array.isArray(data) ? data : [];

                const formattedResumes = validData.map(r => ({
                    id: r._id,
                    name: r.name || 'Untitled Resume',
                    size: r.size || 'Unknown size',
                    atsScore: r.atsScore || 0,
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
                name: data.name,
                size: data.size,
                uploadDate: new Date(data.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                atsScore: data.atsScore,
                status: data.status,
                resumeUrl: data.resumeUrl
            };

            setResumes([newResume, ...resumes]);
            setIsUploadOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('Failed to upload resume', error);
            alert(error.response?.data?.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) return;
        try {
            await api.delete(`/api/resumes/${id}`);
            setResumes(resumes.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete resume', error);
        }
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
                        <div key={i} className="h-24 bg-card border border-border rounded-card animate-pulse shadow-warm" />
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
                        Resumes & ATS Health
                        <HeadingUnderline />
                    </h2>
                    <p className="text-muted mt-2 text-sm sm:text-base font-sans">
                        Upload and tailor your resume versions. Track ATS parsability and match fidelity.
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
                        description="Upload your primary resume to get transparent ATS insights, bullet quality analysis, and job matching scores."
                        actionLabel="Upload First Resume"
                        onAction={() => setIsUploadOpen(true)}
                    />
                </motion.div>
            ) : (
                <motion.div variants={container} className="grid grid-cols-1 gap-4">
                    {resumes.map((resume) => {
                        const score = resume.atsScore;
                        const scoreTone =
                            score === 0 ? { label: 'Pending Review', color: 'bg-card-subtle text-muted border-border' } :
                            score >= 90 ? { label: 'Exceptional Fit', color: 'bg-sage/15 text-sage border-sage/30' } :
                            score >= 80 ? { label: 'Strong Fit', color: 'bg-terracotta/15 text-terracotta border-terracotta/30' } :
                            score >= 70 ? { label: 'Good Potential', color: 'bg-amber/15 text-amber border-amber/30' } :
                            { label: 'Needs Polish', color: 'bg-stone-500/10 text-muted border-border' };

                        return (
                            <motion.div
                                key={resume.id}
                                variants={item}
                                whileHover={{ y: -2 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                className="bg-card border border-border rounded-card p-5 shadow-warm hover:shadow-warm-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-terracotta/10 text-primary rounded-xl shrink-0 mt-0.5">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-text font-serif font-semibold text-lg hover:text-primary transition-colors">
                                            {resume.name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted mt-1.5">
                                            <span className="font-mono">{resume.size}</span>
                                            <span>•</span>
                                            <span>Uploaded {resume.uploadDate}</span>
                                            <span>•</span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${scoreTone.color}`}>
                                                <CheckCircle2 size={12} />
                                                {scoreTone.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                                    <div className="text-left md:text-right">
                                        <div className="text-xs text-muted mb-0.5 font-medium">ATS Health Score</div>
                                        <div className="flex items-baseline md:justify-end gap-1">
                                            <span className={`text-2xl font-serif font-bold ${
                                                score === 0 ? 'text-muted' :
                                                score >= 85 ? 'text-sage' :
                                                score >= 70 ? 'text-amber' :
                                                'text-muted'
                                            }`}>
                                                {score > 0 ? <Counter to={score} /> : '—'}
                                            </span>
                                            {score > 0 && <span className="text-xs text-muted">/100</span>}
                                        </div>
                                    </div>

                                    <div className="hidden md:block h-8 w-px bg-border" />

                                    <div className="flex items-center gap-2">
                                        {resume.resumeUrl ? (
                                            <a
                                                href={resume.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3.5 py-2 bg-card-subtle hover:bg-terracotta/10 text-text hover:text-primary border border-border rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <span>View PDF</span>
                                                <ArrowUpRight size={14} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted italic px-2">File unavailable</span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(resume.id)}
                                            aria-label="Delete resume"
                                            title="Delete resume"
                                            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={18} />
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
                            {selectedFile ? selectedFile.name : 'Click to select or drag your PDF here'}
                        </p>
                        <p className="text-xs text-muted font-sans">
                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB PDF ready` : 'Supports PDF files up to 5MB'}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf"
                        />
                    </div>

                    <div className="bg-card-subtle p-3 rounded-xl border border-border text-xs text-muted flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber shrink-0 mt-0.5" />
                        <span>Every version is preserved so you can link specific resumes to specific job applications.</span>
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
                            <span>{uploading ? 'Analyzing & Uploading...' : (selectedFile ? 'Upload & Parse' : 'Select File')}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default Resumes;

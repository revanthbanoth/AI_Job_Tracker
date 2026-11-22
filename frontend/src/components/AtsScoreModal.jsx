import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import Counter from './Counter';
import {
    CheckCircle2, AlertCircle, Info, Sparkles, ChevronDown, ChevronUp,
    Check, X, FileText, Target, Clock, ArrowRight, ShieldCheck, AlertTriangle
} from 'lucide-react';

const AtsScoreModal = ({ isOpen, onClose, resume, onScoreUpdated }) => {
    if (!resume) return null;

    const [activeTab, setActiveTab] = useState('health'); // 'health' | 'match' | 'rewrites' | 'history'
    const [jobDescription, setJobDescription] = useState(resume.targetJobDescription || '');
    const [targetRole, setTargetRole] = useState(resume.targetRole || '');
    const [isScoring, setIsScoring] = useState(false);
    const [applications, setApplications] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({
        parsability: true,
        bulletQuality: true,
        sections: false,
        contact: false,
        skillsQuality: false,
        language: false,
        lengthDensity: false,
        requiredSkills: true,
        titleAlignment: true,
        keywordsInBullets: true
    });
    const [bulletFixes, setBulletFixes] = useState(resume.bulletFixes || []);

    // Load applications for quick JD pre-fill
    useEffect(() => {
        const fetchApps = async () => {
            try {
                const { data } = await api.get('/api/applications');
                if (Array.isArray(data)) {
                    setApplications(data);
                }
            } catch (err) {
                // Ignore failure to load apps
            }
        };
        if (isOpen) {
            fetchApps();
            setJobDescription(resume.targetJobDescription || '');
            setTargetRole(resume.targetRole || '');
            setBulletFixes(resume.bulletFixes || []);
        }
    }, [isOpen, resume]);

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    const handleCalculateJobMatch = async (e) => {
        e.preventDefault();
        if (!jobDescription || jobDescription.trim().length < 20) return;

        setIsScoring(true);
        try {
            const { data } = await api.post(`/api/resumes/${resume.id || resume._id}/score`, {
                jobDescription,
                targetRole
            });
            if (onScoreUpdated) {
                onScoreUpdated(data);
            }
            setBulletFixes(data.bulletFixes || []);
            setActiveTab('match');
        } catch (err) {
            console.error('Failed to calculate ATS match score', err);
            alert('Failed to calculate job match score');
        } finally {
            setIsScoring(false);
        }
    };

    const handleQuickSelectApp = (appId) => {
        const app = applications.find(a => (a.id || a._id) === appId);
        if (app) {
            setTargetRole(`${app.position} at ${app.company}`);
            const skillsText = Array.isArray(app.skills) && app.skills.length > 0
                ? `Required Skills: ${app.skills.join(', ')}.\n`
                : '';
            const locationText = app.location ? `Location: ${app.location}.\n` : '';
            const notesText = app.notes ? `Context: ${app.notes}` : '';
            setJobDescription(`Position: ${app.position}\nCompany: ${app.company}\n${locationText}${skillsText}${notesText}`);
        }
    };

    const handleBulletAction = async (index, status) => {
        try {
            const { data } = await api.put(`/api/resumes/${resume.id || resume._id}/bullets/${index}`, { status });
            setBulletFixes(data.bulletFixes || []);
            if (onScoreUpdated) {
                onScoreUpdated({ ...resume, bulletFixes: data.bulletFixes });
            }
        } catch (err) {
            console.error('Failed to update bullet suggestion', err);
        }
    };

    const healthScore = resume.healthScore ?? resume.atsScore ?? 75;
    const matchScore = resume.matchScore;
    const overallScore = resume.atsScore ?? healthScore;

    const healthBreakdown = resume.healthBreakdown || {};
    const matchBreakdown = resume.matchBreakdown || {};
    const deductions = resume.deductions || [];
    const matchedKeywords = resume.matchedKeywords || [];
    const missingKeywords = resume.missingKeywords || [];
    const formatAnomalies = resume.formatAnomalies || [];
    const scoreHistory = resume.scoreHistory || [];

    const getScoreColor = (sc) => {
        if (sc >= 85) return { stroke: '#5B8C6A', text: 'text-sage', bg: 'bg-sage/10', border: 'border-sage/30' };
        if (sc >= 70) return { stroke: '#E08E45', text: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/30' };
        return { stroke: '#D4663A', text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' };
    };

    const currentScore = activeTab === 'health' ? healthScore : (matchScore !== null ? matchScore : overallScore);
    const scoreColors = getScoreColor(currentScore);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span>Deterministic ATS Analysis</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-card-subtle text-muted border border-border font-sans font-normal">
                        {resume.name}
                    </span>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Score Header Card */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-warm-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Animated Circular Progress Gauge */}
                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-border"
                                    fill="transparent"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke={scoreColors.stroke}
                                    strokeWidth="8"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * currentScore) / 100}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-serif font-bold ${scoreColors.text}`}>
                                    <Counter to={currentScore} />
                                </span>
                                <span className="text-[10px] text-muted uppercase font-semibold">
                                    {activeTab === 'match' && matchScore !== null ? '% match' : '/ 100'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-serif font-bold text-lg text-text">
                                    {activeTab === 'health' && 'Resume Health Score'}
                                    {activeTab === 'match' && (matchScore !== null ? 'Target Job Match Score' : 'Overall ATS Health')}
                                    {activeTab === 'rewrites' && 'AI Action Bullet Suggestions'}
                                    {activeTab === 'history' && 'ATS Score History'}
                                </h4>
                                {matchScore !== null && (
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sage/15 text-sage border border-sage/30 font-medium">
                                        Job Evaluated • Combined {overallScore}/100
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted mt-1 max-w-md">
                                {activeTab === 'health' && 'Calculated by strict deterministic code across 7 ATS criteria. Zero hallucination, 100% reproducible.'}
                                {activeTab === 'match' && (matchScore !== null
                                    ? `Overall Combined: 30% Health (${healthScore}) + 70% Job Match (${matchScore}%) = ${overallScore}/100.`
                                    : 'Paste a target job description below to evaluate your match coverage against required keywords.')}
                                {activeTab === 'rewrites' && 'Actionable, metric-rich bullet alternatives to eliminate personal pronouns and weak phrasing.'}
                                {activeTab === 'history' && 'Immutable audit trail of your deterministic ATS scores over time.'}
                            </p>
                        </div>
                    </div>

                    {/* Disclaimer Tooltip */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card-subtle border border-border text-xs text-muted" title="ATS rules simulate leading enterprise screening filters (Greenhouse, Lever, Workday). Real production ATS parser behaviors vary.">
                        <Info size={13} className="text-primary shrink-0" />
                        <span className="font-sans text-[11px]">Estimate based on common ATS rules. Real systems vary.</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-border text-sm font-medium">
                    <button
                        onClick={() => setActiveTab('health')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'health'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <ShieldCheck size={16} />
                        <span>Resume Health ({healthScore})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('match')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'match'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <Target size={16} />
                        <span>Job Match {matchScore !== null ? `(${matchScore}%)` : ''}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('rewrites')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'rewrites'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <Sparkles size={16} />
                        <span>Fix It Suggestions {bulletFixes.length > 0 ? `(${bulletFixes.length})` : ''}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'history'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <Clock size={16} />
                        <span>Score History</span>
                    </button>
                </div>

                {/* TAB 1: RESUME HEALTH BREAKDOWN */}
                {activeTab === 'health' && (
                    <div className="space-y-4">
                        {/* Format Anomalies Warning Banner */}
                        {formatAnomalies.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-amber/15 border border-amber/30 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <AlertTriangle size={15} />
                                    <span>ATS Layout Warnings Detected</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-text/80 pl-1">
                                    {formatAnomalies.map((anom, i) => (
                                        <li key={i}>{anom.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Deductions Ledger */}
                        {deductions.filter(d => !d.category.includes('Match') && !d.category.includes('Title') && !d.category.includes('Seniority')).length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Itemized Deductions</h5>
                                <div className="space-y-2">
                                    {deductions
                                        .filter(d => !d.category.includes('Match') && !d.category.includes('Title') && !d.category.includes('Seniority'))
                                        .map((ded, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-card border border-primary/20 flex items-start justify-between gap-3 text-xs shadow-warm-sm">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                            -{ded.pointsDeducted} pts
                                                        </span>
                                                        <span className="font-semibold text-text">{ded.category}</span>
                                                    </div>
                                                    <p className="text-muted">{ded.reason}</p>
                                                    <div className="text-primary dark:text-primary font-medium flex items-center gap-1 mt-1">
                                                        <ArrowRight size={12} />
                                                        <span><strong>How to fix:</strong> {ded.fix}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Category Progress Bars */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Scoring Category Breakdown</h5>
                            {[
                                { key: 'parsability', title: 'Parsability & Format', score: healthBreakdown.parsability?.score ?? 25, max: 25, desc: 'Clean layout, text-extractable, zero scrambled columns' },
                                { key: 'bulletQuality', title: 'Bullet Quality', score: healthBreakdown.bulletQuality?.score ?? 25, max: 25, desc: 'Action verbs, quantified metrics, 1-2 lines, no first-person pronouns' },
                                { key: 'sections', title: 'Standard Sections', score: healthBreakdown.sections?.score ?? 15, max: 15, desc: 'Experience, Education, Skills, and Summary headers' },
                                { key: 'contact', title: 'Contact & Links', score: healthBreakdown.contact?.score ?? 10, max: 10, desc: 'Email, phone number, and LinkedIn / GitHub profile' },
                                { key: 'skillsQuality', title: 'Skills Section Quality', score: healthBreakdown.skillsQuality?.score ?? 10, max: 10, desc: 'Recognized industry taxonomy skills without keyword stuffing' },
                                { key: 'language', title: 'Language & Fluff', score: healthBreakdown.language?.score ?? 10, max: 10, desc: 'Objective phrasing, no buzzwords ("rockstar", "guru")' },
                                { key: 'lengthDensity', title: 'Length & Density', score: healthBreakdown.lengthDensity?.score ?? 5, max: 5, desc: 'Balanced word count (1-2 pages)' }
                            ].map((cat) => {
                                const pct = Math.round((cat.score / cat.max) * 100);
                                return (
                                    <div key={cat.key} className="p-3.5 rounded-xl bg-card border border-border shadow-warm-sm">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-semibold text-text">{cat.title}</span>
                                            <span className="font-mono text-muted">
                                                <strong className="text-text">{cat.score}</strong> / {cat.max} pts ({pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-border rounded-full h-2 overflow-hidden mb-1.5">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    pct >= 85 ? 'bg-sage' : pct >= 65 ? 'bg-amber' : 'bg-primary'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-muted">{cat.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: TARGET JOB MATCH */}
                {activeTab === 'match' && (
                    <div className="space-y-5">
                        {/* Job Matcher Input Form */}
                        <form onSubmit={handleCalculateJobMatch} className="p-4 rounded-xl bg-card-subtle border border-border space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-semibold text-text uppercase tracking-wider">
                                    Target Job Description
                                </label>
                                {applications.length > 0 && (
                                    <select
                                        onChange={(e) => handleQuickSelectApp(e.target.value)}
                                        className="text-xs px-2 py-1 rounded-lg bg-card border border-border text-text"
                                    >
                                        <option value="">-- Pre-fill from Tracked Application --</option>
                                        {applications.map(app => (
                                            <option key={app.id || app._id} value={app.id || app._id}>
                                                {app.company} – {app.position}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                placeholder="Target Role Title (e.g. Senior Frontend Engineer)"
                                className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-border text-text focus:border-primary focus:outline-none"
                            />

                            <textarea
                                rows="4"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the target job description or requirements here..."
                                className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-border text-text focus:border-primary focus:outline-none resize-none font-mono"
                            />

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isScoring || !jobDescription || jobDescription.trim().length < 20}
                                    className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-warm flex items-center gap-2 cursor-pointer"
                                >
                                    {isScoring ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" /> : <Target size={14} />}
                                    <span>{isScoring ? 'Computing Deterministic Match...' : 'Calculate Job Match (0-100)'}</span>
                                </button>
                            </div>
                        </form>

                        {/* Keyword Highlights (Green Matched vs Red Missing) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Matched Keywords */}
                            <div className="p-4 rounded-xl bg-sage/5 border border-sage/25">
                                <h6 className="text-xs font-semibold text-sage flex items-center gap-1.5 mb-2.5">
                                    <CheckCircle2 size={14} />
                                    <span>Matched Keywords ({matchedKeywords.length})</span>
                                </h6>
                                {matchedKeywords.length === 0 ? (
                                    <p className="text-xs text-muted italic">Run job match to discover overlapping keywords.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {matchedKeywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sage/15 text-sage border border-sage/30 flex items-center gap-1"
                                                title={kw.inBullets ? 'Found in work experience bullets' : 'Found in skills section'}
                                            >
                                                <Check size={11} />
                                                <span>{kw.canonical}</span>
                                                {kw.inBullets && <span className="text-[10px] opacity-75">★</span>}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Missing Keywords */}
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/25">
                                <h6 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2.5">
                                    <AlertCircle size={14} />
                                    <span>Missing Skills in Resume ({missingKeywords.length})</span>
                                </h6>
                                {missingKeywords.length === 0 ? (
                                    <p className="text-xs text-muted italic">
                                        {matchedKeywords.length > 0 ? 'All key requirements matched!' : 'No missing skills detected yet.'}
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {missingKeywords.map((kw, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/25 flex items-center gap-1"
                                            >
                                                <X size={11} />
                                                <span>{kw.canonical}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Match Criteria Bars */}
                        {matchScore !== null && (
                            <div className="space-y-3 pt-2">
                                <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Job Match Breakdown</h5>
                                {[
                                    { title: 'Required Skills Coverage', score: matchBreakdown.requiredSkills?.score ?? 40, max: 40 },
                                    { title: 'Title & Headline Alignment', score: matchBreakdown.titleAlignment?.score ?? 15, max: 15 },
                                    { title: 'Seniority & Experience Match', score: matchBreakdown.experienceSeniority?.score ?? 15, max: 15 },
                                    { title: 'Preferred & Bonus Skills', score: matchBreakdown.preferredSkills?.score ?? 10, max: 10 },
                                    { title: 'Keywords in Bullets (Context)', score: matchBreakdown.keywordsInBullets?.score ?? 10, max: 10 },
                                    { title: 'Education Alignment', score: matchBreakdown.education?.score ?? 5, max: 5 },
                                    { title: 'Soft & Domain Alignment', score: matchBreakdown.softDomain?.score ?? 5, max: 5 }
                                ].map((item, idx) => {
                                    const pct = Math.round((item.score / item.max) * 100);
                                    return (
                                        <div key={idx} className="p-3 rounded-xl bg-card border border-border shadow-warm-sm">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-semibold text-text">{item.title}</span>
                                                <span className="font-mono text-muted">{item.score} / {item.max} pts</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-sage' : pct >= 50 ? 'bg-amber' : 'bg-primary'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: "FIX IT" SUGGESTIONS */}
                {activeTab === 'rewrites' && (
                    <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-amber/10 border border-amber/25 text-xs text-amber-800 dark:text-amber-300">
                            <strong>Action-Oriented Bullet Recommendations:</strong> We identified weaker bullet points and generated suggested revisions that lead with strong action verbs and metrics.
                        </div>

                        {bulletFixes.length === 0 ? (
                            <div className="py-8 text-center text-muted">
                                <CheckCircle2 size={32} className="text-sage mx-auto mb-2" />
                                <p className="font-medium text-sm text-text">No weak bullets flagged!</p>
                                <p className="text-xs mt-1">Your bullets already use strong verbs and measurable metrics.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bulletFixes.map((fix, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-card border border-border shadow-warm-sm space-y-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Original Bullet</span>
                                            <p className="text-xs font-mono bg-card-subtle p-2.5 rounded-lg border border-border text-text">
                                                {fix.original}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-sage flex items-center gap-1">
                                                <Sparkles size={11} /> Suggested ATS Revision
                                            </span>
                                            <p className="text-xs p-2.5 rounded-lg bg-sage/10 border border-sage/30 text-text font-medium">
                                                {fix.suggestion}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] text-muted">
                                                Status: <strong className="capitalize">{fix.status || 'Pending'}</strong>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleBulletAction(idx, 'rejected')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                                        fix.status === 'rejected'
                                                            ? 'bg-stone-500/20 text-muted'
                                                            : 'bg-card-subtle hover:bg-red-500/10 text-muted hover:text-red-500'
                                                    }`}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleBulletAction(idx, 'accepted')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                                                        fix.status === 'accepted'
                                                            ? 'bg-sage text-white'
                                                            : 'bg-sage/15 hover:bg-sage text-sage hover:text-white'
                                                    }`}
                                                >
                                                    <Check size={12} />
                                                    <span>{fix.status === 'accepted' ? 'Accepted' : 'Accept Suggestion'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: SCORE HISTORY */}
                {activeTab === 'history' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted mb-2">
                            <span>Historical deterministic score logs for this resume version</span>
                            <span>{scoreHistory.length} recorded evaluations</span>
                        </div>

                        {scoreHistory.length === 0 ? (
                            <p className="text-xs text-muted italic text-center py-6">No historical evaluations recorded yet.</p>
                        ) : (
                            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card shadow-warm-sm">
                                {scoreHistory.map((item, idx) => (
                                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-card-subtle/50 transition-colors">
                                        <div>
                                            <div className="font-semibold text-text text-sm">
                                                {item.targetRole || 'Initial ATS Health Screen'}
                                            </div>
                                            <div className="text-muted text-[11px] mt-0.5">
                                                {new Date(item.date).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })} • Type: {item.scoreType || 'Health'}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-serif font-bold text-base text-text">
                                                {item.score}
                                            </span>
                                            <span className="text-[10px] text-muted ml-0.5">/100</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="flex justify-end pt-3 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-card hover:bg-card-subtle border border-border text-text rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AtsScoreModal;

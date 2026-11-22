import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import Counter from './Counter';
import {
    Sparkles, FileText, Mail, HelpCircle, Copy, Check, Send,
    RefreshCw, ChevronRight, CheckCircle2, AlertCircle, ArrowRight,
    MessageSquare, Award, ThumbsUp, Lightbulb, ExternalLink
} from 'lucide-react';

const AiCopilotModal = ({
    isOpen,
    onClose,
    application = null,
    resumes = [],
    initialTab = 'cover_letter'
}) => {
    const [activeTab, setActiveTab] = useState(initialTab); // 'cover_letter' | 'bullets' | 'emails' | 'interview'

    // Shared Context Fields
    const [company, setCompany] = useState('');
    const [position, setPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [resumeText, setResumeText] = useState('');

    // Tab 1: Cover Letter State
    const [coverLetterTone, setCoverLetterTone] = useState('Confident & Direct');
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

    // Tab 2: Tailored Bullets State
    const [inputBullets, setInputBullets] = useState(
        '• Worked on the frontend application using modern React and TypeScript.\n• Built REST APIs for database operations and user management.\n• Assisted in deployment pipelines and participated in sprint planning.'
    );
    const [tailoredBullets, setTailoredBullets] = useState([]);
    const [isTailoringBullets, setIsTailoringBullets] = useState(false);
    const [copiedBulletIndex, setCopiedBulletIndex] = useState(null);

    // Tab 3: Email Drafter State
    const [emailType, setEmailType] = useState('thank_you'); // 'thank_you' | 'status_check' | 'offer_negotiation' | 'withdrawal'
    const [interviewerName, setInterviewerName] = useState('');
    const [keyTopicsDiscussed, setKeyTopicsDiscussed] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isDraftingEmail, setIsDraftingEmail] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);

    // Tab 4: Interview Prep State
    const [interviewQuestions, setInterviewQuestions] = useState([]);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [candidateAnswer, setCandidateAnswer] = useState('');
    const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState(null);

    // Sync from application prop
    useEffect(() => {
        if (application) {
            setCompany(application.company || '');
            setPosition(application.position || '');
            const skillsStr = Array.isArray(application.skills) && application.skills.length > 0
                ? `Required Skills: ${application.skills.join(', ')}.\n`
                : '';
            const locationStr = application.location ? `Location: ${application.location}.\n` : '';
            const notesStr = application.notes ? `Notes: ${application.notes}` : '';
            setJobDescription(`${skillsStr}${locationStr}${notesStr}`);
            if (application.resumeId) {
                const rId = application.resumeId._id || application.resumeId;
                setSelectedResumeId(rId);
            }
        }
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [application, initialTab, isOpen]);

    // Pre-fill resume text when selected
    useEffect(() => {
        if (selectedResumeId && resumes.length > 0) {
            const found = resumes.find(r => (r._id || r.id) === selectedResumeId);
            if (found) {
                if (found.extractedText) {
                    setResumeText(found.extractedText);
                } else {
                    setResumeText(`Experienced in modern software engineering, web application development, and cloud services.`);
                }
            }
        }
    }, [selectedResumeId, resumes]);

    // 1. Generate Cover Letter
    const handleGenerateCoverLetter = async (e) => {
        e?.preventDefault();
        if (!company || !position) return;

        setIsGeneratingCoverLetter(true);
        try {
            const { data } = await api.post('/api/ai/cover-letter', {
                company,
                position,
                jobDescription,
                resumeText,
                tone: coverLetterTone
            });
            setGeneratedCoverLetter(data.coverLetter || '');
        } catch (err) {
            console.error('Failed to generate cover letter', err);
            alert('Failed to generate cover letter');
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    // 2. Tailor Bullets
    const handleTailorBullets = async (e) => {
        e?.preventDefault();
        const bulletList = inputBullets.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);

        setIsTailoringBullets(true);
        try {
            const { data } = await api.post('/api/ai/tailor-bullets', {
                resumeBullets: bulletList,
                position,
                company,
                jobDescription
            });
            setTailoredBullets(data.tailoredBullets || []);
        } catch (err) {
            console.error('Failed to tailor bullets', err);
            alert('Failed to tailor bullets');
        } finally {
            setIsTailoringBullets(false);
        }
    };

    // 3. Draft Email
    const handleDraftEmail = async (e) => {
        e?.preventDefault();
        setIsDraftingEmail(true);
        try {
            const { data } = await api.post('/api/ai/draft-email', {
                type: emailType,
                company: company || 'the Company',
                position: position || 'the Role',
                interviewerName,
                keyTopicsDiscussed
            });
            setEmailSubject(data.subject || '');
            setEmailBody(data.body || '');
        } catch (err) {
            console.error('Failed to draft email', err);
            alert('Failed to draft email');
        } finally {
            setIsDraftingEmail(false);
        }
    };

    // 4. Generate Interview Questions
    const handleGenerateQuestions = async () => {
        setIsGeneratingQuestions(true);
        setAnswerFeedback(null);
        try {
            const { data } = await api.post('/api/ai/interview-questions', {
                position: position || 'Software Engineer',
                company: company || 'Tech Company',
                jobDescription
            });
            setInterviewQuestions(data.questions || []);
            setSelectedQuestionIndex(0);
        } catch (err) {
            console.error('Failed to generate interview questions', err);
            alert('Failed to generate interview questions');
        } finally {
            setIsGeneratingQuestions(false);
        }
    };

    // 5. Evaluate Interview Answer
    const handleEvaluateAnswer = async (e) => {
        e?.preventDefault();
        const currentQ = interviewQuestions[selectedQuestionIndex];
        if (!currentQ || !candidateAnswer.trim()) return;

        setIsEvaluatingAnswer(true);
        try {
            const { data } = await api.post('/api/ai/evaluate-answer', {
                question: currentQ.question,
                answer: candidateAnswer,
                position: position || 'Software Engineer'
            });
            setAnswerFeedback(data);
        } catch (err) {
            console.error('Failed to evaluate answer', err);
            alert('Failed to evaluate answer');
        } finally {
            setIsEvaluatingAnswer(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'cover_letter') {
            setCopiedCoverLetter(true);
            setTimeout(() => setCopiedCoverLetter(false), 2000);
        } else if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else if (typeof type === 'number') {
            setCopiedBulletIndex(type);
            setTimeout(() => setCopiedBulletIndex(null), 2000);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Sparkles className="text-primary w-5 h-5" />
                    <span>AI Career Copilot</span>
                    {company && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-card-subtle text-muted border border-border font-sans font-normal">
                            {company} • {position}
                        </span>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Feature Tabs */}
                <div className="flex flex-wrap border-b border-border text-sm font-medium gap-1">
                    <button
                        onClick={() => setActiveTab('cover_letter')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'cover_letter'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <FileText size={16} />
                        <span>Tailored Cover Letter</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('bullets')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'bullets'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <Sparkles size={16} />
                        <span>Bullet Tailoring</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('emails')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'emails'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <Mail size={16} />
                        <span>Follow-Up Drafter</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('interview')}
                        className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'interview'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted hover:text-text'
                        }`}
                    >
                        <HelpCircle size={16} />
                        <span>Interview Prep & Practice</span>
                    </button>
                </div>

                {/* Common Opportunity Context Form */}
                <div className="p-3.5 rounded-xl bg-card-subtle border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Company</label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="e.g. Stripe, Google"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Position / Role</label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Linked Resume Source</label>
                        <select
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border text-text focus:border-primary focus:outline-none"
                        >
                            <option value="">-- Use Default Experience --</option>
                            {resumes.map(r => (
                                <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TAB 1: COVER LETTER */}
                {activeTab === 'cover_letter' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted">Writing Tone:</span>
                                {['Confident & Direct', 'Conversational', 'Executive'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setCoverLetterTone(t)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                            coverLetterTone === t
                                                ? 'bg-primary text-white font-semibold'
                                                : 'bg-card border border-border text-text hover:bg-card-subtle'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateCoverLetter}
                                disabled={isGeneratingCoverLetter || !company || !position}
                                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-warm transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                            >
                                {isGeneratingCoverLetter ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Sparkles size={14} />
                                )}
                                <span>{isGeneratingCoverLetter ? 'Crafting Cover Letter...' : 'Generate Tailored Letter'}</span>
                            </button>
                        </div>

                        {generatedCoverLetter ? (
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-warm space-y-4 relative">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <span className="font-serif font-bold text-sm text-text">
                                        Tailored Cover Letter for {company}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(generatedCoverLetter, 'cover_letter')}
                                        className="px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-border text-xs font-medium text-text transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {copiedCoverLetter ? <Check size={13} className="text-sage" /> : <Copy size={13} />}
                                        <span>{copiedCoverLetter ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
                                    </button>
                                </div>
                                <div className="font-serif text-sm leading-relaxed text-text whitespace-pre-line">
                                    {generatedCoverLetter}
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted border-2 border-dashed border-border rounded-2xl p-6">
                                <FileText size={36} className="mx-auto mb-2 text-primary opacity-60" />
                                <p className="font-serif font-semibold text-text text-base">No cover letter generated yet</p>
                                <p className="text-xs max-w-md mx-auto mt-1">
                                    Click &quot;Generate Tailored Letter&quot; above to produce an impactful, human-written cover letter matching your accomplishments to {company || 'the company'}.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: BULLET TAILORING */}
                {activeTab === 'bullets' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                Original Bullets to Tailor
                            </label>
                            <textarea
                                rows="3"
                                value={inputBullets}
                                onChange={(e) => setInputBullets(e.target.value)}
                                className="w-full p-3 rounded-xl bg-card-subtle border border-border text-xs font-mono text-text focus:border-primary focus:outline-none"
                                placeholder="Paste 2-4 bullets (one per line)..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleTailorBullets}
                                disabled={isTailoringBullets}
                                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {isTailoringBullets ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Sparkles size={14} />
                                )}
                                <span>{isTailoringBullets ? 'Aligning Bullets...' : 'Tailor Bullets to Role'}</span>
                            </button>
                        </div>

                        {tailoredBullets.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h5 className="text-xs font-semibold text-muted uppercase tracking-wider">Tailored Bullet Alternatives</h5>
                                {tailoredBullets.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-card border border-border shadow-warm-sm space-y-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-muted">Original:</span>
                                            <p className="text-xs text-muted font-mono">{item.original}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-sage flex items-center gap-1">
                                                <Sparkles size={11} /> High-Impact Tailored Version:
                                            </span>
                                            <p className="text-xs text-text font-medium bg-sage/10 p-2.5 rounded-lg border border-sage/25">
                                                {item.tailored}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1">
                                            <span className="text-muted text-[11px] italic">{item.rationale}</span>
                                            <button
                                                onClick={() => copyToClipboard(item.tailored, idx)}
                                                className="px-3 py-1 rounded-lg bg-card-subtle hover:bg-card border border-border text-xs font-medium text-text flex items-center gap-1 cursor-pointer"
                                            >
                                                {copiedBulletIndex === idx ? <Check size={12} className="text-sage" /> : <Copy size={12} />}
                                                <span>{copiedBulletIndex === idx ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: FOLLOW-UP EMAIL DRAFTER */}
                {activeTab === 'emails' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                    Email Purpose
                                </label>
                                <select
                                    value={emailType}
                                    onChange={(e) => setEmailType(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-text focus:border-primary focus:outline-none"
                                >
                                    <option value="thank_you">Post-Interview Thank You (Within 24h)</option>
                                    <option value="status_check">7-Day Status Check-In (Stale Application)</option>
                                    <option value="offer_negotiation">Offer Appreciation & Discussion</option>
                                    <option value="withdrawal">Polite Application Withdrawal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                    Interviewer / Recruiter Name
                                </label>
                                <input
                                    type="text"
                                    value={interviewerName}
                                    onChange={(e) => setInterviewerName(e.target.value)}
                                    placeholder="e.g. Sarah Jenkins"
                                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-text focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                Key Discussion Topics / Notes (Optional)
                            </label>
                            <input
                                type="text"
                                value={keyTopicsDiscussed}
                                onChange={(e) => setKeyTopicsDiscussed(e.target.value)}
                                placeholder="e.g. Discussed microservices migration and scaling WebSocket infrastructure"
                                className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-text focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleDraftEmail}
                                disabled={isDraftingEmail}
                                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {isDraftingEmail ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Mail size={14} />
                                )}
                                <span>{isDraftingEmail ? 'Drafting Email...' : 'Draft Professional Email'}</span>
                            </button>
                        </div>

                        {emailBody && (
                            <div className="p-5 rounded-2xl bg-card border border-border shadow-warm space-y-3">
                                <div className="space-y-1 border-b border-border pb-3">
                                    <span className="text-[10px] font-bold uppercase text-muted">Subject Line</span>
                                    <p className="font-semibold text-text text-sm">{emailSubject}</p>
                                </div>
                                <div className="font-sans text-xs leading-relaxed text-text whitespace-pre-line">
                                    {emailBody}
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        onClick={() => copyToClipboard(`Subject: ${emailSubject}\n\n${emailBody}`, 'email')}
                                        className="px-3.5 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-border text-xs font-medium text-text flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {copiedEmail ? <Check size={13} className="text-sage" /> : <Copy size={13} />}
                                        <span>{copiedEmail ? 'Copied Full Email!' : 'Copy to Clipboard'}</span>
                                    </button>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-warm-sm"
                                    >
                                        <Send size={13} />
                                        <span>Open in Email Client</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: INTERVIEW PREP & PRACTICE */}
                {activeTab === 'interview' && (
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card-subtle border border-border">
                            <div>
                                <h5 className="font-serif font-bold text-sm text-text">Likely Interview Questions Simulator</h5>
                                <p className="text-xs text-muted">Simulate interview questions extracted from {company || 'the job'} description.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateQuestions}
                                disabled={isGeneratingQuestions}
                                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-warm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                            >
                                {isGeneratingQuestions ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <HelpCircle size={14} />
                                )}
                                <span>{isGeneratingQuestions ? 'Extracting Questions...' : (interviewQuestions.length > 0 ? 'Regenerate Questions' : 'Generate Interview Questions')}</span>
                            </button>
                        </div>

                        {interviewQuestions.length > 0 && (
                            <div className="space-y-4">
                                {/* Question Switcher Tabs */}
                                <div className="flex flex-wrap gap-2">
                                    {interviewQuestions.map((q, idx) => (
                                        <button
                                            key={q.id || idx}
                                            onClick={() => {
                                                setSelectedQuestionIndex(idx);
                                                setAnswerFeedback(null);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                                selectedQuestionIndex === idx
                                                    ? 'bg-primary text-white font-semibold shadow-warm-sm'
                                                    : 'bg-card border border-border text-muted hover:text-text'
                                            }`}
                                        >
                                            Q{idx + 1}: {q.category}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Question Card */}
                                {interviewQuestions[selectedQuestionIndex] && (
                                    <div className="p-5 rounded-2xl bg-card border border-border shadow-warm space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                                {interviewQuestions[selectedQuestionIndex].category}
                                            </span>
                                            <h4 className="font-serif font-bold text-base text-text">
                                                {interviewQuestions[selectedQuestionIndex].question}
                                            </h4>
                                        </div>

                                        <div className="p-3 rounded-xl bg-card-subtle border border-border text-xs text-muted space-y-1">
                                            <div className="font-semibold text-text flex items-center gap-1.5">
                                                <Lightbulb size={13} className="text-amber" />
                                                <span>What the Interviewer is Evaluating:</span>
                                            </div>
                                            <p>{interviewQuestions[selectedQuestionIndex].interviewerGoal}</p>
                                        </div>

                                        {/* Practice Answer Textarea */}
                                        <form onSubmit={handleEvaluateAnswer} className="space-y-3">
                                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                                Practice Your Answer (STAR Method)
                                            </label>
                                            <textarea
                                                rows="4"
                                                value={candidateAnswer}
                                                onChange={(e) => setCandidateAnswer(e.target.value)}
                                                placeholder="Draft your answer here: Situation, Task, Action you took, and measurable Result..."
                                                className="w-full p-3 rounded-xl bg-card-subtle border border-border text-xs text-text focus:border-primary focus:outline-none resize-none font-sans"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={isEvaluatingAnswer || !candidateAnswer.trim()}
                                                    className="px-4 py-2 bg-sage hover:bg-sage/90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    {isEvaluatingAnswer ? (
                                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                                                    ) : (
                                                        <Award size={14} />
                                                    )}
                                                    <span>{isEvaluatingAnswer ? 'Evaluating Answer...' : 'Evaluate My Answer'}</span>
                                                </button>
                                            </div>
                                        </form>

                                        {/* Feedback Card */}
                                        {answerFeedback && (
                                            <div className="p-4 rounded-xl bg-card-subtle border border-border space-y-3 mt-3 animate-in fade-in duration-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-serif font-bold text-sm text-text">Answer Score & Feedback</span>
                                                    <div className="flex items-center gap-1 font-serif font-bold text-lg text-sage">
                                                        <Counter to={answerFeedback.score} />
                                                        <span className="text-xs text-muted">/100</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                    <div className="p-3 rounded-lg bg-sage/10 border border-sage/25 space-y-1">
                                                        <strong className="text-sage flex items-center gap-1">
                                                            <ThumbsUp size={12} /> Strengths:
                                                        </strong>
                                                        <ul className="list-disc list-inside text-text/80 space-y-0.5">
                                                            {answerFeedback.strengths.map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 space-y-1">
                                                        <strong className="text-primary flex items-center gap-1">
                                                            <AlertCircle size={12} /> Improvement Areas:
                                                        </strong>
                                                        <ul className="list-disc list-inside text-text/80 space-y-0.5">
                                                            {answerFeedback.improvements.map((imp, i) => (
                                                                <li key={i}>{imp}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {answerFeedback.modelAnswer && (
                                                    <div className="space-y-1 pt-2 border-t border-border">
                                                        <span className="text-[10px] font-bold uppercase text-muted">Model STAR Answer Strategy:</span>
                                                        <p className="text-xs font-serif leading-relaxed text-text italic">
                                                            &quot;{answerFeedback.modelAnswer}&quot;
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                        Close Copilot
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AiCopilotModal;

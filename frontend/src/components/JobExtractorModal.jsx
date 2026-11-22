import { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { Sparkles, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { triggerOfferConfetti } from '../utils/confetti';

const JobExtractorModal = ({ isOpen, onClose, onApplicationCreated, resumes = [] }) => {
    const [mode, setMode] = useState('text'); // 'url' | 'text'
    const [inputUrl, setInputUrl] = useState('');
    const [inputText, setInputText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Form fields for review
    const [company, setCompany] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('Applied');
    const [jobUrl, setJobUrl] = useState('');
    const [location, setLocation] = useState('');
    const [salary, setSalary] = useState('');
    const [source, setSource] = useState('LinkedIn');
    const [notes, setNotes] = useState('');
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState('');

    const handleExtract = async (e) => {
        e.preventDefault();
        setError('');
        if (mode === 'url' && !inputUrl) {
            setError('Please enter a job posting URL');
            return;
        }
        if (mode === 'text' && (!inputText || inputText.length < 30)) {
            setError('Please paste a job description of at least 30 characters');
            return;
        }

        setIsExtracting(true);
        try {
            const { data } = await api.post('/api/applications/extract', {
                url: mode === 'url' ? inputUrl : '',
                text: mode === 'text' ? inputText : ''
            });

            setExtractedData(data);
            setCompany(data.company || '');
            setPosition(data.position || '');
            setJobUrl(data.jobUrl || inputUrl || '');
            setLocation(data.location || '');
            setSalary(data.salary || '');
            setSource(data.source || 'Job Board');
            setSkills(Array.isArray(data.skills) ? data.skills : []);
            if (resumes.length > 0) {
                setSelectedResumeId(resumes[0]._id);
            }
        } catch (err) {
            console.error('Extraction failed', err);
            setError(err.response?.data?.message || 'Failed to extract job details. You can enter them manually.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                company: company || 'Untitled Opportunity',
                position: position || 'Role Pending',
                status,
                jobUrl,
                location,
                salary,
                source,
                notes,
                skills,
                resumeId: selectedResumeId || null
            };

            const { data } = await api.post('/api/applications', payload);
            if (data.status === 'Offer') {
                triggerOfferConfetti();
            }
            if (onApplicationCreated) {
                onApplicationCreated(data);
            }
            handleClose();
        } catch (err) {
            console.error('Save failed', err);
            setError('Failed to save application');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setExtractedData(null);
        setInputUrl('');
        setInputText('');
        setError('');
        onClose();
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const addSkill = (e) => {
        e.preventDefault();
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={extractedData ? "Review & Confirm Extracted Role" : "Add from Job Description"}
        >
            {!extractedData ? (
                <div className="space-y-5">
                    {/* Mode Toggle Tabs */}
                    <div className="flex bg-card-subtle p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setMode('text')}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === 'text' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                            }`}
                        >
                            <FileText size={14} />
                            <span>Paste Job Description</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === 'url' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                            }`}
                        >
                            <LinkIcon size={14} />
                            <span>Paste Job URL</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleExtract} className="space-y-4">
                        {mode === 'url' ? (
                            <div>
                                <label className="block text-xs font-medium text-text mb-1.5">Job Posting URL</label>
                                <input
                                    type="url"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    placeholder="https://jobs.lever.co/company/role-title"
                                    className="w-full p-3 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                                />
                                <p className="text-[11px] text-muted mt-1.5">
                                    Supports LinkedIn, Greenhouse, Lever, Ashby, and company career portals.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-text mb-1.5">Job Description Text</label>
                                <textarea
                                    rows={8}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Paste the role overview, responsibilities, and qualifications..."
                                    className="w-full p-3 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none font-sans"
                                />
                                <p className="text-[11px] text-muted mt-1.5">
                                    Our parser extracts the company, position, required skills, salary range, and work location.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2.5 text-muted hover:text-text text-sm font-medium transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isExtracting}
                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles size={16} />
                                <span>{isExtracting ? 'Analyzing Description...' : 'Extract & Pre-Fill'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Review Form with Pre-Filled Extracted Fields */
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="p-3 bg-sage/10 border border-sage/25 rounded-xl text-xs text-sage flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>Successfully extracted! Review the pre-filled fields and customize before saving.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Company *</label>
                            <input
                                type="text"
                                required
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Position / Role *</label>
                            <input
                                type="text"
                                required
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            >
                                <option value="Wishlist">Wishlist</option>
                                <option value="Applied">Applied</option>
                                <option value="Screening">Screening</option>
                                <option value="Interviewing">Interview</option>
                                <option value="Offer">Offer Received 🎉</option>
                                <option value="Rejected">Closed Chapter</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Remote, Hybrid, etc."
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Estimated Salary</label>
                            <input
                                type="text"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                placeholder="$130k - $150k"
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Job Link</label>
                            <input
                                type="url"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Link Resume Version</label>
                            <select
                                value={selectedResumeId}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                            >
                                <option value="">No linked resume</option>
                                {resumes.map(r => (
                                    <option key={r._id} value={r._id}>
                                        {r.name} (ATS {r.atsScore}/100)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Detected Skills Chips */}
                    <div>
                        <label className="block text-xs font-medium text-text mb-1.5">Extracted Key Skills</label>
                        <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto">
                            {skills.map(skill => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card-subtle border border-border text-xs text-text"
                                >
                                    <span>{skill}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="text-muted hover:text-red-500 ml-0.5 cursor-pointer"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add skill (e.g. React, Docker)"
                                className="flex-1 p-2 rounded-xl bg-background border border-border text-xs text-text focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                className="px-3 py-2 bg-card-subtle hover:bg-card border border-border text-text text-xs rounded-xl font-medium cursor-pointer"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text mb-1">Initial Strategy & Notes</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Points to emphasize in your cover letter or recruiter screen..."
                            className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none font-sans"
                        />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setExtractedData(null)}
                            className="text-xs text-muted hover:text-text cursor-pointer"
                        >
                            ← Extract different job
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-muted hover:text-text text-sm font-medium transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <span>{isSaving ? 'Saving...' : 'Save to Board'}</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default JobExtractorModal;

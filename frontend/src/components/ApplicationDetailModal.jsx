import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { ExternalLink, Calendar, MapPin, DollarSign, UserCheck, Trash2, Save, Plus, Clock, CheckCircle2, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { triggerOfferConfetti } from '../utils/confetti';

const ApplicationDetailModal = ({ isOpen, onClose, application, onUpdated, onDeleted, resumes = [], onOpenCopilot }) => {
    if (!application) return null;

    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'contacts' | 'timeline'
    const [company, setCompany] = useState(application.company || '');
    const [position, setPosition] = useState(application.position || '');
    const [status, setStatus] = useState(application.status || 'Applied');
    const [jobUrl, setJobUrl] = useState(application.jobUrl || '');
    const [location, setLocation] = useState(application.location || '');
    const [salary, setSalary] = useState(application.salary || '');
    const [source, setSource] = useState(application.source || 'Direct');
    const [notes, setNotes] = useState(application.notes || '');
    const [skills, setSkills] = useState(application.skills || []);
    const [newSkill, setNewSkill] = useState('');
    const [contacts, setContacts] = useState(application.contacts || []);
    const [resumeId, setResumeId] = useState(application.resumeId?._id || application.resumeId || '');
    const [statusTimeline, setStatusTimeline] = useState(application.statusTimeline || []);
    const [isSaving, setIsSaving] = useState(false);

    // New contact form fields
    const [contactName, setContactName] = useState('');
    const [contactRole, setContactRole] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    useEffect(() => {
        if (application) {
            setCompany(application.company || '');
            setPosition(application.position || '');
            setStatus(application.status || 'Applied');
            setJobUrl(application.jobUrl || '');
            setLocation(application.location || '');
            setSalary(application.salary || '');
            setSource(application.source || 'Direct');
            setNotes(application.notes || '');
            setSkills(application.skills || []);
            setContacts(application.contacts || []);
            setResumeId(application.resumeId?._id || application.resumeId || '');
            setStatusTimeline(application.statusTimeline || []);
        }
    }, [application]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                company,
                position,
                status,
                jobUrl,
                location,
                salary,
                source,
                notes,
                skills,
                contacts,
                resumeId: resumeId || null
            };

            const { data } = await api.put(`/api/applications/${application.id || application._id}`, payload);
            if (data.status === 'Offer' && application.status !== 'Offer') {
                triggerOfferConfetti();
            }
            if (onUpdated) {
                onUpdated(data);
            }
            onClose();
        } catch (err) {
            console.error('Update failed', err);
            alert('Failed to save application updates');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddContact = (e) => {
        e.preventDefault();
        if (!contactName.trim()) return;
        const newContact = {
            name: contactName.trim(),
            role: contactRole.trim() || 'Recruiter / Hiring Contact',
            email: contactEmail.trim()
        };
        setContacts([...contacts, newContact]);
        setContactName('');
        setContactRole('');
        setContactEmail('');
    };

    const handleRemoveContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete application for ${company}?`)) return;
        try {
            await api.delete(`/api/applications/${application.id || application._id}`);
            if (onDeleted) {
                onDeleted(application.id || application._id);
            }
            onClose();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${company || 'Application'} • Details`}
        >
            <div className="space-y-5">
                {/* Tabs & AI Copilot Action */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex bg-card-subtle p-1 rounded-xl border border-border flex-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'details' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                            }`}
                        >
                            Overview & Role
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('contacts')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                activeTab === 'contacts' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                            }`}
                        >
                            <span>Contacts</span>
                            {contacts.length > 0 && (
                                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                                    {contacts.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'timeline' ? 'bg-card text-text shadow-sm' : 'text-muted hover:text-text'
                            }`}
                        >
                            Status Timeline
                        </button>
                    </div>

                    {onOpenCopilot && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onOpenCopilot(application, 'cover_letter');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/25 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-warm-sm"
                            title="Generate cover letters, emails, or interview questions for this job"
                        >
                            <Sparkles size={13} />
                            <span>AI Copilot</span>
                        </button>
                    )}
                </div>

                {activeTab === 'details' && (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-medium text-text mb-1">Company</label>
                                <input
                                    type="text"
                                    required
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text mb-1">Position / Role</label>
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
                                <label className="block text-xs font-medium text-text mb-1">Stage</label>
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
                                    placeholder="e.g. San Francisco or Remote"
                                    className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text mb-1">Salary Range</label>
                                <input
                                    type="text"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    placeholder="e.g. $130,000"
                                    className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-medium text-text">Job Posting URL</label>
                                    {jobUrl && (
                                        <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                            <span>Visit link</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                                </div>
                                <input
                                    type="url"
                                    value={jobUrl}
                                    onChange={(e) => setJobUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text mb-1">Linked Resume Version</label>
                                <select
                                    value={resumeId}
                                    onChange={(e) => setResumeId(e.target.value)}
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

                        {/* Skills */}
                        <div>
                            <label className="block text-xs font-medium text-text mb-1.5">Required Skills</label>
                            <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto">
                                {skills.map(skill => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card-subtle border border-border text-xs text-text"
                                    >
                                        <span>{skill}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
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
                                    placeholder="Add skill (e.g. Python, AWS)"
                                    className="flex-1 p-2 rounded-xl bg-background border border-border text-xs text-text focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="px-3 py-2 bg-card-subtle hover:bg-card border border-border text-text text-xs rounded-xl font-medium cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">Notes & Follow-up Plan</label>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Key points from recruiter screen, interview impressions, or next steps..."
                                className="w-full p-2.5 rounded-xl bg-background border border-border text-text text-sm focus:border-primary focus:outline-none font-sans"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-border">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete this application"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-muted hover:text-text text-sm font-medium transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={15} />
                                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-card-subtle border border-border">
                            <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-2">Add New Contact</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                <input
                                    type="text"
                                    placeholder="Contact Name"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="p-2 bg-background border border-border rounded-lg text-xs text-text focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Role (e.g. Recruiter)"
                                    value={contactRole}
                                    onChange={(e) => setContactRole(e.target.value)}
                                    className="p-2 bg-background border border-border rounded-lg text-xs text-text focus:outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="p-2 bg-background border border-border rounded-lg text-xs text-text focus:outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddContact}
                                className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                <span>Save Contact</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {contacts.length === 0 ? (
                                <p className="text-xs text-muted text-center py-6 italic">No contacts added yet for this role.</p>
                            ) : (
                                contacts.map((c, idx) => (
                                    <div key={idx} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3 shadow-warm-sm">
                                        <div>
                                            <div className="font-semibold text-sm text-text">{c.name}</div>
                                            <div className="text-xs text-muted">{c.role} {c.email && `• ${c.email}`}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveContact(idx)}
                                            className="text-muted hover:text-red-500 p-1 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-3 border-t border-border flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-medium cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Status Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        <p className="text-xs text-muted">A recorded history of every milestone progression for this application.</p>
                        <div className="relative border-l-2 border-border ml-3 pl-5 space-y-5 py-2">
                            {statusTimeline.length === 0 ? (
                                <p className="text-xs text-muted italic">Timeline is automatically recorded as stages evolve.</p>
                            ) : (
                                statusTimeline.map((item, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card" />
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-serif font-bold text-sm text-text">{item.status}</span>
                                            <span className="text-[11px] text-muted font-mono">
                                                {new Date(item.date).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        {item.notes && (
                                            <p className="text-xs text-muted mt-0.5 leading-snug">{item.notes}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ApplicationDetailModal;

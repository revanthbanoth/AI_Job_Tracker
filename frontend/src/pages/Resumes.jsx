import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';

const Resumes = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchResumes = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/resumes`).catch(e => ({ data: [] }));
                // Ensure data is mapped correctly if needed, but backend returns what we need
                // Backend returns: {_id, name, size, atsScore, uploadDate(createdAt), status}

                const validData = Array.isArray(data) ? data : [];

                const formattedResumes = validData.map(r => ({
                    id: r._id,
                    name: r.name || 'Untitled Resume',
                    size: r.size || 'Unknown size',
                    atsScore: r.atsScore || 0,
                    uploadDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
                    status: r.status
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        // Create FormData
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('name', selectedFile.name);

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/resumes`, formData);

            const newResume = {
                id: data._id,
                name: data.name,
                size: data.size,
                uploadDate: new Date(data.createdAt).toLocaleDateString(),
                atsScore: data.atsScore,
                status: data.status
            };

            setResumes([newResume, ...resumes]);
            setIsUploadOpen(false);
            setSelectedFile(null);
        } catch (error) {
            console.error('Failed to upload resume', error);
        }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/resumes/${id}`);
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
            <div className="flex flex-col items-center justify-center min-h-[400px] text-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-xl font-medium">Loading your resumes...</p>
            </div>
        );
    }

    return (
        <div className="bg-card/30 border border-border rounded-2xl p-6 min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text">Resume Management</h3>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                    <UploadCloud size={18} />
                    Upload Resume
                </button>
            </div>

            {resumes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                    <p className="text-muted mb-4">You haven't uploaded any resumes yet.</p>
                    <div className="text-sm text-muted">
                        Upload your resume to get AI insights and job matching scores.
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-black/10 dark:hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="text-text font-medium">{resume.name}</h4>
                                    <div className="flex items-center gap-3 text-sm text-muted mt-1">
                                        <span>{resume.size}</span>
                                        <span>•</span>
                                        <span>{resume.uploadDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-sm text-muted mb-1">ATS Score</div>
                                    <div className={`font-bold text-lg ${resume.atsScore >= 90 ? 'text-green-500 dark:text-green-400' :
                                        resume.atsScore >= 80 ? 'text-blue-500 dark:text-blue-400' : 'text-yellow-500 dark:text-yellow-400'
                                        }`}>
                                        {resume.atsScore}/100
                                    </div>
                                </div>
                                <div className="h-8 w-[1px] bg-border"></div>
                                <button
                                    onClick={() => handleDelete(resume.id)}
                                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setSelectedFile(null); }} title="Upload New Resume">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div
                        onClick={triggerFileSelect}
                        className={`border-2 border-dashed border-border rounded-xl p-8 transition-colors cursor-pointer text-center ${selectedFile ? 'bg-primary/10 border-primary/50' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${selectedFile ? 'text-primary' : 'text-muted'}`} />
                        <p className="text-lg font-medium text-text mb-2">
                            {selectedFile ? selectedFile.name : "Click to browse or drag file here"}
                        </p>
                        <p className="text-sm text-muted">
                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDF, DOCX (Max 5MB)"}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.docx,.doc"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Resume Label (Optional)</label>
                        <input type="text" placeholder="e.g. Frontend Developer Resume" className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none" />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }} className="px-4 py-2 text-muted hover:text-text transition-colors">Cancel</button>
                        <button type="submit" disabled={!selectedFile} className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg">
                            {selectedFile ? 'Upload' : 'Select File'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Resumes;

import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Briefcase, Filter, Plus, Search, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';

const StatusBadge = ({ status }) => {
    const styles = {
        'Applied': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Interviewing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Offer': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const style = styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider border ${style} inline-flex items-center gap-1.5 shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Offer' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`}></span>
            {status}
        </span>
    );
}

const Applications = () => {
    const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedAppForAnalysis, setSelectedAppForAnalysis] = useState(null);
    const [formDefaults, setFormDefaults] = useState({ company: '', position: '', jobUrl: '', logo: '' });
    const [selectedVacancy, setSelectedVacancy] = useState(null);
    const [applications, setApplications] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Analysis State
    const [jobDescription, setJobDescription] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [resumeText, setResumeText] = useState(''); // New state for editable text
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Data in Parallel
                const [appsRes, resumesRes] = await Promise.all([
                    api.get(`/api/applications`).catch(e => ({ data: [] })),
                    api.get(`/api/resumes`).catch(e => ({ data: [] }))
                ]);

                // Validate and Format Applications
                const appsData = Array.isArray(appsRes.data) ? appsRes.data : [];
                const formattedApps = appsData.map(app => ({
                    id: app._id,
                    company: app.company || 'Unknown',
                    position: app.position || 'Unknown',
                    status: app.status || 'Applied',
                    date: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent',
                    logo: app.logo || (app.company ? app.company.charAt(0).toUpperCase() : '?'),
                    jobUrl: app.jobUrl
                }));
                setApplications(formattedApps);

                // Validate and Format Resumes
                const resumesData = Array.isArray(resumesRes.data) ? resumesRes.data : [];
                setResumes(resumesData);

            } catch (error) {
                console.error('Failed to fetch data', error);
                // Fallback to empty arrays in case of critical failure
                setApplications([]);
                setResumes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update resume text when a resume is selected
    useEffect(() => {
        if (selectedResumeId) {
            const selectedResume = resumes.find(r => r._id === selectedResumeId);
            const resumeName = selectedResume?.name || "Candidate";

            // Pre-fill with template, but allow user to edit
            setResumeText(`Resume for ${resumeName}. 
Summary: Experienced Software Engineer with a passion for developing scalable web applications.
Skills: Python, JavaScript, TypeScript, React, Node.js, HTML, CSS, SQL, Docker, Git.
Experience: 
- Senior Developer: Led a team of 5 engineers to build a cloud-native microservices architecture.
- Software Engineer: Developed RESTful APIs using Python and Django.
Education: Bachelor of Science in Computer Science.`);
        } else {
            setResumeText('');
        }
    }, [selectedResumeId, resumes]);

    const openAnalyzeModal = (app) => {
        setSelectedAppForAnalysis(app);

        // Try to find matching mock data to pre-fill description
        const mockCompany = getCompanyData(app.company);
        const vacancy = mockCompany?.vacancies?.find(v => v.title === app.position);

        if (vacancy && vacancy.description) {
            setJobDescription(vacancy.description);
        } else {
            setJobDescription(''); // Clear or default
        }

        setAnalysisResult(null);
        setIsAnalyzeModalOpen(true);
    };

    const handleAnalyze = async () => {
        if (!resumeText || !jobDescription) return;

        setAnalyzing(true);
        try {
            // Use backend proxy instead of direct call
            const { data } = await api.post(`/api/analysis/analyze-resume`, {
                resume_text: resumeText,
                job_description: jobDescription
            });
            setAnalysisResult(data);
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisResult({
                match_score: 0,
                matched_skills: [],
                missing_skills: [],
                suggestions: ["Analysis failed. Please try again later."]
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAddApplication = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const applicationData = {
            company: formData.get('company'),
            position: formData.get('position'),
            status: formData.get('status'),
            jobUrl: formData.get('jobUrl') || '',
            logo: formDefaults.logo || '' // Use logo if available
        };

        try {
            const { data } = await api.post(`/api/applications`, applicationData);

            const newApp = {
                id: data._id,
                company: data.company,
                position: data.position,
                status: data.status,
                date: new Date(data.createdAt).toLocaleDateString(),
                logo: data.logo || data.company.charAt(0).toUpperCase(),
                jobUrl: data.jobUrl
            };

            setApplications(prev => [newApp, ...prev]);
            setIsModalOpen(false);
            setFormDefaults({}); // Reset defaults
        } catch (error) {
            console.error('Failed to add application', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/applications/${id}`);
            setApplications(applications.filter(app => app.id !== id));
        } catch (error) {
            console.error('Failed to delete application', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-text">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-xl font-medium">Loading your applications...</p>
            </div>
        );
    }

    // Mock Data for Companies
    const getCompanyData = (name) => {
        const db = {
            'Google': {
                description: "Organizing the world's information and making it universally accessible and useful.",
                vacancies: [
                    {
                        title: 'Software Engineer, Search',
                        location: 'Mountain View, CA',
                        type: 'Full-time',
                        description: "Join the team that powers the world's most popular search engine. You'll work on distributed systems, information retrieval algorithms, and large-scale data processing. Required skills: C++, Java, Python, Distributed Systems, Algorithms, Data Structures, Linux."
                    },
                    {
                        title: 'Product Manager, Cloud',
                        location: 'Sunnyvale, CA',
                        type: 'Full-time',
                        description: "Define the future of cloud computing. Work with engineering to build products. Requires experience with AWS, GCP, Azure, Kubernetes, and Agile methodology."
                    },
                    {
                        title: 'AI Research Scientist',
                        location: 'London, UK',
                        type: 'Full-time',
                        description: "Advance the state-of-the-art in artificial intelligence. You will conduct research in NLP, Computer Vision, and Reinforcement Learning. proficient in Python, TensorFlow, PyTorch, and reading academic papers."
                    }
                ]
            },
            'Microsoft': {
                description: "Empowering every person and every organization on the planet to achieve more.",
                vacancies: [
                    {
                        title: 'Full Stack Engineer, Azure',
                        location: 'Redmond, WA',
                        type: 'Full-time',
                        description: "Build the next generation of cloud services. Stack: C#, .NET, Azure, React, TypeScript, SQL Server. Experience with Microservices and CI/CD pipelines required."
                    },
                    {
                        title: 'Game Developer, Xbox',
                        location: 'Los Angeles, CA',
                        type: 'Full-time',
                        description: "Create immersive gaming experiences. Requires strong C++, C#, DirectX, or OpenGL skills. Experience with Unity or Unreal Engine is a plus."
                    },
                    {
                        title: 'Data Scientist, LinkedIn',
                        location: 'Sunnyvale, CA',
                        type: 'Full-time',
                        description: "Leverage data to help professionals connect. Skills: Python, SQL, Spark, Hadoop, Machine Learning, Pandas, Scikit-learn."
                    }
                ]
            },
            'Netflix': {
                description: "Entertaining the world with TV shows and movies across a wide variety of genres and languages.",
                vacancies: [
                    { title: 'Senior UI Engineer', location: 'Los Gatos, CA', type: 'Full-time', description: "Build the user interface for Netflix. Expert in JavaScript, React, Node.js, HTML5, CSS3, and Accessibility (a11y)." },
                    { title: 'Platform Engineer', location: 'Remote (US)', type: 'Full-time', description: "Build the infrastructure that powers Netflix. Experience with AWS, Java, Spring Boot, Kafka, Cassandra, and Chaos Engineering." },
                    { title: 'Content Strategy Analyst', location: 'Los Angeles, CA', type: 'Contract', description: "Analyze viewing trends. Proficiency in SQL, Tableau, Excel, and Python for data analysis." }
                ]
            },
            'Amazon': {
                description: "Customer obsession rather than competitor focus, passion for invention, and long-term thinking.",
                vacancies: [
                    { title: 'SDE II, AWS', location: 'Seattle, WA', type: 'Full-time', description: "Design and implement scalable cloud services. Core skills: Java, C++, AWS (EC2, S3, DynamoDB), Distributed Systems, and Object-Oriented Design." },
                    { title: 'Frontend Engineer, Prime', location: 'Austin, TX', type: 'Full-time', description: "Build the shopping experience. Proficient in React, TypeScript, CSS, HTML, and Web Performance optimization." },
                    { title: 'Operations Manager', location: 'Nashville, TN', type: 'Full-time', description: "Lead a team of associates. Skills: Operations Management, Logistics, Supply Chain, Leadership, Six Sigma." }
                ]
            },
            'Apple': {
                description: "Designing the best products and experiences that empower people to do what they love.",
                vacancies: [
                    { title: 'iOS Engineer', location: 'Cupertino, CA', type: 'Full-time', description: "Build apps that define the iOS experience. Expert in Swift, Objective-C, UIKit, SwiftUI, and Xcode." },
                    { title: 'Hardware Engineer', location: 'Austin, TX', type: 'Full-time', description: "Design electronic circuits. Skills: PCB Design, Verilog, FPGA, SystemVerilog, Electrical Engineering." },
                    { title: 'Machine Learning Engineer', location: 'Seattle, WA', type: 'Full-time', description: "Apply machine learning to Siri. Strong Python, C++, TensorFlow, CoreML, and NLP background." }
                ]
            },
            'Meta': {
                description: "Giving people the power to build community and bring the world closer together.",
                vacancies: [
                    { title: 'React Native Developer', location: 'Menlo Park, CA', type: 'Full-time', description: "Build cross-platform mobile apps. Expert in React Native, JavaScript, TypeScript, Redux, and Mobile Development." },
                    { title: 'Product Designer', location: 'New York, NY', type: 'Full-time', description: "Design new features for Instagram. Skills: Figma, Sketch, Prototyping, UI/UX Design, Interaction Design." },
                    { title: 'VR Specialist', location: 'Burlingame, CA', type: 'Full-time', description: "Work on Oculus. C++, Unity, Unreal Engine, 3D Graphics, Computer Vision/SLAM." }
                ]
            },
            'Tesla': {
                description: "Accelerating the world's transition to sustainable energy.",
                vacancies: [
                    { title: 'Autopilot Engineer', location: 'Palo Alto, CA', type: 'Full-time', description: "Develop computer vision algorithms. key skills: Python, C++, PyTorch, Computer Vision, Deep Learning, Linux." },
                    { title: 'Mechanical Design Engineer', location: 'Fremont, CA', type: 'Full-time', description: "Design mechanical components. Proficient in CAD, SolidWorks, CATIA, FEA, and Thermodynamics." },
                    { title: 'Battery Engineer', location: 'Sparks, NV', type: 'Full-time', description: "Design advanced battery cells. Background in Chemical Engineering, Materials Science, Lithium-ion technology." }
                ]
            }
        };

        return db[name] || {
            description: "A leading technology company known for innovation and excellence in its field.",
            vacancies: [
                { title: 'Senior Software Engineer', location: 'Remote', type: 'Full-time', description: "Lead the development of critical software systems. Architect scalable solutions and mentor junior engineers." },
                { title: 'Product Manager', location: 'New York, NY', type: 'Full-time', description: "Own the product lifecycle from conception to launch. Define product strategy and roadmap." },
                { title: 'Data Scientist', location: 'San Francisco, CA', type: 'Full-time', description: "Analyze large datasets to extract insights and drive business decisions." }
            ]
        };
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto space-y-6"
        >
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-text to-muted bg-clip-text text-transparent">Applications</h2>
                    <p className="text-muted mt-1">Manage and track your job applications efficiently.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 bg-card/50 border border-border text-text rounded-xl hover:bg-card hover:border-primary/30 transition-all flex items-center gap-2"
                        onClick={() => {/* Filter logic later */ }}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-lg shadow-primary/20 flex items-center gap-2 transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        Add Application
                    </button>
                </div>
            </div>

            {applications.length === 0 ? (
                <motion.div
                    variants={item}
                    className="text-center py-24 flex flex-col items-center justify-center bg-card/30 border border-dashed border-border rounded-3xl"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Briefcase className="w-10 h-10 text-primary opacity-60" />
                    </div>
                    <h3 className="text-xl font-semibold text-text mb-2">No applications yet</h3>
                    <p className="text-muted mb-8 max-w-sm">Start tracking your journey by adding your first job application.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary font-medium hover:text-primary/80 transition-colors flex items-center gap-2"
                    >
                        Add your first application <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {/* Safe check for map */}
                    {Array.isArray(applications) && applications.map((app) => (
                        <motion.div
                            key={app.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-primary/20 hover:bg-card/60 transition-all group flex flex-col justify-between h-full relative overflow-hidden shadow-lg hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                        >
                            {/* Background Gradient */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none" />

                            <div>
                                <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner flex items-center justify-center text-xl font-bold border border-white/10 text-white overflow-hidden relative">
                                            {/* Logic to show Image or Fallback Letter */}
                                            <img
                                                src={app.logo && app.logo.length > 2 ? app.logo : `https://www.google.com/s2/favicons?domain=${app.company?.toLowerCase()}.com&sz=128`}
                                                alt={app.company}
                                                className="w-full h-full object-contain p-2"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.querySelector('span').style.display = 'block';
                                                }}
                                            />
                                            <span style={{ display: 'none' }} className="absolute inset-0 flex items-center justify-center">
                                                {app.company ? app.company.charAt(0).toUpperCase() : '?'}
                                            </span>
                                            {/* Show span initially only if we suspect image might fail? No, easier to hide image on error. */
                                                /* Actually, standard pattern: Image is visible. on error -> hide img, show span. 
                                                   But to prevent a flash of empty box, we can put the span behind?
                                                   Or just rely on the fact that if src is valid it loads.
                                                   If app.logo is just a letter, the src logic above tries to fetch favicon.
                                                */
                                            }
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text leading-tight group-hover:text-primary transition-colors">{app.company}</h4>
                                            <span className="text-xs text-muted">{app.date}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={app.status} />
                                </div>

                                <div className="mb-6 relative z-10">
                                    <h5 className="text-sm font-medium text-muted uppercase tracking-wide mb-1">Position</h5>
                                    <p className="text-text font-medium truncate" title={app.position}>{app.position}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => openAnalyzeModal(app)}
                                    className="flex-1 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Analyze Match</span>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(app.id);
                                    }}
                                    className="p-2.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Application"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Popular Companies Section */}
            <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-bold text-text mb-6">Explore Top Companies</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { name: 'Google', domain: 'google.com' },
                        { name: 'Microsoft', domain: 'microsoft.com' },
                        { name: 'Netflix', domain: 'netflix.com' },
                        { name: 'Amazon', domain: 'amazon.com' },
                        { name: 'Apple', domain: 'apple.com' },
                        { name: 'Meta', domain: 'meta.com' },
                        { name: 'Tesla', domain: 'tesla.com' },
                        { name: 'Spotify', domain: 'spotify.com' },
                        { name: 'Airbnb', domain: 'airbnb.com' },
                        { name: 'Uber', domain: 'uber.com' },
                        { name: 'Adobe', domain: 'adobe.com' },
                        { name: 'Salesforce', domain: 'salesforce.com' }
                    ].map((company) => (
                        <div
                            key={company.name}
                            onClick={() => {
                                setSelectedCompany(company);
                                setIsCompanyModalOpen(true);
                            }}
                            className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.02] group"
                        >
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`}
                                alt={company.name}
                                className="w-12 h-12 object-contain transition-all opacity-90 group-hover:opacity-100"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            {/* Fallback if image fails */}
                            <div className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center text-primary font-bold hidden">
                                {company.name.charAt(0)}
                            </div>

                            <span className="text-sm font-medium text-muted group-hover:text-text">{company.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Company Details Modal */}
            <Modal isOpen={isCompanyModalOpen} onClose={() => { setIsCompanyModalOpen(false); setSelectedVacancy(null); }} title={selectedCompany?.name || 'Company Details'}>
                {selectedCompany && (
                    <div className="space-y-6">
                        {selectedVacancy ? (
                            // Job Description View
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <button
                                    onClick={() => setSelectedVacancy(null)}
                                    className="flex items-center gap-2 text-sm text-muted hover:text-text mb-4 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    Back to Vacancies
                                </button>

                                <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm max-w-4xl mx-auto">
                                    <h2 className="text-3xl font-bold text-primary text-center mb-8 pb-4 border-b border-border/50">
                                        Job Description - {selectedCompany.name}
                                    </h2>

                                    {/* Job Details Grid */}
                                    <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 mb-10 text-sm">
                                        <span className="font-bold text-primary">Job title:</span>
                                        <span className="text-text font-medium">{selectedVacancy.title}</span>

                                        <span className="font-bold text-primary">Location:</span>
                                        <span className="text-muted">{selectedVacancy.location}</span>

                                        <span className="font-bold text-primary">Terms:</span>
                                        <span className="text-muted">{selectedVacancy.terms || selectedVacancy.type}</span>

                                        <span className="font-bold text-primary">Salary/rate:</span>
                                        <span className="text-muted">{selectedVacancy.salary || "Competitive, based on experience"}</span>

                                        <span className="font-bold text-primary">Requirements:</span>
                                        <span className="text-muted">{selectedVacancy.requirements || "Standard professional requirements apply."}</span>
                                    </div>

                                    {/* About Us */}
                                    <div className="mb-8">
                                        <h4 className="text-lg font-bold text-primary mb-3">About us:</h4>
                                        <p className="text-muted text-sm leading-relaxed">
                                            {selectedVacancy.aboutUs || selectedCompany.description || "We are a leading technology company dedicated to innovation and excellence."}
                                        </p>
                                    </div>

                                    {/* About the Role */}
                                    <div className="mb-8">
                                        <h4 className="text-lg font-bold text-primary mb-3">About the role:</h4>
                                        <p className="text-muted text-sm leading-relaxed">
                                            {selectedVacancy.aboutRole || selectedVacancy.description}
                                        </p>
                                    </div>

                                    {/* Responsibilities */}
                                    <div className="mb-8">
                                        <h4 className="text-lg font-bold text-primary mb-3">Responsibilities:</h4>
                                        <ul className="list-disc list-inside text-muted text-sm space-y-2 pl-2">
                                            {(selectedVacancy.responsibilities || [
                                                "Analyze requirements and design solutions.",
                                                "Collaborate with the team to deliver high-quality software.",
                                                "Troubleshoot and resolve technical issues.",
                                                "Stay updated with emerging technologies."
                                            ]).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Candidate Requirements */}
                                    <div className="mb-10">
                                        <h4 className="text-lg font-bold text-primary mb-3">Candidate requirements:</h4>
                                        <ul className="list-disc list-inside text-muted text-sm space-y-2 pl-2">
                                            {(selectedVacancy.candidateRequirements || [
                                                "Relevant degree or equivalent experience.",
                                                "Strong communication and interpersonal skills.",
                                                "Proven track record in a similar role.",
                                                "Ability to work independently and as part of a team."
                                            ]).map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Call to Action */}
                                    <div className="text-center pt-8 border-t border-border/50">
                                        <h4 className="text-xl font-bold text-primary mb-4">Contact us to apply</h4>
                                        <p className="text-muted text-sm mb-6 max-w-lg mx-auto">
                                            Ready to join our team? Click the button below to start your application process or track this position.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button
                                                onClick={() => {
                                                    // Open careers page only
                                                    window.open(`https://${selectedCompany.domain}/careers`, '_blank');
                                                }}
                                                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
                                            >
                                                Apply Now
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Open tracking modal only
                                                    setFormDefaults({
                                                        company: selectedCompany.name,
                                                        position: selectedVacancy.title,
                                                        jobUrl: `https://${selectedCompany.domain}/careers`,
                                                        logo: `https://www.google.com/s2/favicons?domain=${selectedCompany.domain}&sz=128`
                                                    });
                                                    setIsCompanyModalOpen(false);
                                                    setSelectedVacancy(null);
                                                    setIsModalOpen(true);
                                                }}
                                                className="px-8 py-3 bg-card border border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-semibold transition-all"
                                            >
                                                Track this Role
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Vacancy List View
                            <>
                                <div className="flex flex-col items-center justify-center text-center">
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${selectedCompany.domain}&sz=128`}
                                        alt={selectedCompany.name}
                                        className="w-20 h-20 object-contain mb-4"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <h2 className="text-2xl font-bold text-text">{selectedCompany.name}</h2>
                                    <a href={`https://${selectedCompany.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm mt-1 mb-4">
                                        {selectedCompany.domain}
                                    </a>
                                    <p className="text-muted text-sm max-w-md">
                                        {getCompanyData(selectedCompany.name).description}
                                    </p>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <h4 className="text-lg font-semibold text-text mb-3">Open Vacancies</h4>
                                    <div className="space-y-3">
                                        {getCompanyData(selectedCompany.name).vacancies.map((job, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedVacancy(job)}
                                                className="bg-background/50 border border-border p-4 rounded-lg flex justify-between items-center hover:border-primary/50 hover:bg-background/80 cursor-pointer transition-all group"
                                            >
                                                <div>
                                                    <h5 className="font-medium text-text group-hover:text-primary transition-colors">{job.title}</h5>
                                                    <p className="text-xs text-muted">{job.location} • {job.type}</p>
                                                </div>
                                                <svg className="w-5 h-5 text-muted group-hover:text-primary transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormDefaults({}); }} title="Track New Application">
                <form onSubmit={handleAddApplication} className="space-y-4">
                    {/* Show Logo If Available */}
                    {formDefaults.logo && (
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center p-2">
                                <img
                                    src={formDefaults.logo}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Company Name</label>
                        <input
                            name="company"
                            type="text"
                            defaultValue={formDefaults.company || ''}
                            placeholder="e.g. Google"
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Position</label>
                        <input
                            name="position"
                            type="text"
                            defaultValue={formDefaults.position || ''}
                            placeholder="e.g. Frontend Engineer"
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Job URL</label>
                        <input
                            name="jobUrl"
                            type="url"
                            defaultValue={formDefaults.jobUrl || ''}
                            placeholder="https://..."
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Status</label>
                        <select name="status" className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none">
                            <option value="Applied">Applied</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted hover:text-text transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg">Save Application</button>
                    </div>
                </form>
            </Modal>

            {/* Analysis Modal */}
            <Modal isOpen={isAnalyzeModalOpen} onClose={() => setIsAnalyzeModalOpen(false)} title="Resume Match Analysis">
                <div className="space-y-4">
                    <p className="text-sm text-muted">Analyze your fit for <strong>{selectedAppForAnalysis?.company}</strong> - {selectedAppForAnalysis?.position}</p>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Select Resume</label>
                        <select
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none mb-4"
                        >
                            <option value="">-- Select a Resume --</option>
                            {/* Safe check for map */}
                            {Array.isArray(resumes) && resumes.map(r => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Resume Text Content View/Edit */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Resume Content (Editable)</label>
                        <textarea
                            rows="6"
                            placeholder="Select a resume to load content or paste your text here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none resize-none font-mono text-xs"
                        ></textarea>
                        <p className="text-xs text-muted mt-1">
                            Since we are simulating PDF parsing, please verify or paste your resume text here.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-muted">Job Description</label>
                        <textarea
                            rows="5"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="w-full p-3 rounded-lg bg-background/50 border border-border text-text focus:border-primary focus:outline-none resize-none"
                        ></textarea>
                        <p className="text-xs text-muted mt-1">Paste standard text for best results.</p>
                    </div>

                    {!analysisResult && (
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing || !selectedResumeId || !jobDescription}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                {analyzing ? 'Analyzing...' : 'Analyze Match'}
                            </button>
                        </div>
                    )}

                    {analysisResult && (
                        <div className="mt-6 bg-background/30 rounded-xl p-4 border border-border animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold text-text">Match Score</span>
                                <span className={`text-2xl font-bold ${analysisResult.match_score >= 70 ? 'text-green-500' : analysisResult.match_score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {analysisResult.match_score}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-border rounded-full h-2.5 mb-6">
                                <div className={`h-2.5 rounded-full ${analysisResult.match_score >= 70 ? 'bg-green-500' : analysisResult.match_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${analysisResult.match_score}%` }}></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                                    <h5 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Matched Skills ({analysisResult.matched_skills.length})
                                    </h5>
                                    {analysisResult.matched_skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.matched_skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20 flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted italic">No direct matches found yet.</p>
                                    )}
                                </div>

                                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                                    <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        Missing Skills ({analysisResult.missing_skills.length})
                                    </h5>
                                    {analysisResult.missing_skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.missing_skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted italic">
                                            {analysisResult.match_score > 50 ? "No critical skills missing!" : "No key requirements found in JD to check against."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                                <h5 className="text-sm font-semibold text-primary mb-2">Suggestions</h5>
                                <ul className="text-xs text-text space-y-1">
                                    {analysisResult.suggestions.map((s, i) => (
                                        <li key={i}>• {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="text-xs text-muted hover:text-text underline"
                                >
                                    Analyze Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </motion.div>
    );
};

export default Applications;

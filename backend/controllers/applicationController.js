const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const axios = require('axios');

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res) => {
    const applications = await Application.find({ user: req.user._id })
        .populate('resumeId', 'name atsScore')
        .sort({ createdAt: -1 })
        .lean();
    res.json(applications);
});

// @desc    Add new application
// @route   POST /api/applications
// @access  Private
const addApplication = asyncHandler(async (req, res) => {
    const {
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
        resumeId
    } = req.body;

    const initialStatus = status || 'Applied';

    const application = await Application.create({
        user: req.user._id,
        company: company || 'Untitled Opportunity',
        position: position || 'Role Pending',
        status: initialStatus,
        jobUrl: jobUrl || '',
        logo: company ? company.charAt(0).toUpperCase() : '?',
        location: location || '',
        salary: salary || '',
        source: source || 'Direct',
        notes: notes || '',
        skills: Array.isArray(skills) ? skills : [],
        contacts: Array.isArray(contacts) ? contacts : [],
        resumeId: resumeId || null,
        statusTimeline: [{
            status: initialStatus,
            date: new Date(),
            notes: notes ? `Added: ${notes.slice(0, 80)}` : 'Application created'
        }]
    });

    if (application) {
        res.status(201).json(application);
    } else {
        res.status(400);
        throw new Error('Invalid application data');
    }
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id);

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    // Check ownership
    if (application.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const {
        company,
        position,
        status,
        jobUrl,
        logo,
        location,
        salary,
        source,
        notes,
        skills,
        contacts,
        resumeId
    } = req.body;

    if (company !== undefined) application.company = company;
    if (position !== undefined) application.position = position;
    if (jobUrl !== undefined) application.jobUrl = jobUrl;
    if (logo !== undefined) application.logo = logo;
    if (location !== undefined) application.location = location;
    if (salary !== undefined) application.salary = salary;
    if (source !== undefined) application.source = source;
    if (notes !== undefined) application.notes = notes;
    if (skills !== undefined) application.skills = skills;
    if (contacts !== undefined) application.contacts = contacts;
    if (resumeId !== undefined) application.resumeId = resumeId || null;

    // Track status change in timeline
    if (status !== undefined && status !== application.status) {
        application.status = status;
        if (!application.statusTimeline) {
            application.statusTimeline = [];
        }
        application.statusTimeline.push({
            status,
            date: new Date(),
            notes: notes ? `Moved to ${status}: ${notes.slice(0, 80)}` : `Moved to ${status}`
        });
    }

    const updated = await application.save();
    res.json(updated);
});

// @desc    Extract company, role, skills, salary, location from job description text or URL
// @route   POST /api/applications/extract
// @access  Private
const extractFromJobDescription = asyncHandler(async (req, res) => {
    let { text, url } = req.body;
    let rawContent = text || '';

    // If URL is provided and text is sparse, attempt to fetch URL content or parse domain
    let extractedCompanyFromUrl = '';
    if (url) {
        try {
            const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            const hostParts = parsedUrl.hostname.replace('www.', '').split('.');
            if (hostParts.length > 0) {
                // e.g. jobs.lever.co/company or boards.greenhouse.io/company
                if (parsedUrl.hostname.includes('lever.co') || parsedUrl.hostname.includes('greenhouse.io')) {
                    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
                    if (pathSegments.length > 0) {
                        extractedCompanyFromUrl = pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
                    }
                } else {
                    extractedCompanyFromUrl = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
                }
            }

            if (!rawContent || rawContent.length < 50) {
                const response = await axios.get(parsedUrl.href, {
                    timeout: 4000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (response.data && typeof response.data === 'string') {
                    // Strip HTML tags for clean parsing
                    rawContent = response.data
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .slice(0, 10000);
                }
            }
        } catch (err) {
            console.warn('URL fetch fallback in extractor:', err.message);
        }
    }

    // Common skills catalog
    const skillCatalog = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++',
        'Go', 'Rust', 'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'GCP', 'Azure', 'Docker',
        'Kubernetes', 'GraphQL', 'REST APIs', 'Git', 'CI/CD', 'Next.js', 'Tailwind CSS',
        'Redis', 'Kafka', 'System Design', 'Microservices', 'Linux', 'Machine Learning',
        'Data Engineering', 'Agile', 'Scrum', 'Figma', 'Product Strategy'
    ];

    const detectedSkills = skillCatalog.filter(skill =>
        new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rawContent)
    );

    // Extract Role / Position
    const commonRoles = [
        'Senior Software Engineer', 'Software Engineer', 'Frontend Engineer', 'Backend Engineer',
        'Full Stack Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer',
        'Staff Engineer', 'Engineering Manager', 'UI/UX Designer', 'Mobile Engineer',
        'Machine Learning Engineer', 'Security Engineer', 'QA Engineer', 'Solutions Architect'
    ];
    let detectedPosition = '';
    for (const role of commonRoles) {
        if (new RegExp(`\\b${role}\\b`, 'i').test(rawContent)) {
            detectedPosition = role;
            break;
        }
    }

    // Role regex heuristic if not matched in common list
    if (!detectedPosition) {
        const titleMatch = rawContent.match(/(?:title|role|position)[:\s]+([A-Z][A-Za-z0-9\s/-]{3,40})/i);
        if (titleMatch && titleMatch[1]) {
            detectedPosition = titleMatch[1].trim();
        }
    }

    // Extract Company
    let detectedCompany = extractedCompanyFromUrl;
    if (!detectedCompany) {
        const companyMatch = rawContent.match(/(?:about|at|join)\s+([A-Z][A-Za-z0-9&.\s]{2,30})/);
        if (companyMatch && companyMatch[1]) {
            detectedCompany = companyMatch[1].replace(/\s+(?:is|to|a|an|the|in|for|with|where|our|and).*/i, '').trim();
        }
    }

    // Extract Salary
    let detectedSalary = '';
    const salaryMatch = rawContent.match(/(?:\$|USD\s*)\d{2,3}(?:,\d{3})*(?:k)?\s*(?:-|–|to)\s*(?:\$|USD\s*)?\d{2,3}(?:,\d{3})*(?:k)?/i);
    if (salaryMatch) {
        detectedSalary = salaryMatch[0].trim();
    } else {
        const singleSalary = rawContent.match(/(?:\$|USD\s*)\d{2,3}(?:,\d{3})*(?:k)?\s*(?:\/yr|per year|annually)/i);
        if (singleSalary) {
            detectedSalary = singleSalary[0].trim();
        }
    }

    // Extract Location
    let detectedLocation = 'Remote';
    if (/hybrid/i.test(rawContent)) {
        detectedLocation = 'Hybrid';
    } else if (/(?:in-office|on-site|onsite)/i.test(rawContent)) {
        detectedLocation = 'On-site';
    }
    const cityMatch = rawContent.match(/\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|London|Berlin|Toronto|Remote)\b/i);
    if (cityMatch) {
        detectedLocation = detectedLocation === 'Remote' ? cityMatch[1] : `${cityMatch[1]} (${detectedLocation})`;
    }

    res.json({
        company: detectedCompany || 'Target Company',
        position: detectedPosition || 'Software Engineer',
        skills: detectedSkills.slice(0, 10),
        salary: detectedSalary || '$120,000 - $150,000',
        location: detectedLocation || 'Remote',
        jobUrl: url || '',
        source: url?.includes('linkedin') ? 'LinkedIn' : url?.includes('indeed') ? 'Indeed' : 'Job Board'
    });
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res) => {
    const application = await Application.findById(req.params.id);

    if (application) {
        // Check if user owns the application
        if (application.user.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('User not authorized');
        }

        await application.deleteOne();
        res.json({ message: 'Application removed' });
    } else {
        res.status(404);
        throw new Error('Application not found');
    }
});

module.exports = {
    getApplications,
    addApplication,
    updateApplication,
    extractFromJobDescription,
    deleteApplication
};

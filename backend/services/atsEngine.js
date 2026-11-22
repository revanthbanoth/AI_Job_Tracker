const crypto = require('crypto');
const taxonomy = require('../data/skillsTaxonomy.json');

// In-memory score cache by SHA-256 hash of (resumeText + jobDescription)
const scoreCache = new Map();

/**
 * Computes a SHA-256 hash of a string or buffer.
 */
function computeHash(content) {
    return crypto.createHash('sha256').update(content || '').digest('hex');
}

/**
 * Normalizes text to lowercase tokens and removes extra punctuation.
 */
function cleanText(text = '') {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

/**
 * Extracts bullet points from a resume text.
 */
function extractBullets(text = '') {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const bullets = [];

    const bulletRegex = /^([•\-*–—►■]|\d+\.|\([a-z\d]+\))\s*(.+)$/i;

    for (const line of lines) {
        const match = line.match(bulletRegex);
        if (match && match[2]) {
            bullets.push(match[2].trim());
        } else if (line.length > 25 && /^[A-Z]/.test(line) && !line.endsWith(':') && line.split(' ').length > 4) {
            // Check if it reads like an experience sentence
            bullets.push(line);
        }
    }

    return bullets;
}

/**
 * Identifies standard sections in the resume.
 */
function detectSections(text = '') {
    const lower = text.toLowerCase();
    const lines = lower.split('\n').map(l => l.trim()).filter(Boolean);
    const foundSections = {};

    for (const [sectionKey, synonyms] of Object.entries(taxonomy.sectionSynonyms)) {
        foundSections[sectionKey] = false;
        for (const line of lines) {
            // Check if line looks like a header (short line <= 40 chars matching synonym)
            if (line.length <= 40) {
                for (const syn of synonyms) {
                    const regex = new RegExp(`(^|#+|[*_]+)\\s*${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([:*_]*)$`, 'i');
                    if (regex.test(line)) {
                        foundSections[sectionKey] = true;
                        break;
                    }
                }
            }
            if (foundSections[sectionKey]) break;
        }
    }

    return foundSections;
}

/**
 * Identifies skills present in text using the canonical taxonomy and aliases.
 */
function matchSkills(text = '') {
    const lower = text.toLowerCase();
    const matched = [];
    const matchedCanonicalSet = new Set();

    for (const item of taxonomy.skills) {
        let isMatch = false;
        let matchedAlias = item.canonical;

        // Check canonical first
        const canonicalRegex = new RegExp(`\\b${item.canonical.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (canonicalRegex.test(lower)) {
            isMatch = true;
        } else {
            // Check aliases
            for (const alias of item.aliases) {
                // For very short aliases like 'c' or 'r', require exact boundaries
                const aliasRegex = new RegExp(`\\b${alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (aliasRegex.test(lower)) {
                    isMatch = true;
                    matchedAlias = alias;
                    break;
                }
            }
        }

        if (isMatch && !matchedCanonicalSet.has(item.canonical)) {
            matchedCanonicalSet.add(item.canonical);
            matched.push({
                canonical: item.canonical,
                category: item.category,
                matchedTerm: matchedAlias
            });
        }
    }

    return matched;
}

/**
 * Extracts contact information: email, phone, and professional links.
 */
function extractContacts(text = '') {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    const hasLinkedIn = /linkedin\.com\/(?:in|profile)\/[a-zA-Z0-9_-]+/i.test(text) || /linkedin/i.test(text);
    const hasGitHub = /github\.com\/[a-zA-Z0-9_-]+/i.test(text);
    const hasPortfolio = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:dev|me|io|design|tech|com)\b/i.test(text);

    return {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        links: {
            linkedIn: hasLinkedIn,
            github: hasGitHub,
            portfolio: hasPortfolio || hasGitHub || hasLinkedIn
        }
    };
}

/**
 * Detects buzzword fluff.
 */
function detectBuzzwords(text = '') {
    const lower = text.toLowerCase();
    const foundBuzzwords = [];

    for (const word of taxonomy.buzzwords) {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
            foundBuzzwords.push(word);
        }
    }

    return foundBuzzwords;
}

/**
 * Evaluates Resume Health (0 - 100)
 */
function computeResumeHealth(text = '', formatAnomalies = [], wordCount = 0, pageCount = 1) {
    const deductions = [];
    const breakdown = {
        parsability: { score: 25, max: 25 },
        bulletQuality: { score: 25, max: 25 },
        sections: { score: 15, max: 15 },
        contact: { score: 10, max: 10 },
        skillsQuality: { score: 10, max: 10 },
        language: { score: 10, max: 10 },
        lengthDensity: { score: 5, max: 5 }
    };

    const bullets = extractBullets(text);
    const sections = detectSections(text);
    const contacts = extractContacts(text);
    const matchedSkills = matchSkills(text);
    const buzzwords = detectBuzzwords(text);

    // 1. Parsability and format (25 pts)
    const isScanned = formatAnomalies.some(a => a.type === 'scanned_image');
    const isMultiColumn = formatAnomalies.some(a => a.type === 'multi_column');
    const hasTables = formatAnomalies.some(a => a.type === 'table_layout');

    if (isScanned) {
        breakdown.parsability.score -= 15;
        deductions.push({
            category: 'Parsability & Format',
            pointsDeducted: 15,
            reason: 'Scanned image-based document detected',
            fix: 'Save your resume as a text-based PDF or DOCX file, not an exported image scan.'
        });
    }

    if (isMultiColumn) {
        breakdown.parsability.score -= 5;
        deductions.push({
            category: 'Parsability & Format',
            pointsDeducted: 5,
            reason: 'Multi-column layout detected',
            fix: 'Use a clean single-column layout so ATS screeners read top-to-bottom without scrambling lines.'
        });
    }

    if (hasTables) {
        breakdown.parsability.score -= 5;
        deductions.push({
            category: 'Parsability & Format',
            pointsDeducted: 5,
            reason: 'Complex table formatting detected',
            fix: 'Replace HTML or Word tables with clean bullet points and standard tab indentation.'
        });
    }
    breakdown.parsability.score = Math.max(0, breakdown.parsability.score);

    // 2. Bullet Quality (25 pts)
    if (bullets.length === 0) {
        breakdown.bulletQuality.score -= 20;
        deductions.push({
            category: 'Bullet Quality',
            pointsDeducted: 20,
            reason: 'No clear bullet points found in work history',
            fix: 'Break down your roles into 3-5 distinct bullet points starting with strong action verbs.'
        });
    } else {
        // Action Verbs (8 pts)
        let actionVerbCount = 0;
        for (const b of bullets) {
            const firstWord = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
            if (firstWord && taxonomy.actionVerbs.includes(firstWord)) {
                actionVerbCount++;
            }
        }
        const actionVerbRatio = actionVerbCount / bullets.length;
        if (actionVerbRatio < 0.5) {
            const loss = Math.round((0.5 - actionVerbRatio) * 16);
            const penalty = Math.min(8, Math.max(3, loss));
            breakdown.bulletQuality.score -= penalty;
            deductions.push({
                category: 'Bullet Quality',
                pointsDeducted: penalty,
                reason: `Only ${Math.round(actionVerbRatio * 100)}% of bullets begin with strong action verbs`,
                fix: 'Begin each bullet with active verbs (e.g., "Architected", "Engineered", "Optimized", "Spearheaded").'
            });
        }

        // Quantified Metrics (9 pts)
        let metricCount = 0;
        const metricRegex = /(\b\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?(?:k|m|b)?|\b\d+x\b|\b\d{2,}(?:\+)?\s*(?:users|clients|customers|requests|queries|engineers|team members|ms|seconds|hours))/i;
        for (const b of bullets) {
            if (metricRegex.test(b)) {
                metricCount++;
            }
        }
        const metricRatio = metricCount / bullets.length;
        if (metricRatio < 0.35) {
            const penalty = metricCount === 0 ? 9 : 5;
            breakdown.bulletQuality.score -= penalty;
            deductions.push({
                category: 'Bullet Quality',
                pointsDeducted: penalty,
                reason: `Only ${Math.round(metricRatio * 100)}% of bullets contain quantified metrics`,
                fix: 'Quantify your impact with measurable outcomes, such as % performance gains, team size, or revenue impact.'
            });
        }

        // Length (4 pts: ~10 to 35 words per bullet)
        let improperLengthCount = 0;
        for (const b of bullets) {
            const count = b.split(/\s+/).length;
            if (count < 6 || count > 45) {
                improperLengthCount++;
            }
        }
        if (improperLengthCount / bullets.length > 0.3) {
            breakdown.bulletQuality.score -= 4;
            deductions.push({
                category: 'Bullet Quality',
                pointsDeducted: 4,
                reason: 'Several bullets are too brief or overly lengthy paragraphs',
                fix: 'Keep bullets focused between 1 to 2 lines (~12 to 30 words) for optimal ATS readability.'
            });
        }

        // First-person pronouns (4 pts: I, me, my, we, our)
        let pronounCount = 0;
        const pronounRegex = /\b(i|me|my|we|our|myself|ourselves)\b/i;
        for (const b of bullets) {
            if (pronounRegex.test(b)) {
                pronounCount++;
            }
        }
        if (pronounCount > 0) {
            breakdown.bulletQuality.score -= 4;
            deductions.push({
                category: 'Bullet Quality',
                pointsDeducted: 4,
                reason: `First-person pronouns detected in ${pronounCount} bullet(s) ("I", "me", "my", "we")`,
                fix: 'Remove all first-person pronouns; start directly with the action verb (e.g., "Led team of..." instead of "I led...").'
            });
        }
    }
    breakdown.bulletQuality.score = Math.max(0, breakdown.bulletQuality.score);

    // 3. Standard Sections & Headings (15 pts)
    if (!sections.experience) {
        breakdown.sections.score -= 6;
        deductions.push({
            category: 'Sections & Structure',
            pointsDeducted: 6,
            reason: 'Missing recognizable Experience / Work History heading',
            fix: 'Add a standard section header like "Professional Experience" or "Work History".'
        });
    }
    if (!sections.skills) {
        breakdown.sections.score -= 4;
        deductions.push({
            category: 'Sections & Structure',
            pointsDeducted: 4,
            reason: 'Missing dedicated Skills section heading',
            fix: 'Add a distinct "Technical Skills" heading grouping your languages and technologies.'
        });
    }
    if (!sections.education) {
        breakdown.sections.score -= 3;
        deductions.push({
            category: 'Sections & Structure',
            pointsDeducted: 3,
            reason: 'Missing Education section heading',
            fix: 'Add an "Education" section listing degree, institution, and graduation year.'
        });
    }
    if (!sections.summary) {
        breakdown.sections.score -= 2;
        deductions.push({
            category: 'Sections & Structure',
            pointsDeducted: 2,
            reason: 'Missing Professional Summary / Profile section',
            fix: 'Include a concise 2-3 line Professional Summary highlighting your key specialization and years of experience.'
        });
    }
    breakdown.sections.score = Math.max(0, breakdown.sections.score);

    // 4. Contact and Links (10 pts)
    if (!contacts.email) {
        breakdown.contact.score -= 4;
        deductions.push({
            category: 'Contact & Links',
            pointsDeducted: 4,
            reason: 'No valid email address found',
            fix: 'Ensure your email address is clearly visible at the top of your resume.'
        });
    }
    if (!contacts.phone) {
        breakdown.contact.score -= 3;
        deductions.push({
            category: 'Contact & Links',
            pointsDeducted: 3,
            reason: 'No phone number detected',
            fix: 'Include your phone number with country/area code in the header.'
        });
    }
    if (!contacts.links.portfolio) {
        breakdown.contact.score -= 3;
        deductions.push({
            category: 'Contact & Links',
            pointsDeducted: 3,
            reason: 'No professional profile link (LinkedIn or GitHub) detected',
            fix: 'Add your LinkedIn or GitHub profile URL to your contact header.'
        });
    }
    breakdown.contact.score = Math.max(0, breakdown.contact.score);

    // 5. Skills Section Quality (10 pts)
    if (matchedSkills.length < 5) {
        const penalty = matchedSkills.length === 0 ? 8 : 4;
        breakdown.skillsQuality.score -= penalty;
        deductions.push({
            category: 'Skills Quality',
            pointsDeducted: penalty,
            reason: `Only ${matchedSkills.length} standardized technical skills recognized`,
            fix: 'List core technical competencies using standard industry names (e.g., JavaScript, Docker, AWS).'
        });
    } else if (matchedSkills.length > 55) {
        breakdown.skillsQuality.score -= 4;
        deductions.push({
            category: 'Skills Quality',
            pointsDeducted: 4,
            reason: 'Keyword stuffing detected (> 55 skills listed)',
            fix: 'Focus your skills section on 15 to 30 technologies most relevant to your target role.'
        });
    }
    breakdown.skillsQuality.score = Math.max(0, breakdown.skillsQuality.score);

    // 6. Language & Fluff (10 pts)
    if (buzzwords.length > 0) {
        const penalty = Math.min(6, buzzwords.length * 2);
        breakdown.language.score -= penalty;
        deductions.push({
            category: 'Language & Fluff',
            pointsDeducted: penalty,
            reason: `Subjective buzzwords detected: "${buzzwords.join('", "')}"`,
            fix: 'Replace subjective buzzwords ("hard worker", "results-driven") with objective technical accomplishments.'
        });
    }
    breakdown.language.score = Math.max(0, breakdown.language.score);

    // 7. Length and Density (5 pts)
    if (wordCount > 0 && (wordCount < 250 || wordCount > 1300)) {
        breakdown.lengthDensity.score -= 3;
        deductions.push({
            category: 'Length & Density',
            pointsDeducted: 3,
            reason: wordCount < 250 ? 'Resume content is unusually brief (< 250 words)' : 'Resume is excessively lengthy (> 1300 words)',
            fix: 'Aim for a balanced word count between 400 and 800 words (1-2 pages).'
        });
    }
    breakdown.lengthDensity.score = Math.max(0, breakdown.lengthDensity.score);

    // Calculate total score
    const totalHealthScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

    return {
        score: Math.min(100, Math.max(0, totalHealthScore)),
        breakdown,
        deductions,
        matchedSkills,
        buzzwords,
        contacts,
        bulletsCount: bullets.length
    };
}

/**
 * Evaluates Job Match (0 - 100) comparing a resume against a target job description.
 */
function computeJobMatch(resumeText = '', jobDescriptionText = '', resumeSkills = []) {
    const deductions = [];
    const breakdown = {
        requiredSkills: { score: 40, max: 40 },
        titleAlignment: { score: 15, max: 15 },
        experienceSeniority: { score: 15, max: 15 },
        preferredSkills: { score: 10, max: 10 },
        keywordsInBullets: { score: 10, max: 10 },
        education: { score: 5, max: 5 },
        softDomain: { score: 5, max: 5 }
    };

    if (!jobDescriptionText || jobDescriptionText.trim().length < 20) {
        return {
            score: null,
            breakdown: null,
            deductions: [],
            matchedKeywords: [],
            missingKeywords: []
        };
    }

    const jdSkills = matchSkills(jobDescriptionText);
    const resumeSkillsCanonical = new Set(resumeSkills.map(s => s.canonical));

    const matchedKeywords = [];
    const missingKeywords = [];

    // 1. Required Skills Coverage (40 pts)
    if (jdSkills.length > 0) {
        for (const skill of jdSkills) {
            const inResume = resumeSkillsCanonical.has(skill.canonical);
            const inBullets = new RegExp(`\\b${skill.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText);

            if (inResume) {
                matchedKeywords.push({
                    canonical: skill.canonical,
                    category: skill.category,
                    inBullets
                });
            } else {
                missingKeywords.push({
                    canonical: skill.canonical,
                    category: skill.category,
                    importance: 'required'
                });
            }
        }

        const coverageRatio = matchedKeywords.length / jdSkills.length;
        breakdown.requiredSkills.score = Math.round(coverageRatio * 40);

        if (coverageRatio < 0.8) {
            const pointsLost = 40 - breakdown.requiredSkills.score;
            deductions.push({
                category: 'Required Skills Match',
                pointsDeducted: pointsLost,
                reason: `Missing ${missingKeywords.length} key skill(s) mentioned in JD: ${missingKeywords.slice(0, 4).map(s => s.canonical).join(', ')}`,
                fix: 'Incorporate missing skills into your technical skills summary or project bullets if you have experience with them.'
            });
        }
    } else {
        // If JD has no recognized skills, default to full score
        breakdown.requiredSkills.score = 35;
    }

    // 2. Title Alignment (15 pts)
    const titleRegex = /(?:title|position|role|for\s+a)\s+([A-Z][A-Za-z0-9\s/-]{4,35})/i;
    const jdTitleMatch = jobDescriptionText.match(titleRegex);
    const targetTitle = jdTitleMatch ? jdTitleMatch[1].trim().toLowerCase() : '';
    
    let titleAligned = false;
    if (targetTitle) {
        const titleKeywords = targetTitle.split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'senior', 'lead', 'staff'].includes(w));
        let hits = 0;
        for (const kw of titleKeywords) {
            if (new RegExp(`\\b${kw}\\b`, 'i').test(resumeText)) {
                hits++;
            }
        }
        titleAligned = titleKeywords.length > 0 && hits >= Math.ceil(titleKeywords.length * 0.6);
    } else {
        // Fallback: check for engineer/developer/manager overlap
        const commonTitles = ['software engineer', 'frontend', 'backend', 'full stack', 'data scientist', 'devops', 'product manager'];
        for (const t of commonTitles) {
            if (new RegExp(`\\b${t}\\b`, 'i').test(jobDescriptionText) && new RegExp(`\\b${t}\\b`, 'i').test(resumeText)) {
                titleAligned = true;
                break;
            }
        }
    }

    if (!titleAligned) {
        breakdown.titleAlignment.score -= 8;
        deductions.push({
            category: 'Title Alignment',
            pointsDeducted: 8,
            reason: 'Target role title not clearly mirrored in resume headline or past job titles',
            fix: 'Align your resume headline and current title with the target position.'
        });
    }

    // 3. Experience & Seniority (15 pts)
    const isSeniorJd = /\b(senior|lead|principal|staff|architect|director|5\+|7\+|10\+)\b/i.test(jobDescriptionText);
    const isSeniorResume = /\b(senior|lead|principal|staff|architect|5\+|7\+|10\+|managed|mentored)\b/i.test(resumeText);

    if (isSeniorJd && !isSeniorResume) {
        breakdown.experienceSeniority.score -= 7;
        deductions.push({
            category: 'Seniority Alignment',
            pointsDeducted: 7,
            reason: 'Job description requires senior-level scope, but resume lacks senior leadership indicators',
            fix: 'Emphasize architectural decisions, cross-functional leadership, and mentorship of junior engineers.'
        });
    }

    // 4. Preferred Skills (10 pts)
    const preferredSectionMatch = jobDescriptionText.match(/(?:preferred|nice to have|plus|bonus)[:\s]+([^.]+)/i);
    if (preferredSectionMatch && preferredSectionMatch[1]) {
        const preferredText = preferredSectionMatch[1];
        const prefSkills = matchSkills(preferredText);
        if (prefSkills.length > 0) {
            const prefMatched = prefSkills.filter(s => resumeSkillsCanonical.has(s.canonical));
            const ratio = prefMatched.length / prefSkills.length;
            breakdown.preferredSkills.score = Math.round(ratio * 10);
            if (ratio < 0.5) {
                deductions.push({
                    category: 'Preferred Skills',
                    pointsDeducted: 10 - breakdown.preferredSkills.score,
                    reason: `Lacks bonus skills listed in job posting: ${prefSkills.slice(0, 3).map(s => s.canonical).join(', ')}`,
                    fix: 'Add any relevant secondary skills or side projects highlighting bonus criteria.'
                });
            }
        }
    }

    // 5. Keywords Used in Bullets, Not Just the Skills List (10 pts)
    const skillsInBullets = matchedKeywords.filter(k => k.inBullets).length;
    const bulletSkillRatio = matchedKeywords.length > 0 ? skillsInBullets / matchedKeywords.length : 1;
    breakdown.keywordsInBullets.score = Math.round(bulletSkillRatio * 10);
    if (bulletSkillRatio < 0.5) {
        const loss = 10 - breakdown.keywordsInBullets.score;
        deductions.push({
            category: 'Bullet Context & Keyword Placement',
            pointsDeducted: loss,
            reason: 'Keywords appear only in the skills list, not embedded within work experience bullets',
            fix: 'Contextualize technologies directly inside bullet descriptions showing real application.'
        });
    }

    // 6. Education Alignment (5 pts)
    const requiresDegree = /\b(bachelor|master|degree|bs|ms|phd|computer science)\b/i.test(jobDescriptionText);
    const hasDegree = /\b(bachelor|master|b\.s\.|m\.s\.|bs|ms|computer science|engineering|degree)\b/i.test(resumeText);
    if (requiresDegree && !hasDegree) {
        breakdown.education.score -= 3;
        deductions.push({
            category: 'Education Alignment',
            pointsDeducted: 3,
            reason: 'Job description requires or mentions relevant degree, but none was detected',
            fix: 'Ensure your degree, institution, and major are listed in a distinct Education section.'
        });
    }

    // 7. Soft / Domain Terms (5 pts)
    let softHits = 0;
    for (const term of taxonomy.softSkills) {
        if (new RegExp(`\\b${term}\\b`, 'i').test(jobDescriptionText) && new RegExp(`\\b${term}\\b`, 'i').test(resumeText)) {
            softHits++;
        }
    }
    breakdown.softDomain.score = Math.min(5, softHits * 2 + 1);

    const totalJobMatch = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

    return {
        score: Math.min(100, Math.max(0, totalJobMatch)),
        breakdown,
        deductions,
        matchedKeywords,
        missingKeywords
    };
}

/**
 * Generates automated "Fix it" bullet rewrite suggestions for bullets lacking action verbs or metrics.
 */
function generateBulletFixSuggestions(text = '') {
    const bullets = extractBullets(text);
    const suggestions = [];

    const actionVerbs = taxonomy.actionVerbs;
    const sampleReplacements = [
        { originalRegex: /^(?:worked on|helped with|responsible for|assisted in)\s+(.+)/i, action: 'Engineered and optimized' },
        { originalRegex: /^(?:participated in|contributed to)\s+(.+)/i, action: 'Co-spearheaded development of' },
        { originalRegex: /^(?:handled|did)\s+(.+)/i, action: 'Orchestrated end-to-end execution of' },
        { originalRegex: /^i\s+(?:developed|built|created)\s+(.+)/i, action: 'Architected and deployed' }
    ];

    for (const b of bullets) {
        let rewritten = null;
        for (const rule of sampleReplacements) {
            if (rule.originalRegex.test(b)) {
                const rest = b.replace(rule.originalRegex, '$1');
                rewritten = `${rule.action} ${rest}, improving system performance by 25% and reducing processing latency.`;
                break;
            }
        }

        // If no action verb, suggest adding one
        const firstWord = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
        if (!rewritten && firstWord && !actionVerbs.includes(firstWord) && b.length > 20) {
            rewritten = `Accelerated project milestones by leading the implementation of ${b.charAt(0).toLowerCase() + b.slice(1)}, delivering results 2 weeks ahead of schedule.`;
        }

        if (rewritten && suggestions.length < 3) {
            suggestions.push({
                original: b,
                suggestion: rewritten,
                status: 'pending' // 'pending' | 'accepted' | 'rejected'
            });
        }
    }

    return suggestions;
}

/**
 * Main deterministic score runner.
 * Computes:
 * - Resume Health (0-100)
 * - Job Match (0-100) if jobDescription is provided
 * - Overall combined score: 30% Health + 70% Match (or 100% Health if no JD)
 * - Transparent deduction list
 * - Caches result by SHA-256 hash
 */
function analyzeResumeDeterministic(resumeText = '', jobDescriptionText = '', formatAnomalies = [], wordCount = 0, pageCount = 1) {
    const normalizedResume = cleanText(resumeText);
    const normalizedJd = cleanText(jobDescriptionText);

    // Compute hash for repeatable caching
    const inputHash = computeHash(`${normalizedResume}:::${normalizedJd}:::${JSON.stringify(formatAnomalies)}`);
    if (scoreCache.has(inputHash)) {
        return scoreCache.get(inputHash);
    }

    const healthResult = computeResumeHealth(normalizedResume, formatAnomalies, wordCount, pageCount);
    const matchResult = computeJobMatch(normalizedResume, normalizedJd, healthResult.matchedSkills);
    const bulletFixes = generateBulletFixSuggestions(normalizedResume);

    let overallScore = healthResult.score;
    if (matchResult.score !== null) {
        overallScore = Math.round((healthResult.score * 0.3) + (matchResult.score * 0.7));
    }

    const combinedDeductions = [
        ...healthResult.deductions,
        ...matchResult.deductions
    ];

    const result = {
        fileHash: inputHash,
        healthScore: healthResult.score,
        matchScore: matchResult.score,
        overallScore,
        healthBreakdown: healthResult.breakdown,
        matchBreakdown: matchResult.breakdown,
        deductions: combinedDeductions,
        matchedKeywords: matchResult.matchedKeywords || [],
        missingKeywords: matchResult.missingKeywords || [],
        recognizedSkills: healthResult.matchedSkills.map(s => s.canonical),
        buzzwords: healthResult.buzzwords,
        bulletFixes,
        timestamp: new Date().toISOString()
    };

    // Cache the deterministic result
    scoreCache.set(inputHash, result);

    return result;
}

module.exports = {
    computeHash,
    cleanText,
    extractBullets,
    detectSections,
    matchSkills,
    extractContacts,
    detectBuzzwords,
    computeResumeHealth,
    computeJobMatch,
    generateBulletFixSuggestions,
    analyzeResumeDeterministic
};

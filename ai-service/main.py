from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str

class AnalyzeResponse(BaseModel):
    match_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    suggestions: List[str]

# Common tech skills dictionary for extraction
SKILLS_DB = {
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c", "c#", "go", "rust", "swift", "kotlin", "php", "ruby", "scala", "perl", "bash", "shell", "r", "matlab", "dart", "lua", "haskell", "assembly", "vba",
    # Frontend
    "react", "angular", "vue", "vue.js", "next.js", "nuxt.js", "svelte", "jquery", "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind", "bootstrap", "material ui", "chakra ui", "webpack", "vite", "babel", "redux", "mobx", "context api", "rxjs",
    # Backend
    "node.js", "node", "express", "express.js", "django", "flask", "fastapi", "spring", "spring boot", "asp.net", ".net", "rails", "laravel", "symfony", "codeigniter", "graphql", "rest", "restful", "grpc", "websockets", "socket.io", "rabbitmq", "kafka", "redis",
    # Database
    "sql", "mysql", "postgresql", "postgres", "mongodb", "mongoose", "dynamodb", "firebase", "firestore", "cassandra", "mariadb", "oracle", "sql server", "sqlite", "elasticsearch", "neo4j", "realm",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "jenkins", "gitlab ci", "github actions", "circleci", "travis ci", "terraform", "ansible", "chef", "puppet", "vagrant", "prometheus", "grafana", "elk stack", "splunk", "linux", "unix", "ubuntu", "centos", "nginx", "apache", "serverless", "lambda",
    # Mobile
    "react native", "flutter", "ios", "android", "xamarin", "ionic", "cordova",
    # Data Science & AI
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy", "scipy", "matplotlib", "seaborn", "opencv", "big data", "hadoop", "spark", "airflow", "jupyter",
    # Tools & Methods
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello", "asana", "agile", "scrum", "kanban", "waterfall", "tdd", "bdd", "ci/cd", "devops", "json", "xml", "yaml", "markdown", "postman", "swagger", "figma", "sketch", "adobe xd",
    # Soft Skills & General
    "leadership", "communication", "teamwork", "collaboration", "problem solving", "critical thinking", "adaptability", "mentoring", "management", "project management", "time management", "organization", "creativity", "emotional intelligence", "conflict resolution", "presentation", "writing", "agile mindset", "analytical",
    # Advanced Tech Concepts
    "distributed systems", "microservices", "system design", "algorithms", "data structures", "cloud computing", "serverless", "scalability", "high availability", "security", "cryptography", "blockchain", "iot", "ar/vr", "embedded systems", "linux", "unix", "shell scripting", "networking", "tcp/ip", "http", "rest", "graphql", "grpc", "websockets", "ci/cd", "devops", "mlops", "data engineering", "big data", "etl", "data warehousing", "data visualization", "business intelligence", "statistics", "calculus", "linear algebra", "probability"
}

# Display mapping for nicer output
DISPLAY_MAPPING = {
    "sql": "SQL", "html": "HTML", "css": "CSS", "aws": "AWS", "api": "API",
    "json": "JSON", "xml": "XML", "jwt": "JWT", "nlp": "NLP", "ml": "ML",
    "ai": "AI", "ci/cd": "CI/CD", "c#": "C#", "c++": "C++", ".net": ".NET",
    "php": "PHP", "ui": "UI", "ux": "UX", "javascript": "JavaScript",
    "typescript": "TypeScript", "react": "React", "vue": "Vue", "angular": "Angular",
    "node.js": "Node.js", "express": "Express", "django": "Django", "flask": "Flask",
    "fastapi": "FastAPI", "mongodb": "MongoDB", "postgresql": "PostgreSQL",
    "mysql": "MySQL", "nosql": "NoSQL", "rest": "REST", "graphql": "GraphQL",
    "docker": "Docker", "kubernetes": "Kubernetes", "git": "Git", "github": "GitHub"
}

def extract_skills(text: str) -> set:
    text = text.lower()
    found_skills = set()
    
    # Sort skills by length (descending) to match "node.js" before "node"
    sorted_skills = sorted(SKILLS_DB, key=len, reverse=True)
    
    for skill in sorted_skills:
        # Escape special regex chars in skill name
        pattern_skill = re.escape(skill)
        
        # enhanced boundary check:
        # 1. Start: Either start of string, whitespace, or non-word char (like punctuation opening)
        # 2. End: Either end of string, whitespace, or non-word char (like punctuation closing)
        # This allows matching "c++," or "(node.js)" or " skills:python "
        pattern = r'(?:^|[\s\(\[\{,\./])' + pattern_skill + r'(?:$|[\s\)\]\}\,\./])'
        
        # Special case for C++ and C# and .NET to avoid false negatives with boundaries
        if skill in ["c++", "c#", ".net"]:
             if skill in text: # Simple check first is often safe enough for these distinct terms
                 found_skills.add(skill)
                 continue

        if re.search(pattern, text):
            found_skills.add(skill)
            
    return found_skills

@app.post("/analyze-resume", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    resume_text = request.resume_text
    jd_text = request.job_description

    print(f"Analyzing Resume ({len(resume_text)} chars) vs JD ({len(jd_text)} chars)")

    if not resume_text or not jd_text:
        return AnalyzeResponse(
            match_score=0,
            matched_skills=[],
            missing_skills=[],
            suggestions=["Please provide both resume text and job description."]
        )

    # 1. Extract Skills
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)
    
    matched_skills_set = resume_skills.intersection(jd_skills)
    missing_skills_set = jd_skills - resume_skills
    
    # helper for display
    def format_skill(s):
        return DISPLAY_MAPPING.get(s, s.title())

    matched_skills = [format_skill(s) for s in matched_skills_set]
    missing_skills = [format_skill(s) for s in missing_skills_set]

    # Calculate Skill Match Score
    if len(jd_skills) > 0:
        skill_match_score = (len(matched_skills_set) / len(jd_skills)) * 100
    else:
        skill_match_score = 50 

    # 2. Calculate Text Similarity (TF-IDF)
    text_match_score = 0
    try:
        documents = [resume_text, jd_text]
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(documents)
        score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        text_match_score = int(score * 100)
    except Exception as e:
        print(f"TF-IDF Error: {e}")
        text_match_score = 0

    # 3. Final Weighted Score
    final_score = (skill_match_score * 0.6) + (text_match_score * 0.4)
    final_score = int(final_score)
    
    # Ensure non-zero match if there is *some* text match but 0 skill match
    if final_score == 0 and text_match_score > 10:
        final_score = 10

    if len(matched_skills_set) > 0 and len(matched_skills_set) >= len(missing_skills_set) and final_score < 50:
        final_score = 50

    # 4. Generate Suggestions
    suggestions = []
    
    if len(jd_skills) == 0:
        suggestions.append("⚠️ Could not identify standard technical skills in the Job Description.")
        suggestions.append("• Try ensuring the JD contains clear technical keywords.")
        suggestions.append("• The score is currently based solely on text similarity.")
    else:
        if final_score < 30:
            suggestions.append("CRITICAL: Your resume has very low similarity to this job description.")
            if len(matched_skills) == 0:
                suggestions.append("• No common technical skills were found.")
            else:
                suggestions.append("• You are missing key hard skills.")

        elif final_score < 50:
            suggestions.append("Your resume is a partial match. It needs significantly more relevant keywords.")

        # Missing Skills Feedback
        if missing_skills:
            suggestions.append("• Missing Critical Skills: " + ", ".join(missing_skills[:4]))
            if len(missing_skills) > 4:
                suggestions.append(f"  (and {len(missing_skills) - 4} more)")
        else:
             if final_score >= 80:
                suggestions.append("• Strong Match: Your profile aligns well with this role.")
             else:
                suggestions.append("• Technical skills match, but content depth is lacking.")

    return AnalyzeResponse(
        match_score=final_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        suggestions=suggestions
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

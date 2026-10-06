export const projects = [
  {
    id: 'chancify', name: 'Chancify', index: '01', status: 'LIVE', type: 'Admissions intelligence',
    tagline: 'Understand the odds. Build a stronger college list.',
    summary: 'A college admissions platform that evaluates student profiles across 20 weighted factors and more than 1,600 colleges.',
    role: 'Frontend Developer & UI/UX Designer', team: 'Three-person team',
    stack: ['Next.js', 'React', 'Python', 'FastAPI'],
    metrics: [{ value: '1,600+', label: 'colleges' }, { value: '20', label: 'weighted factors' }, { value: '03', label: 'team members' }],
    mission: 'Give students a clearer picture of possible admissions outcomes using academic and institutional data.',
    system: 'The platform combines admissions data from IPEDS, College Scorecard, and Common Data Sets with scoring and machine-learning analysis.',
    contribution: 'I designed the interface and built the frontend experience. The scoring and ML work was shared across the team.',
    result: 'Live platform at chancifyai.com.',
    link: 'https://chancifyai.com', linkLabel: 'Visit Chancify', github: null, images: [], visual: 'chancify'
  },
  {
    id: 'cclear', name: 'CCLEAR', index: '02', status: 'COMPLETED', type: 'Focus browser',
    tagline: 'A browser that helps you remember why you opened it.',
    summary: 'An AI-assisted desktop browser designed to make research and focused work less distracting.',
    role: 'Hackathon project contributor', team: 'Grizzly Hacks III',
    stack: ['Electron', 'Ollama', 'Mistral 7B', 'Local LLM'],
    metrics: [{ value: '2nd', label: 'place' }, { value: '217', label: 'participants' }, { value: 'LOCAL', label: 'model runtime' }],
    mission: 'Reduce distraction and keep the purpose of each browsing session visible.',
    system: 'An AI sidebar, simplified pages, intelligent highlighting, tab organization, and “Why Am I Here?” prompts work together inside an Electron application.',
    contribution: 'Built and presented the hackathon prototype with the team.',
    result: '2nd Place at Grizzly Hacks III among 217 participants.',
    github: null, images: [], visual: 'cclear'
  },
  {
    id: 'shadecast', name: 'ShadeCast', index: '03', status: 'HACKATHON', type: 'ReverieHacks project',
    tagline: 'A high-scoring hackathon build, with more details to come.',
    summary: 'ShadeCast participated in ReverieHacks. A fuller product description and technical breakdown will be added when available.',
    role: 'Hackathon participant', team: 'ReverieHacks',
    stack: [],
    metrics: [{ value: '103/100', label: 'total with bonus' }, { value: '25/25', label: 'technical execution' }, { value: '25/25', label: 'real-world impact' }],
    mission: 'Project description coming soon.',
    system: 'Technical details and screenshots are ready to be added to the project data file.',
    contribution: 'Participated in the ReverieHacks project.',
    result: 'Judging: impact 25/25, technical execution 25/25, innovation 15/15, UX 14/15, sustainability 10/10, presentation 9/10, plus 5 bonus points.',
    github: null, images: [], visual: 'shadecast'
  },
  {
    id: 'vynk', name: 'Vynk', index: '04', status: 'IN DEVELOPMENT', type: 'Agentic software engineering',
    tagline: 'An experiment in how coding agents understand large repositories.',
    summary: 'An AI-native software engineering system exploring planning, dependency analysis, constrained edits, and evaluation across larger codebases.',
    role: 'Creator / developer', team: 'Independent exploration',
    stack: ['Repository graphs', 'Coding models', 'Qwen2.5-Coder 7B'],
    metrics: [{ value: 'PLAN', label: 'reason about changes' }, { value: 'SPEC', label: 'constrain edits' }, { value: 'EVAL', label: 'check results' }],
    mission: 'Improve architectural consistency and keep automated changes local to the parts of a repository that matter.',
    system: 'Explored architecture: repository chunks such as Auth, DB, API, and UI; a dependency graph; router and supervisor systems; then Plan → Edit Spec → Apply Edits.',
    contribution: 'I am prototyping the orchestration and experimenting with local coding models, including Qwen2.5-Coder 7B.',
    result: 'Prototype in development. No commercial release is claimed.',
    github: null, images: [], visual: 'vynk'
  }
];

export const credentials = [
  { id: 'profile', label: 'Pilot profile', code: 'ID-01' },
  { id: 'experience', label: 'Experience', code: 'EXP-02' },
  { id: 'education', label: 'Education', code: 'EDU-03' },
  { id: 'certifications', label: 'Certifications', code: 'CERT-04' },
  { id: 'achievements', label: 'Achievements', code: 'LOG-05' },
  { id: 'skills', label: 'Technical skills', code: 'SYS-06' },
  { id: 'resume', label: 'Resume', code: 'FILE-07' },
  { id: 'comms', label: 'Communications', code: 'COM-08' }
];

export const social = {
  linkedin: 'https://www.linkedin.com/in/rahul-vuta-5430523a2/',
  chancify: 'https://chancifyai.com',
  github: 'https://github.com/rahulvuta',
  email: 'vutarahul@gmail.com'
};

export const education = {
  school: 'Marvin Ridge High School', location: 'Waxhaw, North Carolina', graduation: '2028',
  gpa: '4.53', gpaNote: 'weighted, grades 9–10', sat: '1540', satMath: '780 Math', satReading: '760 Reading & Writing',
  exams: ['AP Computer Science Principles — 5', 'AP Precalculus — 5'],
  current: ['AP Calculus AB', 'AP English Language & Composition', 'AP Seminar', 'AP U.S. Government & Politics', 'SPCC PHY-151'],
  planned: ['AP Calculus BC', 'AP Psychology']
};

export const achievements = [
  { year: '2026', title: '2nd Place', context: 'Grizzly Hacks III', detail: '217 participants' },
  { year: '2026', title: 'Top 10 Finalist', context: 'NC FBLA State Leadership Conference', detail: 'Website Coding & Development' },
  { year: '2025', title: 'Honorable Mention', context: 'Congressional App Challenge', detail: 'North Carolina District 08' },
  { year: '—', title: 'Participant', context: 'ReverieHacks', detail: 'ShadeCast' }
];

export const skills = [
  { title: 'Languages', items: ['Python', 'Java', 'JavaScript / TypeScript'] },
  { title: 'Frameworks & technologies', items: ['React', 'Next.js', 'Electron', 'Firebase', 'Flask', 'FastAPI', 'Tailwind CSS'] },
  { title: 'AI & development', items: ['Cursor', 'Git', 'GitHub', 'Ollama', 'OpenRouter', 'LLM APIs', 'Local LLMs'] }
];

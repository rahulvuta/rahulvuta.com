import { projects, social, education, achievements, skills } from './data.js';

const displayProjects = projects.map(project => `<div class="resume-item"><div class="item-head"><h3>${project.name}</h3><span>${project.status}</span></div><p>${project.summary}</p><p class="item-meta">${project.role}${project.stack.length ? ` · ${project.stack.join(', ')}` : ''}</p></div>`).join('');

document.querySelector('#resume-content').innerHTML = `
  <header class="resume-head"><div><h1>Rahul Vuta</h1><p>Software Developer · AI Builder · Aspiring Founder</p></div><div class="contact-line"><span>North Carolina</span><a href="mailto:${social.email}">${social.email}</a><a href="${social.linkedin}">LinkedIn</a><a href="${social.github}">GitHub</a></div></header>
  <section><h2>Profile</h2><p>Student developer building software products, AI systems, and experimental developer tools. Interested in software engineering, product design, startups, and how complex systems work.</p></section>
  <section><h2>Projects</h2>${displayProjects}</section>
  <section><h2>Experience</h2><div class="resume-item"><div class="item-head"><h3>Software Development Intern · AppAiTech</h3><span>2026</span></div><p>Helped convert an investment-focused mobile application into a web product. Worked on portfolio tracking, asset allocation, watchlists, and investment recommendations using modern web tools and AI-assisted development workflows.</p></div></section>
  <section><h2>Education</h2><div class="resume-item"><div class="item-head"><h3>${education.school}</h3><span>Expected ${education.graduation}</span></div><p>${education.location} · ${education.gpa} weighted GPA through grades 9–10 · ${education.sat} SAT (${education.satMath}, ${education.satReading})</p><p>AP exams: ${education.exams.join('; ')}.</p><p>Current coursework: ${education.current.join('; ')}.</p></div></section>
  <section><h2>Achievements</h2><ul>${achievements.map(item => `<li><strong>${item.title}</strong> — ${item.context}${item.detail ? `, ${item.detail}` : ''}${item.year !== '—' ? ` (${item.year})` : ''}</li>`).join('')}</ul></section>
  <section class="last-section"><h2>Skills & Certifications</h2><p>${skills.map(group => `<strong>${group.title}:</strong> ${group.items.join(', ')}`).join('<br>')}</p><p><strong>Certifications:</strong> PCAP — Certified Associate Python Programmer; PCEP — Certified Entry-Level Python Programmer.</p></section>
`;

document.querySelector('#print-resume').addEventListener('click', () => window.print());

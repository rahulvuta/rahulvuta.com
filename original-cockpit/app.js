import { projects, credentials, social, education, achievements, skills } from './data.js';

const $ = (selector) => document.querySelector(selector);
const screen = $('#holo-content');
const display = $('#holo-display');
const scene = $('#scene');
const world = $('#world');
const status = $('#module-status');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentModule = 'home';
let transitionTimer;
let audioContext;
let humOscillator;
let humGain;
let audioOn = false;
let thrustOn = false;
let easterEggCount = 0;

function externalLink(href, label, className = 'holo-link') {
  return `<a class="${className}" href="${href}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
}

function sectionHead(kicker, title, subtitle = '') {
  return `<div class="module-heading"><div class="module-kicker"><span class="kicker-line"></span>${kicker}</div><h1 tabindex="-1">${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
}

function metric(value, label) {
  return `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
}

function homeView() {
  return `<div class="home-module module-enter">
    <div class="home-copy"><div class="module-kicker"><span class="kicker-line"></span>PILOT PROFILE FOUND · WELCOME ABOARD</div>
      <div class="home-heading"><span>HELLO, I'M</span><h1 tabindex="-1">RAHUL<br><em>VUTA.</em></h1></div>
      <p class="home-roles">SOFTWARE DEVELOPER <i>✳</i> AI BUILDER <i>✳</i> ASPIRING FOUNDER</p>
      <p class="home-description">I build software products, AI systems, and experimental developer tools.</p>
      <div class="home-actions"><button type="button" class="primary-command" data-module="chancify">EXPLORE PROJECTS <span aria-hidden="true">↗</span></button><button type="button" class="text-command" data-module="profile">PILOT PROFILE <span aria-hidden="true">→</span></button></div>
    </div>
    <div class="home-graphic" aria-hidden="true"><div class="orbit orbit-outer"></div><div class="orbit orbit-middle"></div><div class="orbit orbit-inner"></div><div class="orbit-core"><span>RV</span><small>01</small></div><span class="orbit-point point-one"></span><span class="orbit-point point-two"></span><span class="orbit-point point-three"></span><div class="graphic-readout readout-a">BUILDING<br>THE NEXT THING</div><div class="graphic-readout readout-b">SYSTEMS<br>ONLINE</div></div>
    <div class="home-status"><span><i class="status-pulse"></i> CURRENTLY BUILDING</span><b>VYNK</b><button type="button" data-module="vynk">VIEW PROTOTYPE ↗</button></div>
  </div>`;
}

function projectVisual(project) {
  if (project.visual === 'chancify') return `<div class="project-visual visual-chancify" aria-label="Diagram of profile factors feeding college outcome analysis"><div class="visual-label">ADMISSIONS ANALYSIS / LIVE DATA</div><div class="college-diagram"><div class="diagram-node source-node"><span>STUDENT<br>PROFILE</span><small>20 FACTORS</small></div><div class="diagram-path"><span></span><span></span><span></span></div><div class="diagram-node core-node"><span>CHANCIFY</span><small>SCORING ENGINE</small></div><div class="diagram-path"><span></span><span></span><span></span></div><div class="outcome-list"><span><b>01</b> REACH <i>▰▰▰▱</i></span><span><b>02</b> TARGET <i>▰▰▰▰</i></span><span><b>03</b> LIKELY <i>▰▰▰▰</i></span></div></div><div class="visual-footer">IPEDS <span>•</span> COLLEGE SCORECARD <span>•</span> COMMON DATA SETS</div></div>`;
  if (project.visual === 'cclear') return `<div class="project-visual visual-cclear" aria-label="Schematic of the CCLEAR focus browser"><div class="browser-chrome"><span class="browser-dots"><i></i><i></i><i></i></span><span class="browser-url">cclear://focus-session</span><span>✳</span></div><div class="browser-body"><div class="browser-article"><span class="article-tag">FOCUS MODE · ENABLED</span><div class="article-line line-wide"></div><div class="article-line"></div><div class="article-line line-short"></div><div class="article-highlight"></div><div class="article-line"></div></div><div class="browser-assistant"><span>AI SIDEBAR</span><b>Why am I here?</b><p>Keep your research session on track.</p><div class="assistant-typing"><i></i><i></i><i></i></div></div></div></div>`;
  if (project.visual === 'vynk') return `<div class="project-visual visual-vynk" aria-label="Vynk architecture pipeline"><div class="visual-label">REPOSITORY INTELLIGENCE / PROTOTYPE</div><div class="repo-blocks"><span>AUTH</span><span>DB</span><span>API</span><span>UI</span></div><div class="vynk-connections" aria-hidden="true">╲ &nbsp;&nbsp; │ &nbsp;&nbsp; ╱</div><div class="vynk-pipeline"><span><small>01</small> PLAN</span><b>→</b><span><small>02</small> EDIT SPEC</span><b>→</b><span><small>03</small> APPLY EDITS</span></div><div class="visual-footer">DEPENDENCY GRAPH <span>•</span> SUPERVISOR <span>•</span> EVALUATION</div></div>`;
  return `<div class="project-visual visual-shadecast" aria-label="ShadeCast ReverieHacks judging results"><div class="visual-label">REVERIEHACKS / JUDGING RECORD</div><div class="shadecast-score"><div><span>FINAL SCORE</span><strong>103<small>/100</small></strong><em>INCLUDING BONUS</em></div><div class="score-bars"><span><b>IMPACT</b><i style="--score:100%"></i><small>25/25</small></span><span><b>TECHNICAL</b><i style="--score:100%"></i><small>25/25</small></span><span><b>INNOVATION</b><i style="--score:100%"></i><small>15/15</small></span><span><b>UX & DESIGN</b><i style="--score:93%"></i><small>14/15</small></span></div></div><div class="visual-footer">MORE PROJECT DETAILS COMING SOON</div></div>`;
}

function projectView(project) {
  return `<div class="project-module module-enter">
    <div class="project-overline"><span>BUILD ARCHIVE / ${project.index}</span><span class="project-state"><i></i>${project.status}</span></div>
    ${sectionHead(`SYSTEM // ${project.type.toUpperCase()}`, project.name, project.tagline)}
    <div class="project-intro"><p>${project.summary}</p><div class="project-metrics">${project.metrics.map(item => metric(item.value, item.label)).join('')}</div></div>
    ${projectVisual(project)}
    ${project.images?.length ? `<div class="project-gallery">${project.images.map(image => `<figure><img src="${image.src}" alt="${image.alt}" loading="lazy"><figcaption>${image.caption || project.name}</figcaption></figure>`).join('')}</div>` : ''}
    <div class="project-facts"><div><span>ROLE</span><strong>${project.role}</strong></div><div><span>CONTEXT</span><strong>${project.team}</strong></div>${project.stack.length ? `<div><span>STACK / TOOLS</span><strong>${project.stack.join(' · ')}</strong></div>` : ''}</div>
    <div class="project-story"><div><span>THE MISSION</span><p>${project.mission}</p></div><div><span>THE SYSTEM</span><p>${project.system}</p></div><div><span>MY CONTRIBUTION</span><p>${project.contribution}</p></div><div><span>RESULT</span><p>${project.result}</p></div></div>
    ${project.link || project.github ? `<div class="module-actions">${project.link ? externalLink(project.link, project.linkLabel) : ''}${project.github ? externalLink(project.github, 'View project code') : ''}</div>` : ''}
  </div>`;
}

function profileView() {
  return `<div class="record-module module-enter">${sectionHead('PERSONNEL FILE // ID-01', 'Pilot profile', 'A builder at the controls.')}
    <div class="profile-layout"><div class="profile-portrait" aria-hidden="true"><span>RV</span><div class="portrait-lines"></div><small>PILOT / VERIFIED</small></div><div class="profile-details"><div><span>NAME</span><strong>Rahul Vuta</strong></div><div><span>LOCATION</span><strong>North Carolina</strong></div><div><span>ROLE</span><strong>Student · Software developer · Builder</strong></div><div><span>MISSION</span><p>Build useful and ambitious software while learning how complex systems actually work.</p></div></div></div>
    <div class="chip-section"><span>AREAS OF INTEREST</span><div class="skill-chips"><b>AI systems</b><b>Software engineering</b><b>Developer tools</b><b>Startups</b><b>Product design</b></div></div>
  </div>`;
}

function experienceView() {
  return `<div class="record-module module-enter">${sectionHead('PERSONNEL FILE // EXP-02', 'Experience', 'Work in the field.')}
    <div class="timeline-entry"><div class="timeline-year">2026<span></span></div><div><span class="entry-kicker">SOFTWARE DEVELOPMENT INTERN</span><h2>AppAiTech</h2><p>Helped turn an investment-focused mobile application into a web product, working on portfolio tracking, asset allocation, watchlists, and investment recommendations.</p><div class="skill-chips"><b>Web product development</b><b>AI-assisted workflows</b><b>Investment tools</b></div></div></div>
    <div class="record-note"><span>FIELD NOTE</span><p>Practical product work, with a focus on making complex financial information usable on the web.</p></div>
  </div>`;
}

function educationView() {
  return `<div class="record-module module-enter">${sectionHead('TRAINING RECORD // EDU-03', 'Education', 'Academic telemetry.')}
    <div class="school-card"><div><span>INSTITUTION</span><h2>${education.school}</h2><p>${education.location} · Expected graduation ${education.graduation}</p></div><div class="school-seal">MR<span>HS</span></div></div>
    <div class="education-numbers">${metric(education.gpa, education.gpaNote + ' GPA')}${metric(education.sat, `SAT · ${education.satMath} / ${education.satReading}`)}</div>
    <div class="education-columns"><div><span>COMPLETED AP EXAMS</span>${education.exams.map(x => `<p>${x}</p>`).join('')}</div><div><span>CURRENT COURSEWORK</span>${education.current.map(x => `<p>${x}</p>`).join('')}</div><div><span>PLANNED SPRING 2027</span>${education.planned.map(x => `<p>${x}</p>`).join('')}</div></div>
  </div>`;
}

function certificationsView() {
  return `<div class="record-module module-enter">${sectionHead('TECHNICAL CLEARANCE // CERT-04', 'Certifications', 'Python credentials.')}
    <div class="cert-grid"><div class="cert-card"><span>CREDENTIAL / 01</span><strong>PCAP</strong><p>Certified Associate Python Programmer</p><small><i class="status-pulse"></i> CERTIFIED</small></div><div class="cert-card"><span>CREDENTIAL / 02</span><strong>PCEP</strong><p>Certified Entry-Level Python Programmer</p><small><i class="status-pulse"></i> CERTIFIED</small></div></div>
  </div>`;
}

function achievementsView() {
  return `<div class="record-module module-enter">${sectionHead('MISSION RECORD // LOG-05', 'Achievements', 'Selected recognitions and activities.')}
    <div class="achievement-list">${achievements.map((item, index) => `<div class="achievement"><span class="achievement-index">0${index + 1}</span><div><span>${item.year} / ${item.context}</span><strong>${item.title}</strong><small>${item.detail}</small></div><b>✳</b></div>`).join('')}</div>
    <div class="chip-section"><span>OTHER ACTIVITIES</span><div class="skill-chips"><b>FBLA</b><b>TSA</b><b>Robotics</b></div></div>
  </div>`;
}

function skillsView() {
  return `<div class="record-module module-enter">${sectionHead('CAPABILITY SCAN // SYS-06', 'Technical skills', 'Tools I use to build and experiment.')}
    <div class="skills-groups">${skills.map((group, i) => `<div class="skills-group"><div class="skills-group-label"><span>0${i + 1}</span><strong>${group.title}</strong></div><div class="skill-chips">${group.items.map(item => `<b>${item}</b>`).join('')}</div></div>`).join('')}</div>
  </div>`;
}

function resumeView() {
  return `<div class="record-module resume-module module-enter">${sectionHead('FLIGHT MANIFEST // FILE-07', 'Resume', 'A straightforward record, beyond the cockpit.')}
    <div class="manifest"><div class="manifest-icon" aria-hidden="true"><span>RV</span><small>PDF / PRINT</small></div><div><span>PERSONNEL DOCUMENT</span><h2>Rahul Vuta<br>Resume</h2><p>Projects, experience, education, and credentials in a traditional format.</p>${externalLink('./resume.html', 'Open printable resume', 'primary-command manifest-button')}</div></div>
    <p class="resume-note">The printable page can be saved as a PDF from your browser.</p>
  </div>`;
}

function commsView() {
  return `<div class="record-module module-enter">${sectionHead('COMMUNICATIONS // COM-08', 'Open channel', 'For projects, ideas, and opportunities.')}
    <div class="comms-status"><i class="status-pulse"></i> UPLINK ACTIVE <span>READY TO CONNECT</span></div>
    <div class="comms-links">${externalLink(`mailto:${social.email}`, `<span><small>DIRECT TRANSMISSION</small><strong>Email</strong><em>${social.email}</em></span>`, 'comms-link')}${externalLink(social.linkedin, '<span><small>PROFESSIONAL NETWORK</small><strong>LinkedIn</strong><em>rahul-vuta-5430523a2</em></span>', 'comms-link')}${externalLink(social.github, '<span><small>CODE ARCHIVE</small><strong>GitHub</strong><em>github.com/rahulvuta</em></span>', 'comms-link')}${externalLink(social.chancify, '<span><small>LIVE PROJECT</small><strong>Chancify</strong><em>chancifyai.com</em></span>', 'comms-link')}</div>
  </div>`;
}

const views = { home: homeView, profile: profileView, experience: experienceView, education: educationView, certifications: certificationsView, achievements: achievementsView, skills: skillsView, resume: resumeView, comms: commsView };

function renderModule(id) {
  const project = projects.find(item => item.id === id);
  return project ? projectView(project) : (views[id] || homeView)();
}

function updateControls(id) {
  document.querySelectorAll('[data-module]').forEach(button => {
    const active = button.dataset.module === id || (button.dataset.module === 'chancify' && projects.some(project => project.id === id) && button.closest('.quick-nav'));
    button.classList.toggle('active', !!active);
    if (button.closest('.physical-list')) button.setAttribute('aria-pressed', String(!!active));
  });
}

function selectModule(id, focusHeading = false) {
  const revealScreen = () => {
    if (window.innerWidth <= 980) $('#main').scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  };
  if (id === currentModule && screen.innerHTML) { revealScreen(); return; }
  clearTimeout(transitionTimer);
  display.classList.add('module-changing');
  status.textContent = 'LOADING MODULE';
  transitionTimer = setTimeout(() => {
    currentModule = id;
    screen.innerHTML = renderModule(id);
    screen.scrollTop = 0;
    display.classList.remove('module-changing');
    status.textContent = `SYSTEM ${projects.some(project => project.id === id) ? 'PROJECT' : 'READY'} / ${id.toUpperCase()}`;
    $('#holo-cue').textContent = id === 'home' ? '▂ ▄ ▆ ▄ ▇ ▃ ▅ ▂' : 'SCROLL DISPLAY FOR DETAILS ↓';
    updateControls(id);
    playClick(620);
    revealScreen();
    if (focusHeading) screen.querySelector('h1')?.focus({ preventScroll: true });
  }, prefersReducedMotion.matches ? 0 : 180);
}

function buildControls() {
  $('#project-buttons').innerHTML = projects.map(project => `<button class="physical-button project-button" type="button" data-module="${project.id}" aria-pressed="false"><span class="button-led"></span><span class="button-face"><small>${project.index} / ${project.type}</small><strong>${project.name}</strong></span><span class="button-chevron" aria-hidden="true">↗</span></button>`).join('');
  $('#record-buttons').innerHTML = credentials.map(item => `<button class="physical-button record-button" type="button" data-module="${item.id}" aria-pressed="false"><span class="button-led"></span><span class="button-face"><small>${item.code}</small><strong>${item.label}</strong></span><span class="button-chevron" aria-hidden="true">›</span></button>`).join('');
}

function setupNavigation() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-module]');
    if (!button) return;
    selectModule(button.dataset.module, event.detail === 0);
  });
}

function setupLook() {
  if (prefersReducedMotion.matches || !window.matchMedia('(pointer: fine)').matches) return;
  let targetX = 0, targetY = 0, x = 0, y = 0, vx = 0, vy = 0;
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    targetX = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2));
  }, { passive: true });
  window.addEventListener('blur', () => { targetX = 0; targetY = 0; });
  function frame() {
    vx = (vx + (targetX - x) * 0.022) * 0.83;
    vy = (vy + (targetY - y) * 0.018) * 0.83;
    x += vx; y += vy;
    scene.style.setProperty('--view-x', `${(-x * 92).toFixed(2)}px`);
    scene.style.setProperty('--view-y', `${(-y * 14).toFixed(2)}px`);
    scene.style.setProperty('--view-rotate', `${(-x * 5.3).toFixed(2)}deg`);
    scene.style.setProperty('--near-x', `${(-x * 31).toFixed(2)}px`);
    scene.style.setProperty('--holo-x', `${(x * 8).toFixed(2)}px`);
    world.style.setProperty('--star-x', `${(x * 22).toFixed(2)}px`);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function setupBoot() {
  const overlay = $('#boot-overlay');
  if (sessionStorage.getItem('rv-booted') || prefersReducedMotion.matches) return;
  overlay.hidden = false;
  let timer = setTimeout(finish, 2350);
  function finish() {
    clearTimeout(timer);
    overlay.classList.add('boot-done');
    setTimeout(() => { overlay.hidden = true; }, 400);
    sessionStorage.setItem('rv-booted', '1');
  }
  $('#skip-boot').addEventListener('click', finish);
}

function playClick(frequency = 460) {
  if (!audioOn || !audioContext) return;
  const tone = audioContext.createOscillator();
  const gain = audioContext.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(frequency, audioContext.currentTime);
  tone.frequency.exponentialRampToValueAtTime(frequency * 0.65, audioContext.currentTime + 0.08);
  gain.gain.setValueAtTime(0.012, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.09);
  tone.connect(gain).connect(audioContext.destination);
  tone.start(); tone.stop(audioContext.currentTime + 0.1);
}

function setupAudio() {
  $('#audio-toggle').addEventListener('click', async () => {
    audioOn = !audioOn;
    if (audioOn) {
      audioContext ||= new AudioContext();
      await audioContext.resume();
      humOscillator ||= audioContext.createOscillator();
      humGain ||= audioContext.createGain();
      if (!humOscillator.frequency.value || humOscillator.frequency.value === 440) humOscillator.frequency.value = 52;
      humOscillator.type = 'sine';
      if (!humOscillator._started) { humOscillator.connect(humGain).connect(audioContext.destination); humOscillator.start(); humOscillator._started = true; }
      humGain.gain.setTargetAtTime(thrustOn ? 0.012 : 0.004, audioContext.currentTime, 0.3);
      playClick();
    } else if (humGain) {
      humGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.12);
    }
    $('#audio-toggle').setAttribute('aria-pressed', String(audioOn));
    $('#audio-toggle').setAttribute('aria-label', `Turn ambient audio ${audioOn ? 'off' : 'on'}`);
    $('#audio-state').textContent = audioOn ? 'ON' : 'OFF';
  });
}

function setupAux() {
  document.querySelectorAll('[data-light-mode]').forEach(button => button.addEventListener('click', () => {
    document.body.dataset.light = button.dataset.lightMode;
    document.querySelectorAll('[data-light-mode]').forEach(other => { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); });
    playClick(510);
  }));
  $('#thruster-toggle').addEventListener('click', () => {
    thrustOn = !thrustOn;
    document.body.dataset.thrust = thrustOn ? 'on' : 'off';
    $('#thruster-toggle').setAttribute('aria-pressed', String(thrustOn));
    $('#thruster-state').textContent = thrustOn ? 'ON' : 'OFF';
    if (humGain && audioOn) humGain.gain.setTargetAtTime(thrustOn ? 0.012 : 0.004, audioContext.currentTime, 0.25);
    playClick(160);
  });
  const overlay = $('#diagnostics-overlay');
  const toggle = $('#diagnostics-toggle');
  function setDiagnostics(open) {
    overlay.hidden = !open;
    toggle.setAttribute('aria-pressed', String(open));
    if (open) $('#diagnostics-close').focus(); else toggle.focus();
    playClick(open ? 720 : 380);
  }
  toggle.addEventListener('click', () => setDiagnostics(overlay.hidden));
  $('#diagnostics-close').addEventListener('click', () => setDiagnostics(false));
  overlay.addEventListener('click', event => { if (event.target === overlay) setDiagnostics(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) setDiagnostics(false); });
  $('.brand-mark').addEventListener('click', () => {
    easterEggCount++;
    if (easterEggCount === 5) {
      easterEggCount = 0;
      const note = document.createElement('div');
      note.className = 'easter-toast';
      note.textContent = 'CURRENT OBJECTIVE: SHIP COOL THINGS.';
      document.body.append(note);
      setTimeout(() => note.remove(), 2800);
    }
  });
}

function setupClock() {
  const clock = $('#holo-clock');
  function update() {
    const now = new Date();
    clock.textContent = `SOL 001 • ${now.toLocaleTimeString('en-US', { hour12: false })}`;
  }
  update(); setInterval(update, 1000);
}

buildControls();
screen.innerHTML = homeView();
updateControls('home');
setupNavigation();
setupLook();
setupBoot();
setupAudio();
setupAux();
setupClock();
if (window.innerWidth > 980) window.scrollTo(0, 0);
window.addEventListener('resize', () => { if (window.innerWidth > 980) window.scrollTo(0, 0); });

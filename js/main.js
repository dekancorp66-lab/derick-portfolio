const preload = document.getElementById('preload');
const menuToggle = document.getElementById('menu-toggle');
const menuPanel = document.getElementById('menu-panel');
const projectDialog = document.getElementById('project-dialog');
const cursor = document.getElementById('cursor');

const greetingText = document.getElementById('greeting-text');
const greetings = ['Habari', 'Bonjour', 'Hola', 'Ciao', 'Olá', 'こんにちは'];
let greetingIndex = -1;

const advanceGreeting = () => {
  greetingText.classList.add('is-changing');
  window.setTimeout(() => {
    greetingIndex += 1;
    if (greetingIndex >= greetings.length) {
      preload.classList.add('is-gone');
      return;
    }
    greetingText.textContent = greetings[greetingIndex];
    greetingText.classList.remove('is-changing');
    window.setTimeout(advanceGreeting, 160);
  }, 120);
};

window.setTimeout(advanceGreeting, 320);

const setMenuOpen = (isOpen) => {
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuPanel.setAttribute('aria-hidden', String(!isOpen));
  menuPanel.inert = !isOpen;
  menuPanel.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
};

menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});

menuPanel.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.querySelectorAll('.project-card').forEach((project) => {
  project.addEventListener('click', () => {
    document.getElementById('dialog-title').textContent = project.dataset.title;
    document.getElementById('dialog-description').textContent = project.dataset.description;
    const projectLink = document.getElementById('dialog-project-link');
    projectLink.hidden = !project.dataset.url;
    if (project.dataset.url) projectLink.href = project.dataset.url;
    projectDialog.showModal();
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', (event) => {
  if (event.target === projectDialog) projectDialog.close();
});

const revealItems = document.querySelectorAll('.rv');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('in'));
}

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll('.project-card').forEach((project) => {
    project.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
    project.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  });
}

const contactLink = document.getElementById('contact-link');
contactLink.addEventListener('pointermove', (event) => {
  const bounds = contactLink.getBoundingClientRect();
  const offsetX = (event.clientX - bounds.left - bounds.width / 2) * 0.12;
  const offsetY = (event.clientY - bounds.top - bounds.height / 2) * 0.12;
  contactLink.style.translate = `${offsetX}px ${offsetY}px`;
});
contactLink.addEventListener('pointerleave', () => {
  contactLink.style.translate = '';
});

const updateClock = () => {
  document.getElementById('clock').textContent = `${new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Dar_es_Salaam',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())} EAT`;
};
updateClock();
window.setInterval(updateClock, 30000);
// Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Scroll-triggered Fade-ins
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.13 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Kinetic Hero Text Animation
document.querySelectorAll('.kinetic-text').forEach(el => {
  el.innerHTML = el.textContent.split('').map((l,i) =>
    `<span style="animation-delay:${i*0.03}s">${l}</span>`).join('');
});

// 3D Tilt Card Hover
document.querySelectorAll('.car-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `rotateY(${x/15}deg) rotateX(${-y/18}deg) scale(1.03)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Car Modal (Details Popup)
const modal = document.getElementById('car-modal');
const modalImg = modal.querySelector('.modal-img');
const modalTitle = modal.querySelector('.modal-title');
const modalDesc = modal.querySelector('.modal-desc');
const closeBtn = modal.querySelector('.modal-close');

document.querySelectorAll('.car-card').forEach(card => {
  card.addEventListener('click', () => {
    modal.classList.add('show');
    modalImg.src = card.dataset.img;
    modalImg.alt = card.dataset.car;
    modalTitle.textContent = card.dataset.car;
    // Simple fun car blurb—replace with real info if you want
    modalDesc.textContent =
      card.dataset.car === "Toyota GT86" ? "Lightweight, rear-drive, a pure driver’s car. Slide and smile." :
      card.dataset.car === "Nissan 370Z" ? "Classic coupe muscle with modern grip. Drift legend." :
      card.dataset.car === "Audi TT" ? "Turbocharged, all-wheel drive, iconic looks—always composed." :
      card.dataset.car === "Ford Mustang GT" ? "American V8 thunder, tail-out fun. Dominate any drag." :
      card.dataset.car === "Mazda MX-5" ? "Featherweight, razor-sharp, top-down thrills. Pure joy." :
      "Overdrive!";
  });
});
closeBtn.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('show');
});

// Hero Button Micro-interaction
const heroBtn = document.querySelector('.hero-btn');
heroBtn.addEventListener('mousemove', e => {
  const rect = heroBtn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  heroBtn.style.setProperty('--x', `${x}px`);
  heroBtn.style.setProperty('--y', `${y}px`);
});
heroBtn.addEventListener('mouseleave', () => {
  heroBtn.style.setProperty('--x', `50%`);
  heroBtn.style.setProperty('--y', `50%`);
});

// Kinetic Logo Click (fun micro-interaction)
const logo = document.querySelector('.kinetic-logo');
logo.addEventListener('click', () => {
  logo.classList.add('clicked');
  setTimeout(() => logo.classList.remove('clicked'), 520);
});


document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     MOBILE NAV
  ========================================================= */

  const hamburger = $(".hamburger");
  const navLinks = $(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      hamburger.classList.toggle("open", open);
      hamburger.setAttribute("aria-expanded", open);
    });

    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        navLinks.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", false);
      }
    });
  }

  /* =========================================================
     HERO + SECTION VIDEO GOVERNOR (critical for smoothness)
  ========================================================= */

  const videos = $$("video");

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const vid = entry.target;

        if (entry.isIntersecting) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      });
    },
    { threshold: 0.35 }
  );

  videos.forEach(v => {
    v.muted = true;
    v.playsInline = true;
    videoObserver.observe(v);
  });

  /* =========================================================
     FADE-IN ANIMATIONS
  ========================================================= */

  const fadeEls = $$(".fade-in");

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  fadeEls.forEach(el => fadeObserver.observe(el));

  /* =========================================================
     CAR MODAL
  ========================================================= */

  const modal = $("#car-modal");
  const modalImg = $(".modal-img");
  const modalTitle = $(".modal-title");
  const modalDesc = $(".modal-desc");
  const modalClose = $(".modal-close");

  $$(".car-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.dataset.car || "";
      const img = card.dataset.img || "";

      modalImg.src = img;
      modalImg.alt = name;
      modalTitle.textContent = name;
      modalDesc.textContent =
        name + " is built for precision racing in OVERDRIVE. Choose upgrades carefully and control the draft.";

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  if (modalClose) {
    modalClose.addEventListener("click", () => closeModal());
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  /* =========================================================
     PURPLE BUBBLES FROM THE "O"
     Lightweight, capped FPS, no layout thrashing
  ========================================================= */

  if (!prefersReduced) {
    const logo = $(".logo");
    const logoO = $(".logoO");

    if (logo && logoO) {
      const canvas = document.createElement("canvas");
      canvas.className = "logo-bubbles";
      logo.appendChild(canvas);

      const ctx = canvas.getContext("2d", { alpha: true });

      let w = 0, h = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resize() {
        const rect = logo.getBoundingClientRect();
        w = rect.width + 40;
        h = rect.height + 40;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      resize();
      window.addEventListener("resize", resize);

      const bubbles = [];
      const MAX = 45;

      function emit() {
        if (bubbles.length > MAX) return;

        const oRect = logoO.getBoundingClientRect();
        const lRect = logo.getBoundingClientRect();

        const x = oRect.left - lRect.left + oRect.width / 2;
        const y = oRect.top - lRect.top + oRect.height * 0.65;

        bubbles.push({
          x,
          y,
          r: Math.random() * 3 + 1.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -1.2 - Math.random() * 0.8,
          life: 1,
          hue: 270 + Math.random() * 25
        });
      }

      let lastFrame = 0;
      const FPS = 30;

      function animate(t) {
        requestAnimationFrame(animate);

        if (t - lastFrame < 1000 / FPS) return;
        lastFrame = t;

        const rect = logo.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        ctx.clearRect(0, 0, w, h);

        if (Math.random() < 0.35) emit();

        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];

          b.x += b.vx;
          b.y += b.vy;
          b.vy += 0.02;
          b.life -= 0.02;

          ctx.beginPath();
          ctx.fillStyle = `hsla(${b.hue}, 95%, 70%, ${b.life})`;
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          if (b.life <= 0) bubbles.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    }
  }

  /* =========================================================
     CURSOR GLOW TRACKING (cheap + smooth)
  ========================================================= */

  if (!prefersReduced) {
    window.addEventListener("pointermove", (e) => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }

});

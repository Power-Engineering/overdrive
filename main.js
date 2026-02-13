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
      hamburger.setAttribute("aria-expanded", String(open));
    });

    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        navLinks.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     HERO + SECTION VIDEO GOVERNOR
     Plays videos only when visible (smoother + saves CPU)
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
     VIDEO FALLBACK (fixes "other mp4 not working")
     If modshop/hazards mp4 missing -> show poster/fallback bg
  ========================================================= */
  function applyVideoFallback(videoEl) {
    if (!videoEl) return;

    const fallbackImg = videoEl.getAttribute("data-fallback-img") || videoEl.getAttribute("poster");
    const parent = videoEl.parentElement;

    const useFallback = () => {
      videoEl.pause();
      videoEl.style.display = "none";
      if (parent && fallbackImg) {
        parent.style.backgroundImage = `url("${fallbackImg}")`;
        parent.style.backgroundSize = "cover";
        parent.style.backgroundPosition = "center";
      }
    };

    // If the video can’t load
    videoEl.addEventListener("error", useFallback, { once: true });

    // If the first source 404s or fails decoding
    const source = videoEl.querySelector("source");
    if (source) {
      source.addEventListener("error", useFallback, { once: true });
    }
  }

  // Apply fallback to background section videos (not hero)
  $$(".section-hero .full-bg-video").forEach(applyVideoFallback);

  /* =========================================================
     FADE-IN ANIMATIONS
  ========================================================= */
  const fadeEls = $$(".fade-in");

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
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

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  $$(".car-card").forEach(card => {
    // Inject sheen span if missing (so you don’t have to edit HTML)
    if (!card.querySelector(".sheen")) {
      const s = document.createElement("span");
      s.className = "sheen";
      s.setAttribute("aria-hidden", "true");
      card.prepend(s);
    }

    card.addEventListener("click", () => {
      if (!modal || !modalImg || !modalTitle || !modalDesc) return;

      const name = card.dataset.car || "Car";
      const img = card.dataset.img || "";

      modalImg.src = img;
      modalImg.alt = name;
      modalTitle.textContent = name;
      modalDesc.textContent =
        `${name} is built for precision racing in OVERDRIVE. Choose upgrades carefully, control the draft, and time your boosts for maximum impact.`;

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* =========================================================
     CAR CARD TILT (desktop only, super light)
  ========================================================= */
  const finePointer = window.matchMedia("(pointer:fine)").matches;

  if (!prefersReduced && finePointer) {
    const cards = $$(".car-card.glass");

    let raf = 0;
    let activeCard = null;
    let lastX = 0;
    let lastY = 0;

    function updateTilt() {
      raf = 0;
      if (!activeCard) return;

      const rect = activeCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (lastX - cx) / rect.width;   // -0.5..0.5
      const dy = (lastY - cy) / rect.height;

      const max = 8; // degrees
      const ry = dx * max;
      const rx = -dy * max;

      activeCard.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      activeCard.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    }

    cards.forEach(card => {
      card.addEventListener("pointerenter", () => {
        activeCard = card;
      });

      card.addEventListener("pointermove", (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!raf) raf = requestAnimationFrame(updateTilt);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        if (activeCard === card) activeCard = null;
      });
    });
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
      const MAX = 48;

      function emit() {
        if (bubbles.length > MAX) return;

        const oRect = logoO.getBoundingClientRect();
        const lRect = logo.getBoundingClientRect();

        const x = oRect.left - lRect.left + oRect.width * 0.55;
        const y = oRect.top - lRect.top + oRect.height * 0.72;

        bubbles.push({
          x,
          y,
          r: Math.random() * 3 + 1.6,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -1.15 - Math.random() * 0.9,
          life: 1,
          hue: 275 + Math.random() * 25
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

        // slightly more active, still capped by MAX
        if (Math.random() < 0.45) emit();

        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.x += b.vx;
          b.y += b.vy;
          b.vy += 0.02;
          b.life -= 0.022;

          ctx.beginPath();
          ctx.fillStyle = `hsla(${b.hue}, 96%, 72%, ${Math.max(0, b.life)})`;
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          if (b.life <= 0) bubbles.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    }
  }

  /* =========================================================
     CURSOR GLOW TRACKING (cheap)
  ========================================================= */
  if (!prefersReduced) {
    window.addEventListener("pointermove", (e) => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }
});

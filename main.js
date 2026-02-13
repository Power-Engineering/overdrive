(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================
  // NAV
  // ============================
  const hamburger = $(".hamburger");
  const navLinks = $(".nav-links");

  const setNavOpen = (open) => {
    if (!hamburger || !navLinks) return;
    navLinks.classList.toggle("open", open);
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (hamburger && navLinks) {
    if (!hamburger.hasAttribute("aria-expanded")) hamburger.setAttribute("aria-expanded", "false");
    hamburger.addEventListener("click", () => setNavOpen(!navLinks.classList.contains("open")));
    navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setNavOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNavOpen(false); });
    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      const inside = navLinks.contains(e.target) || hamburger.contains(e.target);
      if (!inside) setNavOpen(false);
    });
  }

  // ============================
  // KINETIC TEXT (hero)
  // ============================
  const kinetic = $(".kinetic-text");
  if (kinetic && !kinetic.dataset.kineticDone) {
    kinetic.dataset.kineticDone = "1";
    const text = kinetic.textContent || "";
    kinetic.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.animationDelay = `${i * 0.035}s`;
      kinetic.appendChild(span);
    });
  }

  const kineticLogo = $(".kinetic-logo");
  if (kineticLogo) {
    const fire = () => {
      kineticLogo.classList.add("clicked");
      setTimeout(() => kineticLogo.classList.remove("clicked"), 220);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    kineticLogo.addEventListener("click", fire);
    kineticLogo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") fire();
    });
  }

  // ============================
  // FADE IN
  // ============================
  const fadeEls = $$(".fade-in");
  if (fadeEls.length) {
    if (prefersReduced) {
      fadeEls.forEach((el) => el.classList.add("visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      }, { threshold: 0.12 });
      fadeEls.forEach((el) => io.observe(el));
    }
  }

  // ============================
  // VIDEO GOVERNOR (play visible only)
  // ============================
  const videos = $$("video");
  const safePlay = async (v) => { try { await v.play(); } catch (_) {} };
  const pauseAll = () => { videos.forEach(v => { try { v.pause(); } catch(_) {} }); };

  videos.forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = v.id === "heroVideo" ? "auto" : "metadata";
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAll(); });

  const ratios = new Map();
  let mostVisibleVideo = null;

  const videoIO = new IntersectionObserver((entries) => {
    for (const e of entries) ratios.set(e.target, e.intersectionRatio);

    let best = null;
    let bestRatio = 0;
    for (const [v, r] of ratios.entries()) {
      if (r > bestRatio) { best = v; bestRatio = r; }
    }

    if (!best || bestRatio < 0.10) { mostVisibleVideo = null; pauseAll(); return; }

    if (mostVisibleVideo !== best) {
      mostVisibleVideo = best;
      videos.forEach((v) => { if (v !== best) { try { v.pause(); } catch(_) {} } });
      if (!document.hidden) safePlay(best);
    } else {
      if (!document.hidden) safePlay(best);
    }
  }, { threshold: [0, 0.10, 0.25, 0.50, 0.75, 0.90] });

  videos.forEach(v => videoIO.observe(v));
  window.addEventListener("load", () => {
    const heroVideo = $("#heroVideo");
    if (heroVideo && !document.hidden) safePlay(heroVideo);
  }, { once: true });

  // ============================
  // CAR MODAL
  // ============================
  const modal = $("#car-modal");
  const modalClose = $(".modal-close", modal || document);
  const modalImg = $(".modal-img", modal || document);
  const modalTitle = $(".modal-title", modal || document);
  const modalDesc = $(".modal-desc", modal || document);

  const carCards = $$(".car-card");
  const carDescriptions = {
    "Toyota GT86": "Lightweight, agile, and built for precision lines. Perfect for tight corners and late-brake plays.",
    "Nissan 370Z": "Balanced power and control. A strong all-rounder that adapts to hazards and mod paths.",
    "Audi TT": "Sharp handling with smooth acceleration. Clean tempo, reliable grip, and efficient upgrades.",
    "Ford Mustang GT": "Big power and loud presence. High-risk, high-reward aggression with explosive bursts.",
    "Mazda MX-5": "Lightweight momentum machine. Wins through consistency, drafting, and clean deck discipline."
  };

  const openModal = (card) => {
    if (!modal) return;

    const carName = card?.dataset?.car || card?.querySelector("h3")?.textContent?.trim() || "Car";
    const imgSrc = card?.dataset?.img || card?.querySelector("img")?.getAttribute("src") || "";

    if (modalTitle) modalTitle.textContent = carName;
    if (modalDesc) modalDesc.textContent = carDescriptions[carName] || "Choose your upgrades. Adapt to hazards. Take the lead.";
    if (modalImg) { modalImg.src = imgSrc; modalImg.alt = `${carName} car image`; }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    modalClose?.focus?.();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  };

  carCards.forEach((card) => {
    card.addEventListener("click", () => openModal(card));
    card.setAttribute("tabindex", card.getAttribute("tabindex") || "0");
    card.setAttribute("role", card.getAttribute("role") || "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card); }
    });
  });

  modalClose?.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => {
    const content = $(".modal-content", modal);
    if (content && !content.contains(e.target)) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  // =========================================================
  // NEW FEATURE: Purple bubble particles from the "O" in OVERDRIVE
  // - Tiny canvas inside .logo (very light)
  // - Emits bubbles from left side of word (where the O is)
  // =========================================================
  const logo = $(".logo");
  if (logo && !prefersReduced) {
    // Avoid duplicating if you hot-reload / re-run
    if (!logo.querySelector("canvas.logo-bubbles")) {
      const c = document.createElement("canvas");
      c.className = "logo-bubbles";
      logo.appendChild(c);

      const ctx = c.getContext("2d", { alpha: true });
      let w = 0, h = 0;
      const dpr = Math.min(2, window.devicePixelRatio || 1); // cap DPR for perf

      const bubbles = [];
      const MAX = 34;           // keep it small
      const EMIT_MS = 85;       // bubbles per time
      const FPS_MS = 33;        // ~30fps render cap

      function resize() {
        const r = logo.getBoundingClientRect();
        // a bit larger than text for particles
        w = Math.max(1, Math.floor(r.width + 24));
        h = Math.max(1, Math.floor(r.height + 24));
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function emit() {
        if (bubbles.length > MAX) return;

        // Emit near the left edge (roughly where the "O" starts)
        const x = 10 + Math.random() * 16;
        const y = h * 0.55 + (Math.random() - 0.5) * (h * 0.35);

        bubbles.push({
          x,
          y,
          r: 1.6 + Math.random() * 3.2,
          vx: -0.10 + Math.random() * 0.20,
          vy: -0.55 - Math.random() * 0.65,
          life: 1,
          hue: 265 + Math.random() * 30,   // purple range
          alpha: 0.55 + Math.random() * 0.25
        });
      }

      let lastEmit = 0;
      let lastFrame = 0;

      function draw(t) {
        requestAnimationFrame(draw);

        // If logo is offscreen, do nothing (perf)
        const r = logo.getBoundingClientRect();
        const onScreen = r.bottom > 0 && r.top < window.innerHeight;
        if (!onScreen) return;

        if (t - lastFrame < FPS_MS) return;
        lastFrame = t;

        // emit
        if (t - lastEmit > EMIT_MS) {
          lastEmit = t;
          emit();
          // little burst sometimes
          if (Math.random() < 0.12) emit();
        }

        ctx.clearRect(0, 0, w, h);

        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.x += b.vx;
          b.y += b.vy;

          // fade + shrink
          b.life -= 0.018;
          const a = Math.max(0, b.alpha * b.life);

          // draw glowing bubble
          ctx.beginPath();
          ctx.fillStyle = `hsla(${b.hue}, 95%, 70%, ${a})`;
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          // tiny spec highlight
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${a * 0.35})`;
          ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
          ctx.fill();

          if (b.life <= 0 || b.y < -20 || b.x < -40 || b.x > w + 40) {
            bubbles.splice(i, 1);
          }
        }
      }

      resize();
      window.addEventListener("resize", resize, { passive: true });
      requestAnimationFrame(draw);
    }
  }
})();

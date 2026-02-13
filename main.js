/* =========================================
   OVERDRIVE main.js — DEFINITIVE PERFORMANCE FIX
   Key fix: only decode/play videos when visible
   ========================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const smallScreen = window.matchMedia("(max-width: 720px)").matches;

  // =========================================================
  // 1) NAV
  // =========================================================
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
    if (navLinks.id) hamburger.setAttribute("aria-controls", navLinks.id);

    hamburger.addEventListener("click", () => setNavOpen(!navLinks.classList.contains("open")));
    navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setNavOpen(false); });

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNavOpen(false); });

    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      const inside = navLinks.contains(e.target) || hamburger.contains(e.target);
      if (!inside) setNavOpen(false);
    });
  }

  // =========================================================
  // 2) KINETIC TEXT
  // =========================================================
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
    kineticLogo.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fire(); });
  }

  // =========================================================
  // 3) REVEAL
  // =========================================================
  const fadeEls = $$(".fade-in");
  if (fadeEls.length) {
    if (prefersReduced) {
      fadeEls.forEach((el) => el.classList.add("visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.12 }
      );
      fadeEls.forEach((el) => io.observe(el));
    }
  }

  // =========================================================
  // 4) THE FIX: VIDEO GOVERNOR (ONLY PLAY WHAT'S VISIBLE)
  // =========================================================
  const videos = $$("video");

  // Always make videos cheap
  videos.forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("webkit-playsinline", "");
    // avoid eager loading for non-hero: we’ll still allow metadata
    if (v.id !== "heroVideo") v.preload = "metadata";
  });

  // Helper safe play
  const safePlay = async (v) => {
    try { await v.play(); } catch (_) {}
  };

  // Pause everything (used on tab hide)
  const pauseAll = () => { videos.forEach(v => { try { v.pause(); } catch(_) {} }); };

  // If tab hidden, pause decoding (massive perf win)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAll();
  });

  // We will keep ONE "active" video at a time (the most visible one)
  let mostVisibleVideo = null;

  // Track intersection ratios to decide which video should run
  const ratios = new Map(); // video -> ratio

  const videoIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      ratios.set(e.target, e.intersectionRatio);
    }

    // Pick the video with the highest ratio
    let best = null;
    let bestRatio = 0;

    for (const [v, r] of ratios.entries()) {
      if (r > bestRatio) {
        best = v;
        bestRatio = r;
      }
    }

    // If nothing is visible enough, pause all
    if (!best || bestRatio < 0.10) {
      mostVisibleVideo = null;
      pauseAll();
      return;
    }

    // Switch active video
    if (mostVisibleVideo !== best) {
      mostVisibleVideo = best;

      // Pause all others FIRST (prevents multi-decode)
      videos.forEach((v) => { if (v !== best) { try { v.pause(); } catch(_) {} } });

      // Play the active one
      if (!document.hidden) safePlay(best);
    } else {
      // Keep it playing if it's supposed to be active
      if (!document.hidden) safePlay(best);
    }
  }, {
    threshold: [0, 0.10, 0.25, 0.50, 0.75, 0.90]
  });

  // Observe every video
  videos.forEach(v => videoIO.observe(v));

  // Also attempt play after load (for hero)
  window.addEventListener("load", () => {
    const hero = $("#heroVideo");
    if (hero && !document.hidden) safePlay(hero);
  }, { once: true });

  // =========================================================
  // 5) HERO FX: throttle hard (video smoothness priority)
  // =========================================================
  const ring1 = $(".ring.r1");
  const ring2 = $(".ring.r2");
  const ring3 = $(".ring.r3");
  const canvas = $("#fxParticles");
  const heroSection = $(".hero");
  const heroVideo = $("#heroVideo");

  // Hard-disable FX on small screens or reduced motion
  const fxDisabledHard = prefersReduced || smallScreen;

  // OPTIONAL: disable particles while hero is visible (max smoothness)
  // keep TRUE if you want absolute smooth hero.
  const DISABLE_PARTICLES_WHILE_HERO_VISIBLE = true;

  let heroVisible = true;
  if (heroSection) {
    const heroIO = new IntersectionObserver((entries) => {
      for (const e of entries) heroVisible = e.isIntersecting;
    }, { threshold: 0.12 });
    heroIO.observe(heroSection);
  }

  // Rings: cap to ~24fps (more than enough, way cheaper)
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let ringLast = 0;

  if (!fxDisabledHard && (ring1 || ring2 || ring3)) {
    window.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx;
      targetY = (e.clientY - cy) / cy;
    }, { passive: true });

    const ringTick = (ts) => {
      requestAnimationFrame(ringTick);
      if (!heroVisible) return;
      if (ts - ringLast < 42) return; // ~24fps
      ringLast = ts;

      mouseX = lerp(mouseX, targetX, 0.10);
      mouseY = lerp(mouseY, targetY, 0.10);

      const s = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
      const strength = 0.55 * (1 - s) + 0.08;

      if (ring1) ring1.style.translate = `${(mouseX * 10 * strength).toFixed(2)}px ${(mouseY * 7 * strength).toFixed(2)}px`;
      if (ring2) ring2.style.translate = `${(mouseX * -8 * strength).toFixed(2)}px ${(mouseY * 9 * strength).toFixed(2)}px`;
      if (ring3) ring3.style.translate = `${(mouseX * 6 * strength).toFixed(2)}px ${(mouseY * -6 * strength).toFixed(2)}px`;
    };

    requestAnimationFrame(ringTick);
  }

  // Particles: 20–30fps with LOW DPR + dynamic count
  if (!fxDisabledHard && canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });

    let w = 0, h = 0;
    let dpr = 1; // keep cheap always
    let particles = [];
    let targetCount = 28; // MUCH lower by default
    let running = true;

    const fpsCapMs = 50; // ~20fps
    let lastFrameTs = 0;

    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles(count) {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.7, 1.6),
          vx: rand(-0.10, 0.10),
          vy: rand(-0.08, 0.14),
          a: rand(0.10, 0.30),
          hue: rand(200, 275)
        });
      }
      return arr;
    }

    function draw(ts) {
      requestAnimationFrame(draw);
      if (!running) return;
      if (!heroVisible) return;

      // absolute priority: hero video
      if (DISABLE_PARTICLES_WHILE_HERO_VISIBLE && heroVideo) return;

      if (ts - lastFrameTs < fpsCapMs) return;
      lastFrameTs = ts;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Pause particles if hero not visible using IO
    if (heroSection) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          running = e.isIntersecting;
        }
      }, { threshold: 0.12 });
      io.observe(heroSection);
    }

    resize();
    particles = makeParticles(targetCount);

    window.addEventListener("resize", () => {
      resize();
      particles = makeParticles(targetCount);
    }, { passive: true });

    requestAnimationFrame(draw);
  }

  // =========================================================
  // 6) CAR MODAL
  // =========================================================
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
    if (modalImg) {
      modalImg.src = imgSrc;
      modalImg.alt = `${carName} car image`;
    }

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
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  modalClose?.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      const content = $(".modal-content", modal);
      if (content && !content.contains(e.target)) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  // =========================================================
  // 7) TILT (desktop only)
  // =========================================================
  if (!prefersReduced && hoverCapable) {
    carCards.forEach((card) => {
      let raf = 0;
      const onMove = (e) => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const rx = clamp((0.5 - py) * 10, -8, 8);
          const ry = clamp((px - 0.5) * 12, -10, 10);
          card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      };
      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);
      card.addEventListener("blur", reset);
    });
  }
})();

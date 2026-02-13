/* =========================================
   OVERDRIVE main.js — HERO LAG FIX (Full Replacement)
   Goal: smooth hero video + mobile fixes preserved
   ========================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ============================
  // 1) Mobile Nav (hamburger)
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
    if (navLinks.id) hamburger.setAttribute("aria-controls", navLinks.id);

    hamburger.addEventListener("click", () => setNavOpen(!navLinks.classList.contains("open")));
    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNavOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      const inside = navLinks.contains(e.target) || hamburger.contains(e.target);
      if (!inside) setNavOpen(false);
    });
  }

  // ============================
  // 2) Kinetic Text
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
  // 3) Fade-in on scroll
  // ============================
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

  // ============================
  // 4) Hero video management
  // ============================
  const hero = $(".hero");
  const heroVideo = $("#heroVideo");

  const tryPlay = () => heroVideo?.play?.().catch(() => {});
  if (heroVideo) {
    window.addEventListener("load", tryPlay, { once: true });
  }

  // ============================
  // 5) Hero button sparkle coords
  // ============================
  const heroBtn = $(".hero-btn");
  if (heroBtn) {
    heroBtn.addEventListener("pointerdown", (e) => {
      const r = heroBtn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      heroBtn.style.setProperty("--x", `${x}%`);
      heroBtn.style.setProperty("--y", `${y}%`);
    });
  }

  // ============================
  // 6) Car Modal
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

  // ============================
  // 7) Tilt hover (desktop only)
  // ============================
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

  // =========================================================
  // 8) HERO FX PERFORMANCE SYSTEM (Particles + Rings)
  // =========================================================

  const ring1 = $(".ring.r1");
  const ring2 = $(".ring.r2");
  const ring3 = $(".ring.r3");
  const canvas = $("#fxParticles");

  // Helper: detect low-power / should-throttle
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!conn?.saveData;
  const effectiveType = conn?.effectiveType || "";
  const lowNetwork = /2g/.test(effectiveType);
  const smallScreen = window.matchMedia("(max-width: 720px)").matches;

  // On mobile or reduced-motion, kill FX entirely (CSS also hides them, but we stop JS too)
  const fxDisabledHard = prefersReduced || saveData || lowNetwork || smallScreen;

  // Pause FX when hero not visible
  let heroVisible = true;
  if (hero) {
    const heroIO = new IntersectionObserver((entries) => {
      for (const e of entries) heroVisible = e.isIntersecting;
      // Pause video when not visible too
      if (heroVideo) {
        if (heroVisible) tryPlay();
        else heroVideo.pause();
      }
    }, { threshold: 0.12 });
    heroIO.observe(hero);
  }

  // ----------------------------
  // 8A) Rings parallax (cheap)
  // ----------------------------
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  // We’ll only run ring/parallax updates at ~30fps, not 60fps
  let ringLast = 0;

  if (!fxDisabledHard && (ring1 || ring2 || ring3)) {
    window.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx;
      targetY = (e.clientY - cy) / cy;
    }, { passive: true });

    const ringTick = (ts) => {
      if (!heroVisible) return requestAnimationFrame(ringTick); // still keep loop alive but do nothing
      if (ts - ringLast < 33) return requestAnimationFrame(ringTick); // ~30fps cap
      ringLast = ts;

      mouseX = lerp(mouseX, targetX, 0.08);
      mouseY = lerp(mouseY, targetY, 0.08);

      // Reduce strength near top where video plays (lower compositing cost)
      const s = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
      const strength = 0.65 * (1 - s) + 0.10; // 0.75 -> 0.10

      if (ring1) ring1.style.translate = `${(mouseX * 12 * strength).toFixed(2)}px ${(mouseY * 8 * strength).toFixed(2)}px`;
      if (ring2) ring2.style.translate = `${(mouseX * -9 * strength).toFixed(2)}px ${(mouseY * 10 * strength).toFixed(2)}px`;
      if (ring3) ring3.style.translate = `${(mouseX * 7 * strength).toFixed(2)}px ${(mouseY * -7 * strength).toFixed(2)}px`;

      requestAnimationFrame(ringTick);
    };

    requestAnimationFrame(ringTick);
  }

  // ----------------------------
  // 8B) Particles — 30fps + dynamic quality scaling
  // ----------------------------
  if (!fxDisabledHard && canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });

    let w = 0, h = 0;

    // Dynamic resolution: start at 1.0 DPR for cheap draw
    // If you have a monster GPU you can raise it later, but 1.0 is smooth.
    let dpr = 1;

    // Dynamic particle count
    let targetCount = 55;
    let particles = [];

    // 30fps cap
    const fpsCapMs = 33;
    let lastFrameTs = 0;

    // FPS monitor
    let fpsSamples = [];
    let lastFpsCheck = performance.now();

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
          r: rand(0.7, 1.8),
          vx: rand(-0.14, 0.14),
          vy: rand(-0.10, 0.18),
          a: rand(0.10, 0.40),
          hue: rand(195, 280)
        });
      }
      return arr;
    }

    function ensureCount() {
      if (particles.length === targetCount) return;
      particles = makeParticles(targetCount);
    }

    // Quality manager: if FPS low, reduce count + resolution
    function adjustQuality(avgFps) {
      // If hero video is visible and we're struggling, prioritize video smoothness:
      // reduce particles hard.
      if (avgFps < 50) {
        targetCount = Math.max(20, Math.floor(targetCount * 0.80));
        dpr = 1; // keep cheap
      }
      if (avgFps < 40) {
        targetCount = Math.max(14, Math.floor(targetCount * 0.75));
        dpr = 1;
      }
      if (avgFps > 57 && targetCount < 60) {
        // cautiously scale up if stable
        targetCount = Math.min(60, targetCount + 2);
      }
      ensureCount();
    }

    // Optional: if you want MAX video smoothness, disable particles while hero is in view.
    // Change to false if you want particles always.
    const DISABLE_PARTICLES_WHILE_HERO_VISIBLE = true;

    function draw(ts) {
      requestAnimationFrame(draw);

      if (!heroVisible) return; // offscreen: do nothing
      if (DISABLE_PARTICLES_WHILE_HERO_VISIBLE && heroVideo) {
        // Video exists and hero is visible: skip particle drawing entirely for max smoothness.
        // (You still get rings/scanlines.)
        return;
      }

      if (ts - lastFrameTs < fpsCapMs) return;
      const dt = ts - lastFrameTs;
      lastFrameTs = ts;

      // FPS samples
      const fps = 1000 / Math.max(1, dt);
      fpsSamples.push(fps);

      // Periodic quality adjustment (every ~1.2s)
      const now = ts;
      if (now - lastFpsCheck > 1200) {
        const avg = fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, fpsSamples.length);
        fpsSamples = [];
        lastFpsCheck = now;
        adjustQuality(avg);
      }

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

    // Init
    resize();
    particles = makeParticles(targetCount);

    window.addEventListener("resize", () => {
      resize();
      particles = makeParticles(targetCount);
    }, { passive: true });

    requestAnimationFrame(draw);
  }

})();

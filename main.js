/* =========================================
   OVERDRIVE main.js — Hero Smoothness + Perf Watchdog
   Full replacement
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
  // 0) PERFORMANCE WATCHDOG (auto-disable heavy FX if FPS drops)
  // =========================================================
  if (!prefersReduced) {
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    let lowCount = 0;

    const tick = (t) => {
      frames++;
      const dt = t - last;
      last = t;

      // ignore huge spikes (tab switching)
      if (dt < 200) acc += 1000 / Math.max(1, dt);

      // evaluate roughly every ~1s
      if (frames >= 60) {
        const fps = acc / frames;
        acc = 0;
        frames = 0;

        // If sustained < 52fps, enter perf-low mode
        if (fps < 52) lowCount++;
        else lowCount = Math.max(0, lowCount - 1);

        const perfLow = lowCount >= 2;
        document.body.classList.toggle("perf-low", perfLow);
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // =========================================================
  // 1) NAV (hamburger)
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
  // 4) VIDEO GOVERNOR (play only visible videos)
  // =========================================================
  const videos = $$("video");
  videos.forEach((v) => {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = v.id === "heroVideo" ? "auto" : "metadata";
  });

  const safePlay = async (v) => { try { await v.play(); } catch (_) {} };
  const pauseAll = () => { videos.forEach(v => { try { v.pause(); } catch(_) {} }); };

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

    if (!best || bestRatio < 0.10) {
      mostVisibleVideo = null;
      pauseAll();
      return;
    }

    if (mostVisibleVideo !== best) {
      mostVisibleVideo = best;
      videos.forEach((v) => { if (v !== best) { try { v.pause(); } catch(_) {} } });
      if (!document.hidden) safePlay(best);
    } else {
      if (!document.hidden) safePlay(best);
    }
  }, { threshold: [0, 0.10, 0.25, 0.50, 0.75, 0.90] });

  videos.forEach(v => videoIO.observe(v));

  const heroVideo = $("#heroVideo");
  window.addEventListener("load", () => { if (heroVideo && !document.hidden) safePlay(heroVideo); }, { once: true });

  // =========================================================
  // 5) HERO FX: OFF while hero visible (max smoothness)
  // =========================================================
  const hero = $(".hero");
  const canvas = $("#fxParticles");
  const ring1 = $(".ring.r1");
  const ring2 = $(".ring.r2");
  const ring3 = $(".ring.r3");

  const fxDisabledHard = prefersReduced || smallScreen;

  let heroVisible = true;
  if (hero) {
    const heroIO = new IntersectionObserver((entries) => {
      for (const e of entries) heroVisible = e.isIntersecting;
      document.body.classList.toggle("hero-in-view", heroVisible);
    }, { threshold: 0.20 });
    heroIO.observe(hero);
  }

  // Cursor glow spotlight (cheap wow) — only desktop
  if (!fxDisabledHard && hoverCapable) {
    let mx = 0, my = 0, tx = 0, ty = 0;
    let last = 0;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    const glowTick = (t) => {
      requestAnimationFrame(glowTick);
      if (t - last < 24) return; // ~40fps throttle
      last = t;
      mx = lerp(mx, tx, 0.12);
      my = lerp(my, ty, 0.12);
      document.documentElement.style.setProperty("--mx", `${mx}px`);
      document.documentElement.style.setProperty("--my", `${my}px`);
    };
    requestAnimationFrame(glowTick);
  }

  // Rings parallax only when hero NOT visible (so hero video stays perfect)
  if (!fxDisabledHard && (ring1 || ring2 || ring3)) {
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    let ringLast = 0;

    window.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx;
      targetY = (e.clientY - cy) / cy;
    }, { passive: true });

    const ringTick = (ts) => {
      requestAnimationFrame(ringTick);
      if (heroVisible) return; // OFF during hero
      if (ts - ringLast < 42) return; // ~24fps
      ringLast = ts;

      mouseX = lerp(mouseX, targetX, 0.12);
      mouseY = lerp(mouseY, targetY, 0.12);

      const strength = 0.35;
      if (ring1) ring1.style.translate = `${(mouseX * 10 * strength).toFixed(2)}px ${(mouseY * 7 * strength).toFixed(2)}px`;
      if (ring2) ring2.style.translate = `${(mouseX * -8 * strength).toFixed(2)}px ${(mouseY * 9 * strength).toFixed(2)}px`;
      if (ring3) ring3.style.translate = `${(mouseX * 6 * strength).toFixed(2)}px ${(mouseY * -6 * strength).toFixed(2)}px`;
    };
    requestAnimationFrame(ringTick);
  }

  // Particles: only run when hero NOT visible (so hero video is untouched)
  if (!fxDisabledHard && canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0;
    const dpr = 1;           // keep cheap
    const COUNT = 26;        // low by default
    const fpsCapMs = 50;     // ~20fps
    let lastFrame = 0;

    const rand = (a, b) => a + Math.random() * (b - a);
    let particles = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: rand(0, w), y: rand(0, h),
        r: rand(0.7, 1.5),
        vx: rand(-0.10, 0.10),
        vy: rand(-0.08, 0.14),
        a: rand(0.10, 0.28),
        hue: rand(200, 275)
      }));
    };

    const draw = (t) => {
      requestAnimationFrame(draw);

      // OFF during hero for max smoothness
      if (heroVisible) return;
      if (document.body.classList.contains("perf-low")) return;

      if (t - lastFrame < fpsCapMs) return;
      lastFrame = t;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize(); init();
    window.addEventListener("resize", () => { resize(); init(); }, { passive: true });
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

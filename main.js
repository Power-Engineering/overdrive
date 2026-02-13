/* =========================================
   OVERDRIVE main.js — Cinematic Motion Layer
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

  // ----------------------------
  // 1) Mobile Nav (hamburger)
  // ----------------------------
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

    hamburger.addEventListener("click", () => {
      const open = !navLinks.classList.contains("open");
      setNavOpen(open);
    });

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

  // ----------------------------
  // 2) Kinetic Text (hero title)
  // ----------------------------
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

  // Logo click micro-interaction
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

  // ----------------------------
  // 3) Scroll Reveal (fade-in)
  // ----------------------------
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

  // ----------------------------
  // 4) Hero video play/pause management (smoothness)
  // ----------------------------
  const heroVideo = $("#heroVideo");
  if (heroVideo) {
    const tryPlay = () => heroVideo.play().catch(() => {});
    window.addEventListener("load", tryPlay, { once: true });

    // Pause when offscreen to reduce stutter later
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) tryPlay();
          else heroVideo.pause();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(heroVideo);
  }

  // ----------------------------
  // 5) Hero button sparkle coords
  // ----------------------------
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

  // ----------------------------
  // 6) Car Modal
  // ----------------------------
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

    const carName =
      card?.dataset?.car ||
      card?.querySelector("h3")?.textContent?.trim() ||
      "Car";

    const imgSrc =
      card?.dataset?.img ||
      card?.querySelector("img")?.getAttribute("src") ||
      "";

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

  // ----------------------------
  // 7) Premium Tilt Hover (lightweight)
  // ----------------------------
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

  // ----------------------------
  // 8) Cinematic Rings + Parallax (WOW factor)
  // ----------------------------
  const ring1 = $(".ring.r1");
  const ring2 = $(".ring.r2");
  const ring3 = $(".ring.r3");

  // We’ll “nudge” transforms on top of CSS spin animations with translate offsets only,
  // so the animation stays cheap (no heavy 3D).
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  if (!prefersReduced && (ring1 || ring2 || ring3)) {
    window.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx; // -1..1
      targetY = (e.clientY - cy) / cy; // -1..1
    }, { passive: true });

    const onScroll = () => {
      // scroll progress 0..1 through first viewport
      const s = clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);

      // higher = more movement near top, settles as you scroll down
      const strength = 1 - s;

      const x1 = mouseX * 16 * strength;
      const y1 = mouseY * 10 * strength;
      const x2 = mouseX * -10 * strength;
      const y2 = mouseY * 14 * strength;
      const x3 = mouseX * 8 * strength;
      const y3 = mouseY * -8 * strength;

      if (ring1) ring1.style.translate = `${x1}px ${y1}px`;
      if (ring2) ring2.style.translate = `${x2}px ${y2}px`;
      if (ring3) ring3.style.translate = `${x3}px ${y3}px`;
    };

    const tick = () => {
      // Smooth mouse easing
      mouseX = lerp(mouseX, targetX, 0.08);
      mouseY = lerp(mouseY, targetY, 0.08);

      onScroll();
      requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
  }

  // ----------------------------
  // 9) Particle Canvas (fast “premium dust”)
  // ----------------------------
  const canvas = $("#fxParticles");
  if (!prefersReduced && canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const particles = [];
    const COUNT = 45;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.6, 2.1),
          vx: rand(-0.18, 0.18),
          vy: rand(-0.12, 0.22),
          a: rand(0.14, 0.52),
          hue: rand(190, 280)
        });
      }
    };

    const draw = () => {
      if (!running) return;
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

      requestAnimationFrame(draw);
    };

    // Pause particles when hero not visible (performance)
    const hero = $(".hero");
    if (hero) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            running = e.isIntersecting;
            if (running) requestAnimationFrame(draw);
          }
        },
        { threshold: 0.12 }
      );
      io.observe(hero);
    }

    resize();
    init();
    requestAnimationFrame(draw);

    window.addEventListener("resize", () => {
      resize();
      init();
    }, { passive: true });
  }
})();

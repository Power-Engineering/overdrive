/* =========================================
   OVERDRIVE main.js — Premium UX upgrade
   (Full replacement, compatible with your existing classes)
   ========================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
    // Ensure ARIA wiring exists
    if (!hamburger.hasAttribute("aria-expanded")) hamburger.setAttribute("aria-expanded", "false");
    if (navLinks.id) hamburger.setAttribute("aria-controls", navLinks.id);

    hamburger.addEventListener("click", () => {
      const open = !navLinks.classList.contains("open");
      setNavOpen(open);
    });

    // Close nav when clicking a link
    navLinks.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      setNavOpen(false);
    });

    // Close nav on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });

    // Close nav when clicking outside (mobile)
    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      const clickedInside = navLinks.contains(e.target) || hamburger.contains(e.target);
      if (!clickedInside) setNavOpen(false);
    });
  }

  // ----------------------------
  // 2) Kinetic Text (hero title)
  // ----------------------------
  const kinetic = $(".kinetic-text");
  if (kinetic) {
    // Only wrap once
    if (!kinetic.dataset.kineticDone) {
      kinetic.dataset.kineticDone = "1";

      const text = kinetic.textContent || "";
      kinetic.textContent = "";

      // Create spans per character for animation
      [...text].forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.animationDelay = `${i * 0.035}s`;
        kinetic.appendChild(span);
      });
    }
  }

  // Clicky logo micro-interaction (keeps your old class)
  const kineticLogo = $(".kinetic-logo");
  if (kineticLogo) {
    const fire = () => {
      kineticLogo.classList.add("clicked");
      window.setTimeout(() => kineticLogo.classList.remove("clicked"), 220);
      // Optional: scroll to top on logo click if it’s meant to be “home”
      // window.scrollTo({ top: 0, behavior: "smooth" });
    };

    kineticLogo.addEventListener("click", fire);
    kineticLogo.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") fire();
    });
  }

  // ----------------------------
  // 3) Fade-in on scroll (elements with .fade-in)
  // ----------------------------
  const fadeEls = $$(".fade-in");
  if (fadeEls.length) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      fadeEls.forEach((el) => el.classList.add("visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("visible");
            io.unobserve(entry.target); // reveal once
          }
        },
        { threshold: 0.12 }
      );

      fadeEls.forEach((el) => io.observe(el));
    }
  }

  // ----------------------------
  // 4) Hero button sparkle coordinates (optional polish)
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
  // 5) Car Modal (cards -> modal)
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
    "Mazda MX-5": "Classic lightweight momentum. Wins through consistency, drafting, and smart deck discipline."
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

    // Focus close button for accessibility
    if (modalClose) modalClose.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  };

  carCards.forEach((card) => {
    card.addEventListener("click", () => openModal(card));
    // keyboard accessible
    card.setAttribute("tabindex", card.getAttribute("tabindex") || "0");
    card.setAttribute("role", card.getAttribute("role") || "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);

  // Click outside modal-content closes it
  if (modal) {
    modal.addEventListener("click", (e) => {
      const content = $(".modal-content", modal);
      if (content && !content.contains(e.target)) closeModal();
    });
  }

  // Escape closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  // ----------------------------
  // 6) “Premium” Tilt Hover for car cards (lightweight)
  // ----------------------------
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced) {
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    carCards.forEach((card) => {
      let raf = 0;

      const onMove = (e) => {
        if (raf) cancelAnimationFrame(raf);

        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;   // 0..1
          const py = (e.clientY - rect.top) / rect.height;  // 0..1

          const rx = clamp((0.5 - py) * 10, -8, 8); // rotateX
          const ry = clamp((px - 0.5) * 12, -10, 10); // rotateY

          card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      };

      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      };

      // Only tilt on hover-capable devices
      const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!hoverCapable) return;

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);
      card.addEventListener("blur", reset);
    });
  }
})();

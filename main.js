document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;

  /* =========================================================
     Helpers
  ========================================================= */
  const slug = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const uniq = (arr) => Array.from(new Set(arr));

  function imageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url + (url.includes("?") ? "" : `?v=${Date.now()}`); // bypass cache for checking
    });
  }

  async function pickFirstWorkingImage(urls) {
    for (const u of urls) {
      // eslint-disable-next-line no-await-in-loop
      if (await imageExists(u)) return u;
    }
    return null;
  }

  function trySetVideoSources(videoEl, urls) {
    if (!videoEl) return false;

    // Clear existing sources
    videoEl.pause();
    videoEl.querySelectorAll("source").forEach(s => s.remove());

    // Add candidates (mp4 first; browser will ignore unsupported)
    urls.forEach(u => {
      const s = document.createElement("source");
      s.src = u;
      if (u.endsWith(".webm")) s.type = "video/webm";
      else if (u.endsWith(".mp4")) s.type = "video/mp4";
      videoEl.appendChild(s);
    });

    // Force reload
    try { videoEl.load(); } catch {}
    return true;
  }

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
     VIDEO GOVERNOR (smoothness)
  ========================================================= */
  const videos = $$("video");
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const vid = entry.target;
        if (entry.isIntersecting) vid.play().catch(() => {});
        else vid.pause();
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
     FADE-IN
  ========================================================= */
  const fadeEls = $$(".fade-in");
  const fadeObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add("visible")),
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

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  /* =========================================================
     AUTO-FIX CAR IMAGES (Mustang/Mazda + all cars)
     Your site currently tries /assets/cars/*.png and 404s. :contentReference[oaicite:1]{index=1}
     This will try likely filenames and folders until it finds one.
  ========================================================= */
  async function fixCarImages() {
    const cards = $$(".car-card");
    for (const card of cards) {
      const name = card.dataset.car || card.querySelector("h3")?.textContent || "car";
      const s = slug(name);

      const imgEl = card.querySelector("img");
      if (!imgEl) continue;

      // Inject sheen span (for your fancy effect) if missing
      if (!card.querySelector(".sheen")) {
        const sheen = document.createElement("span");
        sheen.className = "sheen";
        sheen.setAttribute("aria-hidden", "true");
        card.prepend(sheen);
      }

      // Candidate paths (add more if your repo uses different naming)
      const candidates = uniq([
        `./assets/car-${s}.jpg`,
        `./assets/car-${s}.png`,
        `./assets/car-${s}.webp`,
        `./assets/${s}.jpg`,
        `./assets/${s}.png`,
        `./assets/${s}.webp`,

        // common variations
        `./assets/car-${s.replace("-gt", "")}.jpg`,
        `./assets/car-${s.replace("-gt", "")}.png`,
        `./assets/car-${s.replace("ford-", "")}.jpg`,
        `./assets/car-${s.replace("ford-", "")}.png`,
        `./assets/car-${s.replace("mazda-", "")}.jpg`,
        `./assets/car-${s.replace("mazda-", "")}.png`,

        // if you ever add a folder later
        `./assets/cars/${s}.jpg`,
        `./assets/cars/${s}.png`,
        `./assets/cars/${s}.webp`,
      ]);

      // If it already has a working image, keep it
      const current = imgEl.getAttribute("src");
      if (current && current !== "./assets/hero-bg.jpg") {
        // best effort: leave
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const found = await pickFirstWorkingImage(candidates);
      if (found) {
        imgEl.src = found;
        card.dataset.img = found; // modal will use this
      } else {
        // fallback stays hero-bg.jpg (no broken image)
        card.dataset.img = "./assets/hero-bg.jpg";
      }

      // Modal click
      card.addEventListener("click", () => {
        if (!modal || !modalImg || !modalTitle || !modalDesc) return;

        const img = card.dataset.img || imgEl.src || "./assets/hero-bg.jpg";

        modalImg.src = img;
        modalImg.alt = name;
        modalTitle.textContent = name;
        modalDesc.textContent =
          `${name} is built for precision racing in OVERDRIVE. Choose upgrades carefully, control the draft, and time your boosts for maximum impact.`;

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
      }, { once: true });
    }
  }

  fixCarImages().catch(() => {});

  /* =========================================================
     CAR CARD TILT (desktop only)
  ========================================================= */
  if (!prefersReduced && finePointer) {
    const cards = $$(".car-card.glass");
    let raf = 0;
    let active = null;
    let lastX = 0, lastY = 0;

    function updateTilt() {
      raf = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (lastX - cx) / r.width;
      const dy = (lastY - cy) / r.height;
      const max = 8;
      active.style.setProperty("--ry", `${(dx * max).toFixed(2)}deg`);
      active.style.setProperty("--rx", `${(-dy * max).toFixed(2)}deg`);
    }

    cards.forEach(card => {
      card.addEventListener("pointerenter", () => { active = card; });
      card.addEventListener("pointermove", (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!raf) raf = requestAnimationFrame(updateTilt);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        if (active === card) active = null;
      });
    });
  }

  /* =========================================================
     AUTO-FIX SECTION VIDEOS (modshop/hazards)
     Tries common filenames; if none work -> poster background.
  ========================================================= */
  function fallbackToImage(videoEl) {
    const fallbackImg = videoEl.getAttribute("data-fallback-img") || videoEl.getAttribute("poster");
    const parent = videoEl.parentElement;
    videoEl.pause();
    videoEl.style.display = "none";
    if (parent && fallbackImg) {
      parent.style.backgroundImage = `url("${fallbackImg}")`;
      parent.style.backgroundSize = "cover";
      parent.style.backgroundPosition = "center";
    }
  }

  async function fixSectionVideo(sectionId, baseName) {
    const section = document.getElementById(sectionId);
    const videoEl = section?.querySelector("video");
    if (!videoEl) return;

    // Candidate files (add more if you rename files later)
    const candidates = uniq([
      `./assets/${baseName}.mp4`,
      `./assets/${baseName}.webm`,
      `./assets/${baseName}-bg.mp4`,
      `./assets/${baseName}-bg.webm`,
      `./assets/${baseName}cover.mp4`,
      `./assets/${baseName}cover.webm`,
      `./assets/${baseName}-cover.mp4`,
      `./assets/${baseName}-cover.webm`,
      `./assets/${sectionId}.mp4`,
      `./assets/${sectionId}.webm`,
    ]);

    // Check by attempting to load first frame via fetch HEAD-like (Image trick won’t work for video).
    // We'll "optimistically set sources" then detect if it errors quickly.
    trySetVideoSources(videoEl, candidates);

    let settled = false;
    const onCanPlay = () => { settled = true; cleanup(); };
    const onError = () => { settled = true; cleanup(); fallbackToImage(videoEl); };

    const cleanup = () => {
      videoEl.removeEventListener("canplay", onCanPlay);
      videoEl.removeEventListener("error", onError);
    };

    videoEl.addEventListener("canplay", onCanPlay, { once: true });
    videoEl.addEventListener("error", onError, { once: true });

    // If nothing happens in 2s, assume fail and fallback
    setTimeout(() => {
      if (!settled) {
        cleanup();
        fallbackToImage(videoEl);
      }
    }, 2000);
  }

  fixSectionVideo("modshop", "modshop");
  fixSectionVideo("hazards", "hazards");

  /* =========================================================
     PURPLE BUBBLES FROM THE "O" (logo)
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
        const r = logo.getBoundingClientRect();
        w = r.width + 40;
        h = r.height + 40;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      resize();
      window.addEventListener("resize", resize, { passive: true });

      const bubbles = [];
      const MAX = 52;
      let last = 0;

      function emit() {
        if (bubbles.length > MAX) return;

        const o = logoO.getBoundingClientRect();
        const l = logo.getBoundingClientRect();
        const x = (o.left - l.left) + o.width * 0.55;
        const y = (o.top - l.top) + o.height * 0.72;

        bubbles.push({
          x, y,
          r: Math.random() * 3 + 1.6,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -1.15 - Math.random() * 0.9,
          life: 1,
          hue: 275 + Math.random() * 25
        });
      }

      function frame(t) {
        requestAnimationFrame(frame);
        // 30fps cap
        if (t - last < 33) return;
        last = t;

        const r = logo.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;

        ctx.clearRect(0, 0, w, h);
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
      requestAnimationFrame(frame);
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

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Analytics (Google Analytics 4) + event tracking ----------
     Paste your GA4 Measurement ID below (looks like G-ABCD1234). Until then
     analytics stays dormant but the page works normally. Once set, the site
     records page views automatically plus: PDF downloads, outbound link
     clicks, and contact-form submissions. */
  const GA_MEASUREMENT_ID = 'G-V5EVW5VW9Y';
  (function analytics() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    const live = /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID);
    if (live) {
      const s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
      document.head.appendChild(s);
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    }
    const track = (name, params) => {
      try { gtag('event', name, params || {}); } catch (e) {}
      if (!live) console.debug('[analytics]', name, params || {});
    };
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      let url; try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (/\.pdf(\?|$)/i.test(url.pathname)) {
        track('file_download', { file_name: decodeURIComponent(url.pathname.split('/').pop()), file_extension: 'pdf', link_url: url.href });
      } else if (url.host && url.host !== location.host) {
        track('outbound_click', { link_url: url.href, link_domain: url.host, link_text: (a.textContent || '').trim().slice(0, 80) });
      }
    }, true);
    const cf = document.querySelector('.contact-form');
    if (cf) cf.addEventListener('submit', () => track('contact_submit', { method: 'formsubmit' }));
  })();

  /* ---------- Mobile menu ---------- */
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.primary-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('#year').forEach((y) => { y.textContent = new Date().getFullYear(); });

  /* ---------- Scroll progress bar + header state ---------- */
  const bar = document.querySelector('.scroll-progress');
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    if (bar) {
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
    }
    if (header) header.classList.toggle('scrolled', scrolled > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const runCount = (el) => {
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1500; const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ============================================================
     HERO CANVAS: Golden Spiral (rotating particles) — tiny dots
     ============================================================ */
  const canvas = document.getElementById('phase-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Configuration
    const NUM_PARTICLES = 150;
    const SPIRAL_TURNS = 4;
    const GROWTH_RATE = 0.3;
    const ROTATION_SPEED = 0.008;

    let particles = [];
    let angleOffset = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Initialize particles along a Fibonacci / Golden spiral
    function initParticles() {
      particles = [];
      const centerX = W / 2;
      const centerY = H / 2;
      const maxRadius = Math.min(W, H) * 0.4;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < NUM_PARTICLES; i++) {
        const t = i / NUM_PARTICLES;
        const radius = maxRadius * Math.pow(t, 0.7);
        const angle = goldenAngle * i * 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // --- TINY PARTICLES (0.5 to 1.5 px) ---
        const size = 0.5 + 1.0 * (1 - t);
        const opacity = 0.4 + 0.6 * (1 - t);
        particles.push({
          x, y,
          baseX: x,
          baseY: y,
          radius: radius,
          angle: angle,
          size: size,
          opacity: opacity,
          phase: i / NUM_PARTICLES * Math.PI * 2,
        });
      }
    }

    function render() {
      angleOffset += ROTATION_SPEED;
      ctx.clearRect(0, 0, W, H);

      const centerX = W / 2;
      const centerY = H / 2;
      const maxRadius = Math.min(W, H) * 0.4;

      // Draw particles with reduced glow
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const angle = p.angle + angleOffset;
        const radius = p.radius * (1 + 0.05 * Math.sin(angleOffset * 0.5 + p.phase));
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        const t = radius / maxRadius;
        const hue = 45 + 180 * t;
        const lightness = 60 + 30 * (1 - t);
        ctx.fillStyle = `hsla(${hue}, 90%, ${lightness}%, ${p.opacity})`;
        // --- Reduced glow (2 to 4 px) ---
        const blur = 2 + 2 * (1 - t);
        ctx.shadowColor = `hsla(${hue}, 90%, 70%, 0.4)`;
        ctx.shadowBlur = blur;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Faint connecting lines
      ctx.beginPath();
      for (let i = 0; i < particles.length - 1; i++) {
        const p1 = particles[i];
        const p2 = particles[i + 1];
        const angle1 = p1.angle + angleOffset;
        const radius1 = p1.radius * (1 + 0.05 * Math.sin(angleOffset * 0.5 + p1.phase));
        const angle2 = p2.angle + angleOffset;
        const radius2 = p2.radius * (1 + 0.05 * Math.sin(angleOffset * 0.5 + p2.phase));
        const x1 = centerX + radius1 * Math.cos(angle1);
        const y1 = centerY + radius1 * Math.sin(angle1);
        const x2 = centerX + radius2 * Math.cos(angle2);
        const y2 = centerY + radius2 * Math.sin(angle2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = 'rgba(255,218,0,0.10)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      requestAnimationFrame(render);
    }

    initParticles();

    if (reduceMotion) {
      // Static fallback
      render = function() {
        ctx.clearRect(0, 0, W, H);
        const centerX = W / 2;
        const centerY = H / 2;
        const maxRadius = Math.min(W, H) * 0.4;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const angle = p.angle;
          const radius = p.radius;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          const t = radius / maxRadius;
          const hue = 45 + 180 * t;
          const lightness = 60 + 30 * (1 - t);
          ctx.fillStyle = `hsla(${hue}, 90%, ${lightness}%, ${p.opacity})`;
          ctx.fill();
        }
        ctx.beginPath();
        for (let i = 0; i < particles.length - 1; i++) {
          const p1 = particles[i];
          const p2 = particles[i + 1];
          const x1 = centerX + p1.radius * Math.cos(p1.angle);
          const y1 = centerY + p1.radius * Math.sin(p1.angle);
          const x2 = centerX + p2.radius * Math.cos(p2.angle);
          const y2 = centerY + p2.radius * Math.sin(p2.angle);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = 'rgba(255,218,0,0.10)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      };
      render();
    } else {
      requestAnimationFrame(render);
    }

    window.addEventListener('resize', () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resize();
      initParticles();
    }, { passive: true });
  }

  /* ============================================================
     AMBIENT FIELD: Lorenz Attractor on dark sections
     (scaled down to 50% of previous size)
     ============================================================ */
  (function ambientLorenz() {
    const hosts = document.querySelectorAll('.page-banner, .section-dark, .site-footer');
    if (!hosts.length) return;

    // Lorenz parameters
    const sigma = 10, rho = 28, beta = 8/3;
    const dt = 0.008;
    const trailLen = 300;

    const fields = [];

    hosts.forEach((host) => {
      const c = document.createElement('canvas');
      c.className = 'bg-canvas';
      c.setAttribute('aria-hidden', 'true');
      host.insertBefore(c, host.firstChild);

      const ctx = c.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0, H = 0;
      let trail = [];
      let x = (Math.random() - 0.5) * 0.2;
      let y = (Math.random() - 0.5) * 0.2;
      let z = (Math.random() - 0.5) * 0.2;
      let rotAngle = Math.random() * Math.PI * 2;
      let time = 0;

      const resize = () => {
        const rect = host.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        c.width = W * dpr;
        c.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      // Project 3D to 2D with rotation, centering the attractor
      function project(x, y, z) {
        const zOffset = rho - 1;
        const zShifted = z - zOffset;

        const cosA = Math.cos(rotAngle);
        const sinA = Math.sin(rotAngle);
        const rx = x * cosA + zShifted * sinA;
        const rz = -x * sinA + zShifted * cosA;

        const cosB = Math.cos(0.4);
        const sinB = Math.sin(0.4);
        const ry = y * cosB - rz * sinB;

        // Scaled down to 50% (divisor 40 instead of 20)
        const scale = Math.min(W, H) / 40;
        const cx = W / 2, cy = H / 2;

        return { sx: cx + rx * scale, sy: cy - ry * scale };
      }

      const field = {
        ctx, c, dpr, host,
        trail, x, y, z, rotAngle, time,
        resize, project, dt,
        visible: true,
      };

      fields.push(field);

      for (let i = 0; i < 100; i++) {
        const dx = sigma * (field.y - field.x);
        const dy = field.x * (rho - field.z) - field.y;
        const dz = field.x * field.y - beta * field.z;
        field.x += dx * dt;
        field.y += dy * dt;
        field.z += dz * dt;
        field.trail.push({ x: field.x, y: field.y, z: field.z });
        if (field.trail.length > trailLen) field.trail.shift();
      }
    });

    function drawField(f) {
      const { ctx, w, h, trail } = f;
      ctx.clearRect(0, 0, w, h);
      if (trail.length < 2) return;

      for (let i = 1; i < trail.length; i++) {
        const p1 = trail[i - 1];
        const p2 = trail[i];
        const pt1 = f.project(p1.x, p1.y, p1.z);
        const pt2 = f.project(p2.x, p2.y, p2.z);
        const t = i / trail.length;
        const hue = 45 + 160 * t;
        const alpha = 0.2 + 0.6 * t;
        ctx.beginPath();
        ctx.moveTo(pt1.sx, pt1.sy);
        ctx.lineTo(pt2.sx, pt2.sy);
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${alpha})`;
        ctx.lineWidth = 1 + 2 * t;
        ctx.stroke();
      }

      if (trail.length) {
        const head = trail[trail.length - 1];
        const pt = f.project(head.x, head.y, head.z);
        const grad = ctx.createRadialGradient(pt.sx, pt.sy, 0, pt.sx, pt.sy, 10);
        grad.addColorStop(0, 'rgba(255, 218, 0, 0.6)');
        grad.addColorStop(1, 'rgba(255, 218, 0, 0)');
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, 10, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    function stepField(f) {
      const dx = sigma * (f.y - f.x);
      const dy = f.x * (rho - f.z) - f.y;
      const dz = f.x * f.y - beta * f.z;
      f.x += dx * dt;
      f.y += dy * dt;
      f.z += dz * dt;
      f.trail.push({ x: f.x, y: f.y, z: f.z });
      if (f.trail.length > trailLen) f.trail.shift();
      f.rotAngle += 0.001;
      f.time += 1;
    }

    fields.forEach((f) => {
      const rect = f.host.getBoundingClientRect();
      f.w = rect.width;
      f.h = rect.height;
      f.c.width = f.w * f.dpr;
      f.c.height = f.h * f.dpr;
      f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      drawField(f);
    });

    if (!reduceMotion) {
      const loop = () => {
        for (const f of fields) {
          if (f.visible) {
            stepField(f);
            drawField(f);
          }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      if ('IntersectionObserver' in window) {
        const vio = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            const f = fields.find((x) => x.host === e.target);
            if (f) f.visible = e.isIntersecting;
          });
        }, { threshold: 0 });
        fields.forEach((f) => vio.observe(f.host));
      }
    }

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        fields.forEach((f) => {
          f.dpr = Math.min(window.devicePixelRatio || 1, 2);
          f.resize();
          f.w = f.c.width / f.dpr;
          f.h = f.c.height / f.dpr;
        });
      }, 160);
    }, { passive: true });
  })();

  /* ---------- Hero pointer parallax ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion && finePointer) {
    const hero = document.querySelector('.home-page .hero');
    if (hero) {
      const orbs = hero.querySelector('.hero-orbs');
      const shot = hero.querySelector('.headshot-frame');
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        if (orbs) orbs.style.transform = `translate3d(${nx * 28}px, ${ny * 22}px, 0)`;
        if (shot) shot.style.transform = `translate3d(${nx * -14}px, ${ny * -10}px, 0)`;
      });
      hero.addEventListener('pointerleave', () => {
        if (orbs) orbs.style.transform = '';
        if (shot) shot.style.transform = '';
      });
    }
  }

  /* ---------- 3D card tilt ---------- */
  if (!reduceMotion && finePointer) {
    const tiltEls = document.querySelectorAll('.focus-card, .affiliation-card, .profile-links a, .teaching-group');
    tiltEls.forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${ny * -5.5}deg) rotateY(${nx * 5.5}deg) translateY(-6px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- News & updates rail: arrows + drag-to-scroll ---------- */
  (function newsRail() {
    const rail = document.querySelector('.news-rail');
    if (!rail) return;
    const prev = document.querySelector('.news-arrow.prev');
    const next = document.querySelector('.news-arrow.next');
    const step = () => { const c = rail.querySelector('.news-card'); return (c ? c.offsetWidth + 22 : 360); };
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 4;
      if (prev) prev.hidden = rail.scrollLeft < 8;
      if (next) next.hidden = rail.scrollLeft > max;
    };
    if (prev) prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
    if (finePointer) {
      let down = false, moved = false, sx = 0, sl = 0;
      rail.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('grabbing'); });
      document.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true; rail.scrollLeft = sl - dx; });
      document.addEventListener('pointerup', () => { down = false; rail.classList.remove('grabbing'); });
      rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
  })();
});
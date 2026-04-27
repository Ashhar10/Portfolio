/* ========================================
   MAIN.JS — UI Interactions & Animations
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== LOADER ====================
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 2200);
  });

  // ==================== THEME TOGGLE ====================
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  function updateThemeIcon() {
    const isLight = document.documentElement.classList.contains('light-theme');
    if (themeIcon) {
      themeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }
  
  // Set initial icon based on the early check in index.html
  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      const isLight = document.documentElement.classList.contains('light-theme');
      localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
      updateThemeIcon();
      
      // Dispatch event for 3D scenes to pick up
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLight } }));
    });
  }

  // ==================== CUSTOM CURSOR ====================
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing) {
    let cx = 0, cy = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
    });

    function animateCursor() {
      // Dot follows instantly
      cursorDot.style.transform = `translate(${cx - 4}px, ${cy - 4}px)`;

      // Ring follows with delay
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      cursorRing.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effect on interactive elements
    const hoverTargets = document.querySelectorAll('a, button, .project-card, .skill-card, .model-btn, .social-link, .xr-card');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
    });
  }

  // ==================== 3D GALLERY CONTROLLER ====================
  const zones = document.querySelectorAll('.zone-ui');
  const navLinks = document.querySelectorAll('.top-nav a');
  const totalZones = zones.length;
  let currentZone = 0;
  let isAnimating = false;

  // Directional offsets for entrance/exit — more dramatic range
  const enterDirs = [
    { x: -300, y: 0,    rotation: -15, skewX: 8   },  // from left
    { x: 300,  y: 0,    rotation: 15,  skewX: -8  },  // from right
    { x: 0,    y: -250, rotation: -8,  skewX: 5   },  // from top
    { x: 0,    y: 250,  rotation: 8,   skewX: -5  },  // from bottom
    { x: -200, y: -200, rotation: -20, skewX: 10  },  // from top-left
    { x: 200,  y: -200, rotation: 20,  skewX: -10 },  // from top-right
    { x: -200, y: 200,  rotation: -18, skewX: 8   },  // from bottom-left
    { x: 200,  y: 200,  rotation: 18,  skewX: -8  },  // from bottom-right
  ];

  function getRandomDir() {
    return enterDirs[Math.floor(Math.random() * enterDirs.length)];
  }

  // Animate content IN — cinematic assembly with blur + elastic feel
  function animateZoneIn(zone) {
    const reveals = zone.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Set each element to its random off-screen starting position
    reveals.forEach((el) => {
      const dir = getRandomDir();
      gsap.set(el, {
        x: dir.x,
        y: dir.y,
        rotation: dir.rotation,
        skewX: dir.skewX,
        scale: 0.3,
        opacity: 0,
        filter: 'blur(12px)',
      });
    });

    // Create a timeline for smooth sequential entrance
    const tl = gsap.timeline();

    // Phase 1: All elements rush toward center and de-blur
    tl.to(reveals, {
      x: 0,
      y: 0,
      rotation: 0,
      skewX: 0,
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 1.1,
      ease: 'expo.out',
      stagger: {
        each: 0.1,
        from: 'random',
      },
    });

    // Phase 2: Subtle elastic overshoot settle
    tl.to(reveals, {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: 'elastic.out(1.05, 0.6)',
      stagger: 0.05,
    }, '-=0.3');
  }

  // Animate content OUT — dramatic shatter/scatter with spin + blur
  function animateZoneOut(zone, onComplete) {
    const reveals = zone.querySelectorAll('.reveal');
    if (!reveals.length) {
      zone.classList.remove('active-zone');
      if (onComplete) onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        zone.classList.remove('active-zone');
        gsap.set(reveals, { clearProps: 'all' });
        if (onComplete) onComplete();
      }
    });

    // Phase 1: Quick shrink + lift before scatter
    tl.to(reveals, {
      scale: 0.92,
      y: -8,
      duration: 0.15,
      ease: 'power2.in',
      stagger: 0.02,
    });

    // Phase 2: Explode outward with spin and blur
    reveals.forEach((el, i) => {
      const dir = getRandomDir();
      const spinDir = Math.random() > 0.5 ? 1 : -1;
      tl.to(el, {
        x: dir.x * 1.8,
        y: dir.y * 1.8,
        rotation: (20 + Math.random() * 30) * spinDir,
        skewX: dir.skewX * 2,
        scale: 0.1,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.55,
        ease: 'power3.in',
      }, `scatter+=${i * 0.04}`);
    });
  }

  function updateGalleryZone(targetZone) {
    if (isAnimating || targetZone === currentZone) return;
    if (targetZone < 0 || targetZone >= totalZones) return;
    
    isAnimating = true;
    const prevZone = currentZone;
    currentZone = targetZone;

    // Update Nav
    navLinks.forEach((link, index) => {
      link.classList.toggle('active', index === currentZone);
    });

    // Fade out hero particles if leaving zone 0
    const heroParticles = document.getElementById('heroParticleWrapper');
    if (heroParticles) {
      gsap.to(heroParticles, {
        opacity: currentZone === 0 ? 1 : 0,
        duration: 0.6,
        ease: 'power2.inOut'
      });
    }

    // Step 1: Animate OUT the old zone
    animateZoneOut(zones[prevZone], () => {
      // Step 2: Make new zone visible and animate IN
      zones[currentZone].classList.add('active-zone');

      // Small delay so the zone is rendered before animating
      requestAnimationFrame(() => {
        animateZoneIn(zones[currentZone]);
      });
    });

    // Animate Camera in parallel
    if (window.galleryCamera && typeof gsap !== 'undefined') {
      const targetZ = -currentZone * 40 + 5;
      gsap.to(window.galleryCamera.position, {
        z: targetZ,
        duration: 1.5,
        ease: 'power3.inOut',
        onComplete: () => { isAnimating = false; }
      });
    } else {
      // If no camera, unlock after exit+enter animations
      setTimeout(() => { isAnimating = false; }, 1200);
    }
  }

  // Initialize first zone — animate content in on load
  zones[0].classList.add('active-zone');
  setTimeout(() => {
    animateZoneIn(zones[0]);
  }, 2500); // Wait for loader to finish

  // Virtual Scroll Tracking
  window.addEventListener('wheel', (e) => {
    if (isAnimating) return;
    if (e.deltaY > 50) {
      updateGalleryZone(currentZone + 1);
    } else if (e.deltaY < -50) {
      updateGalleryZone(currentZone - 1);
    }
  });

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (isAnimating) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') updateGalleryZone(currentZone + 1);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') updateGalleryZone(currentZone - 1);
  });

  // Nav Click Override
  navLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      updateGalleryZone(index);
    });
  });

  // Connect Hero Button to Projects Zone (Zone 3)
  const exploreBtn = document.querySelector('.hero-buttons .btn-primary');
  if (exploreBtn) {
    exploreBtn.onclick = null; // Remove old inline onclick
    exploreBtn.addEventListener('click', () => updateGalleryZone(3));
  }

  // ==================== MAGNETIC BUTTON EFFECT ====================
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });

    // Ripple on click
    btn.addEventListener('click', (e) => {
      const ripple = btn.querySelector('.btn-ripple');
      if (!ripple) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      ripple.classList.remove('active');
      void ripple.offsetWidth; // force reflow
      ripple.classList.add('active');
    });
  });

  // ==================== HEADING INTERACTIVE FX ====================
  // Wrap letters in spans for wave/split/bounce effects
  document.querySelectorAll('.section-title[data-fx="wave"], .section-title[data-fx="split"], .section-title[data-fx="bounce"]').forEach(heading => {
    const text = heading.textContent;
    heading.innerHTML = '';
    const centerIdx = Math.floor(text.length / 2);
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${i * 0.03}s`;
      // For split effect: calculate spread direction from center
      if (heading.dataset.fx === 'split') {
        const spread = (i - centerIdx) * 8;
        span.style.setProperty('--spread', `${spread}px`);
      }
      heading.appendChild(span);
    });
  });

  // Magnetic heading — follow mouse on hover
  document.querySelectorAll('.section-title[data-fx="magnetic"]').forEach(heading => {
    heading.addEventListener('mousemove', (e) => {
      const rect = heading.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      heading.style.transform = `translate(${x * 0.15}px, ${y * 0.3}px)`;
    });
    heading.addEventListener('mouseleave', () => {
      heading.style.transform = 'translate(0, 0)';
    });
  });

  // Text scramble — apply only to non-fx headings (model info, xr cards)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
  document.querySelectorAll('.model-info h3, .xr-card-content h3, .carousel-card-info h3').forEach(el => {
    const original = el.textContent;
    let scrambleInterval = null;

    el.addEventListener('mouseenter', () => {
      let iteration = 0;
      clearInterval(scrambleInterval);
      scrambleInterval = setInterval(() => {
        el.textContent = original
          .split('')
          .map((char, i) => {
            if (i < iteration) return original[i];
            if (char === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        iteration += 1 / 2;
        if (iteration >= original.length) {
          clearInterval(scrambleInterval);
          el.textContent = original;
        }
      }, 30);
    });

    el.addEventListener('mouseleave', () => {
      clearInterval(scrambleInterval);
      el.textContent = original;
    });
  });

  // ==================== NAV LINK GLOW PULSE ====================
  document.querySelectorAll('.side-nav a').forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.transition = 'all 0.15s ease-out';
    });
    link.addEventListener('mouseleave', () => {
      link.style.transition = 'all 0.3s var(--ease-smooth)';
    });
  });

  // ==================== SOCIAL LINK MAGNETIC ====================
  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      link.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
    });
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'translateY(0)';
    });
  });

  // ==================== TIMELINE HORIZONTAL SCROLL ====================
  const timelineWrapper = document.querySelector('.timeline-wrapper');
  if (timelineWrapper) {
    let isDown = false, startX, scrollLeft;

    timelineWrapper.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - timelineWrapper.offsetLeft;
      scrollLeft = timelineWrapper.scrollLeft;
      timelineWrapper.style.cursor = 'grabbing';
    });

    timelineWrapper.addEventListener('mouseleave', () => { isDown = false; timelineWrapper.style.cursor = 'grab'; });
    timelineWrapper.addEventListener('mouseup', () => { isDown = false; timelineWrapper.style.cursor = 'grab'; });
    timelineWrapper.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - timelineWrapper.offsetLeft;
      const walk = (x - startX) * 2;
      timelineWrapper.scrollLeft = scrollLeft - walk;
    });

    timelineWrapper.style.cursor = 'grab';
  }

  // ==================== CAROUSEL CARD TILT EFFECT ====================
  document.querySelectorAll('.carousel-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -4;
      const rotateY = (x - centerX) / centerX * 4;
      card.style.transform = `translateY(-8px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) perspective(800px) rotateX(0deg) rotateY(0deg)';
    });
  });

  // ==================== SKILL CARD GLOW ON HOVER ====================
  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(168,85,247,0.08), var(--dark-card) 70%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });

  // ==================== TYPING EFFECT FOR SECTION LABELS ====================
  document.querySelectorAll('.section-label').forEach(label => {
    const text = label.textContent;
    label.textContent = '';
    let typed = false;

    const typingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !typed) {
          typed = true;
          let i = 0;
          const interval = setInterval(() => {
            label.textContent = text.substring(0, i + 1);
            i++;
            if (i >= text.length) clearInterval(interval);
          }, 40);
          typingObserver.unobserve(label);
        }
      });
    }, { threshold: 0.5 });

    typingObserver.observe(label);
  });

  // ==================== BACKGROUND GLOW EFFECT ====================
  const glowDiv = document.createElement('div');
  glowDiv.style.cssText = `
    position: fixed;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(168,85,247,0.04), transparent 70%);
    pointer-events: none;
    z-index: 0;
    transition: transform 0.2s ease-out;
    top: 0; left: 0;
  `;
  document.body.appendChild(glowDiv);

  document.addEventListener('mousemove', (e) => {
    glowDiv.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
  });

  // ==================== PROJECTS CAROUSEL ====================
  const track = document.getElementById('carouselTrack');
  const slides = document.querySelectorAll('.carousel-slide');
  const leftArrow = document.getElementById('carouselLeft');
  const rightArrow = document.getElementById('carouselRight');
  const dots = document.querySelectorAll('.carousel-dot');
  let currentSlide = 0;
  const totalSlides = slides.length;

  function getSlideWidth() {
    if (!slides[0]) return 0;
    return slides[0].offsetWidth + 28; // width + gap
  }

  function goToSlide(index) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    // Don't scroll past the last visible pair
    const maxScroll = (totalSlides - 2) < 0 ? 0 : totalSlides - 2;
    const clampedSlide = Math.min(currentSlide, maxScroll);
    const offset = clampedSlide * getSlideWidth();
    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));

    // Update active slide state
    slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
  }

  if (leftArrow && rightArrow) {
    leftArrow.addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoplay(); });
    rightArrow.addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoplay(); });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.slide));
      resetAutoplay();
    });
  });

  // Drag-to-scroll
  let isDraggingCarousel = false, dragStartX = 0, dragOffsetX = 0, currentTranslateX = 0;

  if (track) {
    track.addEventListener('pointerdown', (e) => {
      isDraggingCarousel = true;
      dragStartX = e.clientX;
      const style = window.getComputedStyle(track);
      const matrix = new DOMMatrixReadOnly(style.transform);
      currentTranslateX = matrix.m41;
      track.style.transition = 'none';
      track.classList.add('grabbing');
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingCarousel) return;
      dragOffsetX = e.clientX - dragStartX;
      track.style.transform = `translateX(${currentTranslateX + dragOffsetX}px)`;
    });

    window.addEventListener('pointerup', () => {
      if (!isDraggingCarousel) return;
      isDraggingCarousel = false;
      track.classList.remove('grabbing');
      track.style.transition = '';

      const threshold = getSlideWidth() * 0.2;
      if (dragOffsetX < -threshold) {
        goToSlide(currentSlide + 1);
      } else if (dragOffsetX > threshold) {
        goToSlide(currentSlide - 1);
      } else {
        goToSlide(currentSlide);
      }
      dragOffsetX = 0;
      resetAutoplay();
    });
  }

  // Auto-play
  let autoplayTimer = null;
  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      const next = currentSlide + 1 >= totalSlides ? 0 : currentSlide + 1;
      goToSlide(next);
    }, 5000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  if (totalSlides > 0) {
    goToSlide(0);
    startAutoplay();
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { goToSlide(currentSlide - 1); resetAutoplay(); }
    if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); resetAutoplay(); }
  });

});

/* ============================================================
   DAASH — Shared JavaScript: Three.js Hero + GSAP Animations
   ============================================================ */

/* ----------------------------------------------------------
   UTILITY: Inject Three.js Hero Canvas
   ---------------------------------------------------------- */
function initDaashHero() {
  const hero = document.getElementById('daash-hero');
  if (!hero) return;

  // Load Three.js dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => {
    createParticleField(hero);
  };
  document.head.appendChild(script);
}

function createParticleField(container) {
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0d06, 0.0018);

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 35;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.prepend(renderer.domElement);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.pointerEvents = 'none';

  // ── Particles ──
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const velocities = [];
  const basePositions = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 80;
    const y = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 40;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    sizes[i] = Math.random() * 3 + 1;
    velocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.01
    });
    basePositions.push({ x, y, z });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create a canvas texture for the particle sprite
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(180, 220, 60, 1)');
  gradient.addColorStop(0.3, 'rgba(124, 160, 0, 0.8)');
  gradient.addColorStop(0.7, 'rgba(74, 102, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(58, 77, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const particleTexture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 0.5,
    map: particleTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8,
    color: 0x7CA000
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── D Logo Shape (made of brighter, larger particles) ──
  const dParticles = [];
  // Create the D outline geometrically
  const cx = 0, cy = 0;
  const scale = 6;

  // Left bar of D
  for (let y = -4; y <= 4; y += 0.8) {
    dParticles.push({ x: -6 * scale / 8, y: y * scale / 8, z: 0 });
  }
  // Right curve of D
  for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.12) {
    const rx = 5 * scale / 8;
    const ry = 4 * scale / 8;
    dParticles.push({
      x: -6 * scale / 8 + rx + rx * Math.cos(a),
      y: ry * Math.sin(a),
      z: 0
    });
  }
  // Top and bottom horizontal connectors
  for (let x = -6 * scale / 8; x <= -6 * scale / 8 + 5 * scale / 8; x += 0.5) {
    dParticles.push({ x, y: 4 * scale / 8, z: 0 });
    dParticles.push({ x, y: -4 * scale / 8, z: 0 });
  }

  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(dParticles.length * 3);
  dParticles.forEach((p, i) => {
    dPos[i * 3] = p.x;
    dPos[i * 3 + 1] = p.y;
    dPos[i * 3 + 2] = p.z;
  });
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));

  const dMat = new THREE.PointsMaterial({
    size: 0.7,
    color: 0xB0D050,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.9
  });
  const dShape = new THREE.Points(dGeo, dMat);
  scene.add(dShape);

  // ── Connecting Lines ──
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = 200;
  const linePositions = new Float32Array(maxLines * 6);
  const lineColors = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  lineGeo.setDrawRange(0, 0);

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.15
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // ── Mouse tracking ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / width - 0.5) * 2;
    mouseY = -(e.clientY / height - 0.5) * 2;
  });

  // ── Resize ──
  window.addEventListener('resize', () => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // ── Animation Loop ──
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Move particles slowly
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(time + i) * 0.002;
      pos[i * 3 + 1] += Math.cos(time * 0.7 + i * 0.5) * 0.002;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // D shape rotates slowly
    dShape.rotation.y = Math.sin(time * 0.3) * 0.1;
    dShape.rotation.x = Math.sin(time * 0.2) * 0.05;

    // Camera follows mouse smoothly
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Update connecting lines
    updateConnections(particles, lines, count, linePositions, lineColors);

    renderer.render(scene, camera);
  }

  animate();
}

function updateConnections(particles, lines, count, linePositions, lineColors) {
  const pos = particles.geometry.attributes.position.array;
  let lineIndex = 0;
  const maxLines = 200;
  const connectDist = 4.5;

  for (let i = 0; i < count && lineIndex < maxLines * 2; i += 3) {
    const x1 = pos[i * 3];
    const y1 = pos[i * 3 + 1];
    const z1 = pos[i * 3 + 2];

    for (let j = i + 1; j < count && lineIndex < maxLines * 2; j += 5) {
      const x2 = pos[j * 3];
      const y2 = pos[j * 3 + 1];
      const z2 = pos[j * 3 + 2];

      const dx = x1 - x2, dy = y1 - y2, dz = z1 - z2;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < connectDist) {
        const idx = lineIndex * 3;
        linePositions[idx] = x1;
        linePositions[idx + 1] = y1;
        linePositions[idx + 2] = z1;
        linePositions[idx + 3] = x2;
        linePositions[idx + 4] = y2;
        linePositions[idx + 5] = z2;

        const alpha = 1 - dist / connectDist;
        // Brightness from center
        lineColors[idx] = 0.48 * alpha;
        lineColors[idx + 1] = 0.63 * alpha;
        lineColors[idx + 2] = 0 * alpha;
        lineColors[idx + 3] = 0.48 * alpha;
        lineColors[idx + 4] = 0.63 * alpha;
        lineColors[idx + 5] = 0 * alpha;

        lineIndex++;
      }
    }
  }

  lines.geometry.setDrawRange(0, lineIndex * 2);
  lines.geometry.attributes.position.needsUpdate = true;
  lines.geometry.attributes.color.needsUpdate = true;
}


/* ----------------------------------------------------------
   GSAP SCROLL ANIMATIONS
   ---------------------------------------------------------- */
function initDaashAnimations() {
  // Load GSAP + ScrollTrigger
  const gsapScript = document.createElement('script');
  gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
  gsapScript.onload = () => {
    const stScript = document.createElement('script');
    stScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
    stScript.onload = () => {
      // Now GSAP + ScrollTrigger are loaded
      gsap.registerPlugin(ScrollTrigger);
      runGSAPAnimations();
    };
    document.head.appendChild(stScript);
  };
  document.head.appendChild(gsapScript);
}

function runGSAPAnimations() {
  // ── ANIMATE REVEAL: Elements with [data-reveal] ──
  gsap.utils.toArray('[data-reveal]').forEach((el, i) => {
    const direction = el.dataset.reveal || 'up';
    const distance = el.dataset.distance || 60;
    const delay = el.dataset.delay || i * 0.08;

    const vars = {
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: delay,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    };

    if (direction === 'up') vars.y = distance;
    else if (direction === 'down') vars.y = -distance;
    else if (direction === 'left') vars.x = distance;
    else if (direction === 'right') vars.x = -distance;
    else if (direction === 'scale') { vars.scale = 0.8; vars.opacity = 0; }

    gsap.from(el, vars);
  });

  // ── ANIMATE STAGGER: Elements with [data-stagger] ──
  gsap.utils.toArray('[data-stagger]').forEach((group) => {
    const children = group.children;
    const direction = group.dataset.stagger || 'up';
    const dist = { up: 40, down: -40, left: 40, right: -40 };
    const yVal = direction === 'up' || direction === 'down' ? dist[direction] : 0;
    const xVal = direction === 'left' || direction === 'right' ? dist[direction] : 0;

    gsap.from(children, {
      y: yVal,
      x: xVal,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: group,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // ── COUNTER: Elements with [data-counter] ──
  gsap.utils.toArray('[data-counter]').forEach((el) => {
    const target = parseInt(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = parseFloat(el.dataset.duration) || 2;

    gsap.from(el, {
      textContent: 0,
      duration: duration,
      ease: 'power2.out',
      snap: { textContent: 1 },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      onUpdate: function() {
        const val = Math.round(this.targets()[0].textContent);
        el.textContent = val.toLocaleString() + suffix;
      }
    });
  });

  // ── PARALLAX: Elements with [data-parallax] ──
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      y: () => el.offsetHeight * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // ── 3D TILT ON CARDS: .tilt-card ──
  gsap.utils.toArray('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -6;
      const rotateY = (x - centerX) / centerX * 6;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 800,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
    });
  });

  // ── NAVBAR SCROLL EFFECT ──
  const navbar = document.getElementById('navbar');
  if (navbar) {
    ScrollTrigger.create({
      start: 'top -60px',
      onUpdate: (self) => {
        navbar.classList.toggle('scrolled', self.progress > 0);
      }
    });
  }

  // ── SVG LINE DRAW: .draw-line elements ──
  gsap.utils.toArray('.draw-line').forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: path,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // ── MARQUEE SCROLL: .scroll-marquee ──
  gsap.utils.toArray('.scroll-marquee').forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 30;
    gsap.to(el, {
      x: () => -(el.scrollWidth - el.offsetWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });
  });
}


/* ----------------------------------------------------------
   NAVBAR COLOR MODE
   ---------------------------------------------------------- */
function setNavbarMode(mode) {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (mode === 'light') {
    navbar.classList.remove('scrolled');
    navbar.classList.remove('white');
  } else if (mode === 'white') {
    navbar.classList.add('white');
    navbar.classList.remove('scrolled');
  }
}


/* ----------------------------------------------------------
   MOBILE MENU
   ---------------------------------------------------------- */
function openMobile() { document.getElementById('mobileMenu').classList.add('open'); }
function closeMobile() { document.getElementById('mobileMenu').classList.remove('open'); }


/* ----------------------------------------------------------
   CONTACT FORM
   ---------------------------------------------------------- */
function handleContactForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.innerHTML = '✓ Message Sent!';
  btn.style.background = '#4A6600';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}


/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initDaashHero();
  initDaashAnimations();
});

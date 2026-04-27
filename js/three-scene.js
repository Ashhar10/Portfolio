/* ========================================
   THREE.JS SCENES — Hero & Model Viewer
   Luxury Black, White & Purple Theme
   ======================================== */

// ==================== GALLERY SCENE — MOTHERBOARD CYBER-CITY ====================
(function initGalleryScene() {
  const canvas = document.getElementById('gallery-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0e14, 0.015);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 8);
  camera.rotation.x = -0.5;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0b0e14, 1);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.2;

  // === Post-Processing (Bloom for Glowing Traces) ===
  const renderScene = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.2;
  bloomPass.strength = 1.8; // intense glow
  bloomPass.radius = 0.5;

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  window.galleryCamera = camera;

  // === Lighting ===
  const ambient = new THREE.AmbientLight(0x1B202A, 1.5); // Dark blueish ambient
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0x7C3AED, 0.5); // Subtle purple highlight from above
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // === Materials ===
  const matBoard = new THREE.MeshStandardMaterial({ color: 0x05070A, roughness: 0.9, metalness: 0.1 });
  const matTraceGlow = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // Glowing amber
  const matChipDark = new THREE.MeshStandardMaterial({ color: 0x11141C, roughness: 0.4, metalness: 0.6 });
  const matPin = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
  const matCapacitorBody = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.4 });
  const matCapacitorTop = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.3, metalness: 0.8 });
  const numZones = 12;
  const roomSpacing = 40;

  function seededRandom(seed) {
    let s = seed;
    return function() { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  const matTechTower = new THREE.MeshStandardMaterial({ color: 0x0B0E14, roughness: 0.6, metalness: 0.5 });
  matTechTower.userData = {
    uniforms: { uIsDayMode: { value: 0.0 } }
  };


  matTechTower.onBeforeCompile = (shader) => {
    shader.uniforms.uIsDayMode = matTechTower.userData.uniforms.uIsDayMode;

    shader.vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vNormalVec;
      ${shader.vertexShader}
    `.replace(
      `#include <project_vertex>`,
      `#include <project_vertex>
       #ifdef USE_INSTANCING
         vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
         vNormalVec = normalize((modelMatrix * instanceMatrix * vec4(objectNormal, 0.0)).xyz);
       #else
         vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vNormalVec = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);
       #endif
      `
    );

    shader.fragmentShader = `
      uniform float uIsDayMode;
      varying vec3 vWorldPos;
      varying vec3 vNormalVec;
      ${shader.fragmentShader}
    `.replace(
      `#include <metalnessmap_fragment>`,
      `#include <metalnessmap_fragment>
       float winX = step(0.2, fract(vWorldPos.x * 1.5));
       float winY = step(0.4, fract(vWorldPos.y * 1.5));
       float winZ = step(0.2, fract(vWorldPos.z * 1.5));
       float isWall = 1.0 - abs(vNormalVec.y);
       float isWindow = winY * ((abs(vNormalVec.x) > 0.5) ? winZ : winX) * isWall;
       
       if (uIsDayMode > 0.5) {
         if (isWindow > 0.0) {
           diffuseColor.rgb = vec3(0.1, 0.15, 0.25); // Dark reflective glass
           roughnessFactor = 0.1;
           metalnessFactor = 0.9;
         } else {
           float buildingHash = fract(sin(dot(floor(vWorldPos * 0.1), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
           vec3 bColor = vec3(0.85, 0.85, 0.85); // Default silver
           if (mod(buildingHash * 10.0, 3.0) < 1.0) bColor = vec3(0.9, 0.9, 0.92);
           else if (mod(buildingHash * 10.0, 3.0) < 2.0) bColor = vec3(0.8, 0.85, 0.9);
           
           diffuseColor.rgb = bColor;
           roughnessFactor = 0.4;
           metalnessFactor = 0.6;
         }
       }
      `
    ).replace(
      `#include <emissivemap_fragment>`,
      `#include <emissivemap_fragment>
       float winX_em = step(0.2, fract(vWorldPos.x * 1.5));
       float winY_em = step(0.4, fract(vWorldPos.y * 1.5));
       float winZ_em = step(0.2, fract(vWorldPos.z * 1.5));
       float isWall_em = 1.0 - abs(vNormalVec.y);
       float isWindow_em = winY_em * ((abs(vNormalVec.x) > 0.5) ? winZ_em : winX_em) * isWall_em;
       float randomOn_em = step(0.5, fract(sin(dot(floor(vWorldPos * 1.5), vec3(12.9898, 78.233, 45.164))) * 43758.5453));
       
       if (isWindow_em > 0.0 && uIsDayMode < 0.5 && randomOn_em > 0.0) {
         totalEmissiveRadiance += vec3(0.98, 0.75, 0.14) * 2.0; // Glowing Amber Windows
       }
      `
    );
  };

  // === Build Motherboard Environment ===
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);
  const dataPackets = [];

  // === Setup InstancedMeshes for Ultimate Performance ===
  // Estimate max instances needed
  const maxInstances = numZones * 400; // 400 items per zone
  const instChips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matChipDark, maxInstances);
  const instCaps = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 16), matCapacitorBody, maxInstances);
  const instTowers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), matTechTower, maxInstances);
  
  cityGroup.add(instChips);
  cityGroup.add(instCaps);
  cityGroup.add(instTowers);
  
  let chipIdx = 0;
  let capIdx = 0;
  let towerIdx = 0;
  const dummy = new THREE.Object3D();

  for (let zone = 0; zone < numZones; zone++) {
    const zCenter = -zone * roomSpacing;
    const rng = seededRandom(zone * 999 + 123);

    // Dark PCB Board Base (Massive width to reach infinity)
    const board = new THREE.Mesh(new THREE.PlaneGeometry(400, roomSpacing), matBoard);
    board.rotation.x = -Math.PI / 2;
    board.position.set(0, -0.05, zCenter);
    cityGroup.add(board);

    // Glowing Circuit Traces on Ground (Spread wider)
    for (let tr = 0; tr < 25; tr++) {
      const tLen = 2 + rng() * 20;
      const isHoriz = rng() > 0.5;
      const trace = new THREE.Mesh(new THREE.PlaneGeometry(isHoriz ? tLen : 0.15, isHoriz ? 0.15 : tLen), matTraceGlow);
      trace.rotation.x = -Math.PI / 2;
      trace.position.set((rng()-0.5)*120, -0.04, zCenter + (rng()-0.5)*roomSpacing);
      cityGroup.add(trace);
    }

    // Build Tech Structures (Spread wider to fill horizon)
    const blockOffsets = [
      { xMin: 4, xMax: 45, zMin: 2, zMax: 18 },
      { xMin: -45, xMax: -4, zMin: 2, zMax: 18 },
      { xMin: 4, xMax: 45, zMin: -18, zMax: -2 },
      { xMin: -45, xMax: -4, zMin: -18, zMax: -2 },
    ];

    blockOffsets.forEach(block => {
      // Grid-based placement to prevent overlaps
      const gridSize = 3.5; // 3.5 units per grid cell ensures no overlap
      for (let x = block.xMin; x < block.xMax; x += gridSize) {
        for (let z = block.zMin; z < block.zMax; z += gridSize) {
          if (rng() < 0.15) continue; // Leave some natural gaps/streets
          
          const type = rng();
          // Jitter slightly within the grid cell but avoid crossing bounds
          const px = x + rng() * (gridSize * 0.5);
          const pz = zCenter + z + rng() * (gridSize * 0.5);
          
          if (type < 0.45 && chipIdx < maxInstances) {
            // Microchip (Flat Residential/Commercial blocks)
            const w = 1.5 + rng() * 2;
            const d = 1.5 + rng() * 2;
            const h = 0.2 + rng() * 0.6;
            dummy.position.set(px, h/2, pz);
            dummy.scale.set(w, h, d);
            dummy.updateMatrix();
            instChips.setMatrixAt(chipIdx++, dummy.matrix);
          } else if (type < 0.75 && capIdx < maxInstances) {
            // Capacitor (Silo/Cylindrical Towers)
            const r = 0.6 + rng() * 0.6;
            const h = 2 + rng() * 4;
            dummy.position.set(px, h/2, pz);
            dummy.scale.set(r, h, r);
            dummy.updateMatrix();
            instCaps.setMatrixAt(capIdx++, dummy.matrix);
          } else if (towerIdx < maxInstances) {
            // Tech Tower (Skyscrapers with procedural windows)
            const w = 1.5 + rng() * 2;
            const d = 1.5 + rng() * 2;
            const h = 4 + rng() * 16; // Tall skyscrapers
            dummy.position.set(px, h/2, pz);
            dummy.scale.set(w, h, d);
            dummy.updateMatrix();
            instTowers.setMatrixAt(towerIdx++, dummy.matrix);
          }
        }
      }
    });

    // Central Data Highway Traces
    const hLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roomSpacing), matTraceGlow);
    hLine1.rotation.x = -Math.PI/2;
    hLine1.position.set(-1.5, -0.03, zCenter);
    cityGroup.add(hLine1);
    
    const hLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, roomSpacing), matTraceGlow);
    hLine2.rotation.x = -Math.PI/2;
    hLine2.position.set(1.5, -0.03, zCenter);
    cityGroup.add(hLine2);

    // Data Packets (Glowing Spheres)
    for (let c = 0; c < 5; c++) {
      const packet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), matTraceGlow);
      const isX = rng() > 0.8; // mostly move along Z
      packet.position.set(
        isX ? (rng()-0.5)*40 : (rng() > 0.5 ? 1.5 : -1.5),
        0.3,
        isX ? zCenter + (rng()-0.5)*30 : zCenter + (rng()-0.5)*roomSpacing
      );
      packet.userData = {
        axis: isX ? 'x' : 'z',
        speed: (rng() * 0.2 + 0.1) * (rng() > 0.5 ? 1 : -1),
        bounds: roomSpacing
      };
      cityGroup.add(packet);
      dataPackets.push(packet);
    }
    
    // Add some warm localized glow
    if(zone % 2 === 0) {
      const pointLight = new THREE.PointLight(0xfbbf24, 2, 40);
      pointLight.position.set(0, 5, zCenter);
      scene.add(pointLight);
    }
  }

  // === Ambient Particles (Dust/Sparks) ===
  const particleCount = 1500;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 150;
    pPos[i*3+1] = Math.random() * 20;
    pPos[i*3+2] = (Math.random() - 0.5) * (numZones * roomSpacing);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.1, color: 0xfbbf24, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // === Mouse parallax ===
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.galleryCameraTargetRotation = { x: -0.5, y: 0 };

  // === Animation Loop ===
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Data packets zip along
    dataPackets.forEach(p => {
      if (p.userData.axis === 'x') {
        p.position.x += p.userData.speed;
        if (p.position.x > 30) p.position.x = -30;
        if (p.position.x < -30) p.position.x = 30;
      } else {
        p.position.z += p.userData.speed;
        // Wrap around relative to camera
        if (p.position.z > camera.position.z + 10) p.position.z -= 100;
        if (p.position.z < camera.position.z - 100) p.position.z += 100;
      }
    });

    // Particle floating
    const pp = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pp[i*3+1] += Math.sin(t + pp[i*3]) * 0.01;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Camera parallax
    if (window.galleryCamera) {
      const tX = window.galleryCameraTargetRotation.x - mouseY * 0.05;
      const tY = window.galleryCameraTargetRotation.y - mouseX * 0.08;
      camera.rotation.x += (tX - camera.rotation.x) * 0.04;
      camera.rotation.y += (tY - camera.rotation.y) * 0.04;
    }

    // Render using composer for bloom!
    composer.render();
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // === Dynamic Theme Switcher ===
  window.addEventListener('themeChanged', (e) => {
    const isLight = e.detail.isLight;
    
    // Smooth transition could be done with GSAP, but immediate setHex is fine for now
    if (isLight) {
      if (matTechTower.userData.uniforms) {
        matTechTower.userData.uniforms.uIsDayMode.value = 1.0;
      }
      scene.fog = new THREE.FogExp2(0xcbd5e1, 0.012); // Deeper gray/slate fog to remove the white blast
      renderer.setClearColor(0xcbd5e1, 1);
      ambient.color.setHex(0x64748b); // Darker slate to prevent blow-out of white objects
      dirLight.color.setHex(0x7C3AED); // Same purple highlight as night mode
      
      matBoard.color.setHex(0xd1d5db); // Medium light gray PCB
      matTraceGlow.color.setHex(0xfbbf24); // Keep Amber traces!
      matChipDark.color.setHex(0xe2e8f0); // White chips
      matPin.color.setHex(0x94a3b8);
      matCapacitorBody.color.setHex(0xf8fafc); // White capacitors
      matCapacitorTop.color.setHex(0x94a3b8);
      matTechTower.color.setHex(0xe2e8f0); // White towers
      pMat.color.setHex(0xfbbf24); // Keep Amber particles!
      
      bloomPass.threshold = 1.2; // Increase threshold to ensure ONLY explicitly bright things bloom
      bloomPass.strength = 0.5; // Lower bloom strength further for day mode
      renderer.toneMappingExposure = 0.8; // Lower exposure to fix the "too bright" feeling
      
      scene.children.forEach(c => {
        if (c instanceof THREE.PointLight) c.color.setHex(0xfbbf24);
      });
    } else {
      if (matTechTower.userData.uniforms) {
        matTechTower.userData.uniforms.uIsDayMode.value = 0.0;
      }
      scene.fog = new THREE.FogExp2(0x0b0e14, 0.015);
      renderer.setClearColor(0x0b0e14, 1);
      ambient.color.setHex(0x2A3241); // Brighter ambient for better visibility
      dirLight.color.setHex(0x7C3AED);
      
      matBoard.color.setHex(0x05070A);
      matTraceGlow.color.setHex(0xfbbf24);
      matChipDark.color.setHex(0x11141C);
      matPin.color.setHex(0x94a3b8);
      matCapacitorBody.color.setHex(0x1e293b);
      matCapacitorTop.color.setHex(0xd1d5db);
      matTechTower.color.setHex(0x0B0E14);
      pMat.color.setHex(0xfbbf24);
      
      bloomPass.threshold = 0.2; // Restore original threshold
      bloomPass.strength = 1.6; // Slightly reduced from 1.8 so it doesn't blast
      renderer.toneMappingExposure = 1.2;
      
      scene.children.forEach(c => {
        if (c instanceof THREE.PointLight) c.color.setHex(0xfbbf24);
      });
    }
  });

  // Fire initial check just in case light mode is already active on load
  if (document.documentElement.classList.contains('light-theme')) {
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLight: true } }));
  }

})();


// ==================== MODEL VIEWER SCENE ====================
(function initModelViewer() {
  const canvas = document.getElementById('model-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0A0A0A);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 1, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resizeViewer() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight || w;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resizeViewer();
  window.addEventListener('resize', resizeViewer);

  // Lighting
  scene.add(new THREE.AmbientLight(0x222222, 0.6));
  const dl = new THREE.DirectionalLight(0xfbbf24, 1);
  dl.position.set(3, 5, 3);
  scene.add(dl);
  const pl = new THREE.PointLight(0xfcd34d, 1, 20);
  pl.position.set(-3, 2, 2);
  scene.add(pl);

  // Grid helper
  const grid = new THREE.GridHelper(10, 20, 0x1a1a1a, 0x0d0d0d);
  grid.position.y = -1;
  scene.add(grid);

  // Model container
  let activeModel = null;
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  // Models data
  const modelData = {
    robot: { title: 'Mech Guardian', desc: 'A battle-ready mech unit designed for futuristic combat scenarios. Built with optimized geometry for real-time rendering in game engines.' },
    vehicle: { title: 'Hover Cruiser', desc: 'A sleek anti-gravity vehicle for open-world exploration. Features dynamic lighting and physics-based motion.' },
    character: { title: 'Cyber Warrior', desc: 'A cybernetically enhanced soldier with modular equipment slots and procedural animation support.' },
  };

  function createRobot() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
    );
    body.position.y = 0.8;
    g.add(body);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
    );
    head.position.y = 1.85;
    g.add(head);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.15, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 1 })
    );
    visor.position.set(0, 1.85, 0.31);
    g.add(visor);
    [-0.85, 0.85].forEach(x => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.6, roughness: 0.4 })
      );
      arm.position.set(x, 0.6, 0);
      g.add(arm);
    });
    [-0.35, 0.35].forEach(x => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.6, roughness: 0.4 })
      );
      leg.position.set(x, -0.5, 0);
      g.add(leg);
    });
    [-0.75, 0.75].forEach(x => {
      const pad = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0xfcd34d, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.2 })
      );
      pad.position.set(x, 1.4, 0);
      g.add(pad);
    });
    return g;
  }

  function createVehicle() {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 2, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 })
    );
    hull.rotation.z = Math.PI / 2;
    hull.position.y = 0.3;
    g.add(hull);
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5, transparent: true, opacity: 0.6 })
    );
    cockpit.position.set(0.3, 0.5, 0);
    g.add(cockpit);
    [-1, 1].forEach(z => {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.7, roughness: 0.3 })
      );
      wing.position.set(-0.3, 0.2, z * 0.9);
      g.add(wing);
      const engine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.08, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0xfcd34d, emissiveIntensity: 1 })
      );
      engine.rotation.z = Math.PI / 2;
      engine.position.set(-1.1, 0.2, z * 0.9);
      g.add(engine);
    });
    return g;
  }

  function createCharacter() {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.7, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 })
    );
    torso.position.y = 0.8;
    g.add(torso);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.3 })
    );
    head.position.y = 1.55;
    g.add(head);
    const visor = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.03, 8, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 1 })
    );
    visor.position.set(0, 1.55, 0.15);
    visor.rotation.x = -Math.PI / 2;
    g.add(visor);
    [-0.55, 0.55].forEach(x => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.7, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.5, roughness: 0.4 })
      );
      arm.position.set(x, 0.6, 0);
      g.add(arm);
      const wrist = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.02, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0xfcd34d, emissiveIntensity: 0.8 })
      );
      wrist.position.set(x, 0.2, 0);
      wrist.rotation.x = Math.PI / 2;
      g.add(wrist);
    });
    [-0.2, 0.2].forEach(x => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.5, roughness: 0.4 })
      );
      leg.position.set(x, -0.3, 0);
      g.add(leg);
    });
    return g;
  }

  const modelCreators = { robot: createRobot, vehicle: createVehicle, character: createCharacter };

  function switchModel(name) {
    while (modelGroup.children.length) modelGroup.remove(modelGroup.children[0]);
    const model = modelCreators[name]();
    modelGroup.add(model);
    activeModel = model;

    const data = modelData[name];
    const titleEl = document.getElementById('modelTitle');
    const descEl = document.getElementById('modelDesc');
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;

    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === name);
    });
  }

  switchModel('robot');

  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', () => switchModel(btn.dataset.model));
  });

  let isDragging = false, prevX = 0;
  canvas.addEventListener('pointerdown', (e) => { isDragging = true; prevX = e.clientX; });
  window.addEventListener('pointerup', () => { isDragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    modelGroup.rotation.y += dx * 0.01;
    prevX = e.clientX;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.position.z = Math.max(2.5, Math.min(8, camera.position.z + e.deltaY * 0.005));
  }, { passive: false });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (!isDragging) modelGroup.rotation.y += 0.003;
    modelGroup.position.y = Math.sin(t * 0.8) * 0.05;
    grid.material.opacity = 0.3 + Math.sin(t) * 0.1;
    renderer.render(scene, camera);
  }
  animate();
})();

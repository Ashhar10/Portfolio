// ==========================================
// 3D CURVED CAROUSEL FOR PROJECTS SECTION
// ==========================================

(function initCarousel3D() {
  const container = document.getElementById('carousel-3d-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // Transparent background to let motherboard city show through
  // The CSS has a subtle radial gradient so the cards don't get lost
  
  // We need to size it based on the container, not window
  const getWidth = () => container.clientWidth;
  const getHeight = () => container.clientHeight;

  const camera = new THREE.PerspectiveCamera(40, getWidth() / getHeight(), 0.1, 100);
  camera.position.set(0, 0, 10.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(getWidth(), getHeight());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Critical for transparent overlay:
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // ==========================================
  // Lighting
  // ==========================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(0, 5, 10);
  scene.add(dirLight);

  // ==========================================
  // Rounded Corner Alpha Map
  // ==========================================
  function createRoundedRectAlphaMap(aspectRatio, radiusPx = 40) {
    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = width * aspectRatio;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radiusPx * (width / 512));
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // ==========================================
  // Infinite Carousel Layout
  // ==========================================
  const carouselGroup = new THREE.Group();
  scene.add(carouselGroup);

  const originalImages = [
    'assets/images/project-portal-city.png',
    'assets/images/project-mech-arena.png',
    'assets/images/project-ar-dragon.png',
    'assets/images/project-vr-racing.png',
    'assets/images/project-floating-island.png',
    'assets/images/project-multiplayer.png'
  ];

  const cardWidth = 4.2;
  const cardHeight = 3.2; // Adjusted ratio for these landscape project images
  const curveRadius = 18; // slightly tighter radius since we have landscape images
  const gap = 0.6;

  const targetAngleStep = (cardWidth + gap) / curveRadius; 
  const totalCards = Math.ceil((Math.PI * 2) / targetAngleStep);
  const angleStep = (Math.PI * 2) / totalCards; 

  const images = [];
  for (let i = 0; i < totalCards; i++) {
    images.push(originalImages[i % originalImages.length]);
  }

  const alphaTexture = createRoundedRectAlphaMap(cardHeight / cardWidth, 40);
  const textureLoader = new THREE.TextureLoader();
  const cardWrappers = [];

  images.forEach((url, i) => {
    const thetaLength = cardWidth / curveRadius;
    const geometry = new THREE.CylinderGeometry(
      curveRadius, curveRadius, cardHeight, 32, 1, true,
      0, thetaLength 
    );
    geometry.rotateY(-thetaLength / 2);

    const texture = textureLoader.load(url);
    // Global THREE.js r128 color space properties
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter; 

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      alphaMap: alphaTexture,
      transparent: false,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.FrontSide, 
      alphaTest: 0.5 
    });

    material.userData = {
      targetSaturation: 1.0,
      targetLuminance: 1.0,
      uniforms: {
        uSaturation: { value: 1.0 },
        uLuminance: { value: 1.0 }
      }
    };

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSaturation = material.userData.uniforms.uSaturation;
      shader.uniforms.uLuminance = material.userData.uniforms.uLuminance;
      
      shader.fragmentShader = `
        uniform float uSaturation;
        uniform float uLuminance;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          float luminance = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = mix(vec3(luminance), diffuseColor.rgb, uSaturation);
          diffuseColor.rgb *= uLuminance;
        #endif
        `
      );
    };

    const cardMesh = new THREE.Mesh(geometry, material);
    cardMesh.scale.setScalar(0.5);
    cardMesh.userData.targetScale = 0.5;
    
    const wrapper = new THREE.Group();
    wrapper.add(cardMesh);
    wrapper.rotation.y = i * angleStep;
    
    carouselGroup.add(wrapper);
    cardWrappers.push({ wrapper, mesh: cardMesh });
  });

  carouselGroup.position.z = -curveRadius;

  let targetRotationY = 0;
  let currentRotationY = 0;
  let dragVelocity = 0;
  let previousX = 0;

  // ==========================================
  // Navigation Logic
  // ==========================================
  document.getElementById('carousel3dPrev').addEventListener('click', () => {
    targetRotationY += angleStep;
  });

  document.getElementById('carousel3dNext').addEventListener('click', () => {
    targetRotationY -= angleStep;
  });

  let isDragging = false;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-9999, -9999);

  renderer.domElement.addEventListener('pointerdown', (e) => {
    isDragging = true;
    previousX = e.clientX;
    dragVelocity = 0; 
    renderer.domElement.style.cursor = 'grabbing';
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      const diffX = e.clientX - previousX;
      dragVelocity = diffX * 0.006; 
      targetRotationY += dragVelocity;
      previousX = e.clientX;
    }
  });

  renderer.domElement.addEventListener('pointerup', () => {
    isDragging = false;
    renderer.domElement.style.cursor = 'default';
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    isDragging = false;
    renderer.domElement.style.cursor = 'default';
    mouse.set(-9999, -9999);
  });

  // ==========================================
  // Resize Handler
  // ==========================================
  window.addEventListener('resize', () => {
    camera.aspect = getWidth() / getHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
  });

  // ==========================================
  // Render Loop
  // ==========================================
  const clock = new THREE.Clock();
  const tempVector = new THREE.Vector3();
  const autoRotateSpeed = 0.001; // subtle auto rotate

  let rawHover = null;
  let hoverStartTime = 0;

  function animate() {
    requestAnimationFrame(animate);
    
    if (!isDragging) {
      dragVelocity *= 0.92;
      targetRotationY += dragVelocity;
      targetRotationY -= autoRotateSpeed;

      if (Math.abs(dragVelocity) < 0.001) {
        dragVelocity = 0;
        // Snap to closest card if not moving
        const closestIndex = Math.round(targetRotationY / angleStep);
        targetRotationY = THREE.MathUtils.lerp(targetRotationY, closestIndex * angleStep, 0.02);
      }
    }

    currentRotationY = THREE.MathUtils.lerp(currentRotationY, targetRotationY, 0.06);
    carouselGroup.rotation.y = currentRotationY;

    const elapsedTime = clock.getElapsedTime();
    carouselGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.1;

    let currentRawHover = null;
    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(carouselGroup.children, true);
      if (intersects.length > 0) {
        currentRawHover = intersects[0].object;
      }
    }

    if (currentRawHover !== rawHover) {
      rawHover = currentRawHover;
      hoverStartTime = performance.now();
    }

    let activeMesh = null;
    if (rawHover && (performance.now() - hoverStartTime > 150)) {
      activeMesh = rawHover;
    } else {
      let minX = Infinity;
      cardWrappers.forEach((item) => {
        tempVector.set(0, 0, curveRadius); 
        item.wrapper.localToWorld(tempVector);
        const absX = Math.abs(tempVector.x);
        if (absX < minX && tempVector.z > -curveRadius) {
          minX = absX;
          activeMesh = item.mesh;
        }
      });
    }

    cardWrappers.forEach((item) => {
      const mesh = item.mesh;
      const ud = mesh.material.userData;

      if (mesh === activeMesh) {
        mesh.userData.targetScale = 1.0;
        ud.targetSaturation = 1.0;
        ud.targetLuminance = 1.0;
      } else {
        mesh.userData.targetScale = 0.85; 
        ud.targetSaturation = 0.0;
        ud.targetLuminance = 0.6; // darker when inactive to make active pop
      }

      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, mesh.userData.targetScale, 0.1));
      if(ud.uniforms.uSaturation) {
        ud.uniforms.uSaturation.value = THREE.MathUtils.lerp(ud.uniforms.uSaturation.value, ud.targetSaturation, 0.1);
        ud.uniforms.uLuminance.value = THREE.MathUtils.lerp(ud.uniforms.uLuminance.value, ud.targetLuminance, 0.1);
      }

      tempVector.set(0, 0, curveRadius); 
      item.wrapper.localToWorld(tempVector);
      item.mesh.visible = (tempVector.z >= -curveRadius - 10);
    });

    renderer.render(scene, camera);
  }
  animate();

})();

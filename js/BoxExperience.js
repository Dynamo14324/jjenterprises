// Core Three.js setup for immersive box experience
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import * as CANNON from 'cannon-es';
import gsap from 'gsap';

// Main class for the 3D box experience
class BoxExperience {
  constructor(canvas) {
    // Setup
    this.canvas = canvas;
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.clock = new THREE.Clock();
    this.previousTime = 0;
    this.currentSection = 'intro';
    this.isBoxOpen = false;
    this.isInsideBox = false;
    this.interactionEnabled = true;
    
    // Initialize components
    this.initThree();
    this.initPhysics();
    this.setupLighting();
    this.setupEnvironment();
    this.loadModels();
    this.setupPostProcessing();
    this.setupEventListeners();
    this.setupUserInterface();
    
    // Start animation loop
    this.animate();
  }
  
  // Initialize Three.js scene, camera, and renderer
  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      35, 
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.camera.position.set(0, 1, 5);
    this.scene.add(this.camera);
    
    // External camera for orbiting around the box
    this.externalCamera = new THREE.PerspectiveCamera(
      35, 
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.externalCamera.position.set(0, 1, 5);
    this.scene.add(this.externalCamera);
    
    // Internal camera for inside-box experience
    this.internalCamera = new THREE.PerspectiveCamera(
      75, 
      this.sizes.width / this.sizes.height,
      0.01,
      10
    );
    this.internalCamera.position.set(0, 0, 0);
    this.scene.add(this.internalCamera);
    
    // Active camera (will switch between external and internal)
    this.activeCamera = this.externalCamera;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Controls
    this.controls = new OrbitControls(this.externalCamera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enabled = true;
  }
  
  // Initialize physics with Cannon.js
  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.allowSleep = true;
    
    // Physics materials
    this.defaultMaterial = new CANNON.Material('default');
    this.defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.2
      }
    );
    this.world.addContactMaterial(this.defaultContactMaterial);
    
    // Physics objects will be added when models are loaded
    this.physicsBodies = [];
  }
  
  // Setup lighting for the scene
  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);
    
    // Main directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 5, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 20;
    this.directionalLight.shadow.normalBias = 0.05;
    this.scene.add(this.directionalLight);
    
    // Rim light to highlight edges
    this.rimLight = new THREE.DirectionalLight(0xffffeb, 0.7);
    this.rimLight.position.set(-5, 3, -5);
    this.scene.add(this.rimLight);
    
    // Interior point light (will be activated when box opens)
    this.interiorLight = new THREE.PointLight(0xffffeb, 0.8, 3);
    this.interiorLight.position.set(0, 0.5, 0);
    this.interiorLight.visible = false;
    this.scene.add(this.interiorLight);
  }
  
  // Setup environment and background
  setupEnvironment() {
    // HDRI environment for realistic reflections
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/assets/environment.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = new THREE.Color(0xf5f5f5);
    });
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({
      opacity: 0.3
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -1;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Physics for ground
    this.groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.defaultMaterial
    });
    this.groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.groundBody.position.y = -1;
    this.world.addBody(this.groundBody);
  }
  
  // Load 3D models for the box and contents
  loadModels() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    // Load corrugated box textures
    this.boxTextures = {
      color: this.textureLoader.load('/assets/textures/corrugated_color.jpg'),
      normal: this.textureLoader.load('/assets/textures/corrugated_normal.jpg'),
      roughness: this.textureLoader.load('/assets/textures/corrugated_roughness.jpg'),
      ao: this.textureLoader.load('/assets/textures/corrugated_ao.jpg')
    };
    
    // Apply texture settings
    Object.values(this.boxTextures).forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    });
    
    // Create box parts (will be replaced with actual models)
    this.createBoxPlaceholder();
    
    // Load actual box model
    this.gltfLoader.load(
      '/models/corrugated_box.glb',
      (gltf) => {
        this.boxModel = gltf.scene;
        this.setupBoxPhysics();
        this.setupBoxAnimations();
        
        // Replace placeholder with actual model
        this.scene.remove(this.boxPlaceholder);
        this.scene.add(this.boxModel);
      }
    );
  }
  
  // Create placeholder box until model loads
  createBoxPlaceholder() {
    // Create a simple box as placeholder
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshStandardMaterial({
      map: this.boxTextures.color,
      normalMap: this.boxTextures.normal,
      roughnessMap: this.boxTextures.roughness,
      aoMap: this.boxTextures.ao,
      color: 0xd2b48c
    });
    
    this.boxPlaceholder = new THREE.Mesh(boxGeometry, boxMaterial);
    this.boxPlaceholder.castShadow = true;
    this.boxPlaceholder.receiveShadow = true;
    this.boxPlaceholder.position.y = 0;
    this.scene.add(this.boxPlaceholder);
  }
  
  // Setup physics for the box model
  setupBoxPhysics() {
    // Main box body
    this.boxBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0, 0, 0),
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      material: this.defaultMaterial
    });
    this.world.addBody(this.boxBody);
    this.physicsBodies.push({
      mesh: this.boxModel,
      body: this.boxBody
    });
    
    // Box lid and flaps will be added when the actual model is processed
  }
  
  // Setup animations for box opening
  setupBoxAnimations() {
    // These will be set up when the actual model is loaded
    this.boxAnimations = {
      open: () => {
        if (this.isBoxOpen) return;
        
        // Animation sequence for opening the box
        const timeline = gsap.timeline();
        
        // Animate lid opening
        timeline.to(this.boxModel.position, {
          duration: 1.5,
          ease: "power2.out",
          onStart: () => {
            this.interactionEnabled = false;
            this.controls.enabled = false;
          },
          onComplete: () => {
            this.isBoxOpen = true;
            this.interiorLight.visible = true;
            this.interactionEnabled = true;
            
            // Create particles for box opening effect
            this.createOpeningParticles();
          }
        });
        
        return timeline;
      },
      
      enterBox: () => {
        if (this.isInsideBox) return;
        
        // Animation sequence for entering the box
        const timeline = gsap.timeline();
        
        // Transition camera to inside box
        timeline.to(this.externalCamera.position, {
          duration: 2,
          x: 0,
          y: 0.2,
          z: 0,
          ease: "power2.inOut",
          onStart: () => {
            this.interactionEnabled = false;
            this.controls.enabled = false;
          },
          onUpdate: () => {
            // Gradually switch to internal camera perspective
            const progress = timeline.progress();
            if (progress > 0.5 && this.activeCamera !== this.internalCamera) {
              this.activeCamera = this.internalCamera;
            }
          },
          onComplete: () => {
            this.isInsideBox = true;
            this.interactionEnabled = true;
            this.setupInsideBoxControls();
          }
        });
        
        return timeline;
      },
      
      exitBox: () => {
        if (!this.isInsideBox) return;
        
        // Animation sequence for exiting the box
        const timeline = gsap.timeline();
        
        // Transition camera out of box
        timeline.to(this.externalCamera.position, {
          duration: 2,
          x: 0,
          y: 1,
          z: 5,
          ease: "power2.inOut",
          onStart: () => {
            this.interactionEnabled = false;
          },
          onUpdate: () => {
            // Gradually switch back to external camera
            const progress = timeline.progress();
            if (progress > 0.5 && this.activeCamera !== this.externalCamera) {
              this.activeCamera = this.externalCamera;
              this.controls.enabled = true;
            }
          },
          onComplete: () => {
            this.isInsideBox = false;
            this.interactionEnabled = true;
          }
        });
        
        return timeline;
      }
    };
  }
  
  // Create particle effect for box opening
  createOpeningParticles() {
    const particlesCount = 100;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd2b48c,
      size: 0.01,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.position.y = 0.5;
    this.scene.add(this.particles);
    
    // Animate particles floating up
    gsap.to(this.particles.position, {
      y: 2,
      duration: 4,
      ease: "power1.out",
      onComplete: () => {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.particles = null;
      }
    });
    
    // Fade out particles
    gsap.to(particleMaterial, {
      opacity: 0,
      duration: 4,
      ease: "power1.out"
    });
  }
  
  // Setup controls for inside-box experience
  setupInsideBoxControls() {
    // Disable orbit controls
    this.controls.enabled = false;
    
    // Setup first-person look controls
    this.lookSpeed = 0.002;
    this.lookVector = new THREE.Vector2();
    this.lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Reset internal camera orientation
    this.internalCamera.rotation.set(0, 0, 0);
  }
  
  // Setup post-processing effects
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    // Render pass
    const renderPass = new RenderPass(this.scene, this.activeCamera);
    this.composer.addPass(renderPass);
    
    // Bloom pass for glow effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.2,  // strength
      0.2,  // radius
      0.9   // threshold
    );
    this.composer.addPass(bloomPass);
    
    // SSAO pass for depth
    const ssaoPass = new SSAOPass(
      this.scene,
      this.activeCamera,
      this.sizes.width,
      this.sizes.height
    );
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    this.composer.addPass(ssaoPass);
  }
  
  // Setup event listeners for user interaction
  setupEventListeners() {
    // Resize handler
    window.addEventListener('resize', () => {
      // Update sizes
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;
      
      // Update cameras
      this.externalCamera.aspect = this.sizes.width / this.sizes.height;
      this.externalCamera.updateProjectionMatrix();
      
      this.internalCamera.aspect = this.sizes.width / this.sizes.height;
      this.internalCamera.updateProjectionMatrix();
      
      // Update renderer and composer
      this.renderer.setSize(this.sizes.width, this.sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      this.composer.setSize(this.sizes.width, this.sizes.height);
    });
    
    // Click handler for box interaction
    this.canvas.addEventListener('click', (event) => {
      if (!this.interactionEnabled) return;
      
      // Raycasting for interactive elements
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
      mouse.y = - (event.clientY / this.sizes.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, this.activeCamera);
      
      // Check for intersections with the box
      const intersects = raycaster.intersectObject(this.boxModel, true);
      
      if (intersects.length > 0) {
        if (!this.isBoxOpen) {
          // Open the box
          this.boxAnimations.open();
        } else if (!this.isInsideBox) {
          // Enter the box
          this.boxAnimations.enterBox();
        }
      } else if (this.isInsideBox) {
        // Exit the box when clicking outside (only when inside)
        this.boxAnimations.exitBox();
      }
    });
    
    // Mouse move handler for inside-box look control
    window.addEventListener('mousemove', (event) => {
      if (!this.isInsideBox) return;
      
      this.lookVector.x = (event.clientX / this.sizes.width) * 2 - 1;
      this.lookVector.y = - (event.clientY / this.sizes.height) * 2 + 1;
      
      // Update internal camera rotation based on mouse position
      this.lookEuler.setFromQuaternion(this.internalCamera.quaternion);
      
      // Limit vertical look angle
      const maxVerticalAngle = Math.PI / 3;
      this.lookEuler.x = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, 
        this.lookEuler.x - this.lookVector.y * this.lookSpeed * 10));
      this.lookEuler.y -= this.lookVector.x * this.lookSpeed * 10;
      
      this.internalCamera.quaternion.setFromEuler(this.lookEuler);
    });
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (event) => {
      // Handle touch interactions
    });
    
    // Keyboard controls
    window.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'Space':
          if (!this.isBoxOpen) {
            this.boxAnimations.open();
          } else if (!this.isInsideBox) {
            this.boxAnimations.enterBox();
          } else {
            this.boxAnimations.exitBox();
          }
          break;
      }
    });
  }
  
  // Setup user interface elements
  setupUserInterface() {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'ui-container';
    document.body.appendChild(this.uiContainer);
    
    // Create instruction text
    this.instructionText = document.createElement('div');
    this.instructionText.className = 'instruction-text';
    this.instructionText.textContent = 'Click on the box to open it';
    this.uiContainer.appendChild(this.instructionText);
    
    // Create company info panel (initially hidden)
    this.companyInfo = document.createElement('div');
    this.companyInfo.className = 'company-info hidden';
    this.companyInfo.innerHTML = `
      <h1>JJ Enterprises</h1>
      <h2>Everything Printing & Packaging</h2>
      <div class="contact">
        <p>Phone: +91 9819256432</p>
        <p>Email: info@thejjenterprise.com</p>
        <p>Address: ITT Bhatti, Dindoshipada, Goregaon</p>
      </div>
    `;
    this.uiContainer.appendChild(this.companyInfo);
    
    // Create navigation buttons (initially hidden)
    this.navButtons = document.createElement('div');
    this.navButtons.className = 'nav-buttons hidden';
    this.navButtons.innerHTML = `
      <button id="products-btn">Products</button>
      <button id="about-btn">About Us</button>
      <button id="contact-btn">Contact</button>
    `;
    this.uiContainer.appendChild(this.navButtons);
    
    // Update UI based on experience state
    this.updateUI();
  }
  
  // Update UI based on current state
  updateUI() {
    if (!this.isBoxOpen) {
      this.instructionText.textContent = 'Click on the box to open it';
      this.companyInfo.classList.add('hidden');
      this.navButtons.classList.add('hidden');
    } else if (!this.isInsideBox) {
      this.instructionText.textContent = 'Click on the box to step inside';
      this.companyInfo.classList.remove('hidden');
      this.navButtons.classList.add('hidden');
    } else {
      this.instructionText.textContent = 'Look around inside the box. Click outside to exit.';
      this.companyInfo.classList.add('hidden');
      this.navButtons.classList.remove('hidden');
    }
  }
  
  // Animation loop
  animate() {
    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = elapsedTime - this.previousTime;
    this.previousTime = elapsedTime;
    
    // Update physics
    this.world.step(1/60, deltaTime, 3);
    
    // Update physics objects
    for(const body of this.physicsBodies) {
      body.mesh.position.copy(body.body.position);
      body.mesh.quaternion.copy(body.body.quaternion);
    }
    
    // Animate box rotation in intro state
    if (!this.isBoxOpen && this.boxPlaceholder) {
      this.boxPlaceholder.rotation.y = Math.sin(elapsedTime * 0.5) * 0.1 + elapsedTime * 0.1;
    }
    
    // Update particles if they exist
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(elapsedTime + i) * 0.0003;
        positions[i + 1] += 0.001;
        positions[i + 2] += Math.cos(elapsedTime + i) * 0.0003;
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update controls
    if (this.controls.enabled) {
      this.controls.update();
    }
    
    // Update UI
    this.updateUI();
    
    // Render
    this.composer.render();
    
    // Call animate again on the next frame
    window.requestAnimationFrame(this.animate.bind(this));
  }
}

export { BoxExperience };

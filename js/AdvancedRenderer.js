// Advanced WebGL and Three.js features integration
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

class AdvancedRenderer {
  constructor(boxExperience) {
    this.boxExperience = boxExperience;
    this.scene = boxExperience.scene;
    this.renderer = boxExperience.renderer;
    this.camera = boxExperience.activeCamera;
    
    // Initialize features
    this.setupPostProcessing();
    this.createCustomShaders();
    this.setupParticleSystem();
    this.setupEnvironmentReflections();
    this.setupDepthOfField();
    this.setupEventListeners();
  }
  
  // Setup advanced post-processing pipeline
  setupPostProcessing() {
    // Create effect composer
    this.composer = new EffectComposer(this.renderer);
    
    // Add render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    
    // Add SSAO pass for depth
    this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    this.ssaoPass.kernelRadius = 16;
    this.ssaoPass.minDistance = 0.005;
    this.ssaoPass.maxDistance = 0.1;
    this.ssaoPass.output = SSAOPass.OUTPUT.Default;
    this.composer.addPass(this.ssaoPass);
    
    // Add outline pass for highlighting interactive elements
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.outlinePass.edgeStrength = 3;
    this.outlinePass.edgeGlow = 0.5;
    this.outlinePass.edgeThickness = 1;
    this.outlinePass.pulsePeriod = 2;
    this.outlinePass.visibleEdgeColor.set('#d2b48c');
    this.outlinePass.hiddenEdgeColor.set('#190a05');
    this.composer.addPass(this.outlinePass);
    
    // Add bloom pass for glow effects
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(this.bloomPass);
    
    // Add FXAA pass for anti-aliasing
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(this.fxaaPass);
    
    // Add SMAA pass for enhanced anti-aliasing
    this.smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
    this.composer.addPass(this.smaaPass);
    
    // Replace renderer's render method with composer
    this.boxExperience.composer = this.composer;
  }
  
  // Create custom shaders for special effects
  createCustomShaders() {
    // Custom corrugated material shader
    this.corrugatedShader = {
      uniforms: {
        diffuse: { value: new THREE.Color(0xd2b48c) },
        roughness: { value: 0.8 },
        time: { value: 0 },
        corrugationScale: { value: 20.0 },
        corrugationStrength: { value: 0.05 },
        map: { value: null },
        normalMap: { value: null }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 diffuse;
        uniform float roughness;
        uniform float time;
        uniform float corrugationScale;
        uniform float corrugationStrength;
        uniform sampler2D map;
        uniform sampler2D normalMap;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          // Sample base color from texture
          vec4 texColor = texture2D(map, vUv);
          
          // Create corrugated effect
          float corrugation = sin(vUv.x * corrugationScale) * corrugationStrength;
          
          // Apply lighting
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Simple diffuse lighting
          float diffuseFactor = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
          
          // Combine everything
          vec3 color = texColor.rgb * diffuse * (0.5 + 0.5 * diffuseFactor);
          color += vec3(corrugation * 0.1); // Add subtle corrugation effect
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    };
    
    // Create corrugated material
    this.corrugatedMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(this.corrugatedShader.uniforms),
      vertexShader: this.corrugatedShader.vertexShader,
      fragmentShader: this.corrugatedShader.fragmentShader,
      lights: true
    });
    
    // Apply custom material to box if it exists
    if (this.boxExperience.boxModel) {
      this.boxExperience.boxModel.traverse((child) => {
        if (child.isMesh) {
          // Store original material for later
          child.userData.originalMaterial = child.material;
          
          // Clone the corrugated material for this mesh
          const material = this.corrugatedMaterial.clone();
          
          // Set texture uniforms if available
          if (child.material.map) {
            material.uniforms.map.value = child.material.map;
          }
          if (child.material.normalMap) {
            material.uniforms.normalMap.value = child.material.normalMap;
          }
          
          // Apply material
          child.material = material;
        }
      });
    }
  }
  
  // Setup particle system for ambient effects
  setupParticleSystem() {
    // Create particles for ambient dust effect
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    
    // Create positions for particles
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const boxSize = 10;
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * boxSize;
      positions[i * 3 + 1] = Math.random() * boxSize;
      positions[i * 3 + 2] = (Math.random() - 0.5) * boxSize;
      
      // Velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      
      // Color - slight variations of beige
      color.setHSL(0.08, 0.3, 0.5 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Size
      sizes[i] = Math.random() * 0.03 + 0.01;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create particle material
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: new THREE.TextureLoader().load('/assets/textures/particle.png') }
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float size;
        
        varying vec3 vColor;
        
        uniform float time;
        
        void main() {
          vColor = color;
          
          // Update position based on velocity and time
          vec3 pos = position + velocity * time;
          
          // Reset particles that go too far
          if (pos.y > 5.0) {
            pos.y = -5.0;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
    
    // Create particle system
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
    
    // Store initial time for animation
    this.particleTime = 0;
  }
  
  // Setup environment reflections for realistic materials
  setupEnvironmentReflections() {
    // Create cube camera for dynamic reflections
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, this.cubeRenderTarget);
    this.cubeCamera.position.set(0, 0, 0);
    this.scene.add(this.cubeCamera);
    
    // Create reflective materials
    this.reflectiveMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.2,
      envMap: this.cubeRenderTarget.texture,
      envMapIntensity: 1.0
    });
    
    // Create reflective elements inside the box
    this.createReflectiveElements();
  }
  
  // Create reflective decorative elements
  createReflectiveElements() {
    // Create a group for reflective elements
    this.reflectiveElements = new THREE.Group();
    this.scene.add(this.reflectiveElements);
    
    // Create small reflective spheres
    for (let i = 0; i < 5; i++) {
      const radius = Math.random() * 0.1 + 0.05;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = this.reflectiveMaterial.clone();
      
      // Randomize material properties slightly
      material.roughness = Math.random() * 0.3;
      material.color.setHSL(Math.random() * 0.1, 0.5, 0.5);
      
      const sphere = new THREE.Mesh(geometry, material);
      
      // Position randomly inside box bounds
      sphere.position.set(
        (Math.random() - 0.5) * 0.8,
        Math.random() * 0.4,
        (Math.random() - 0.5) * 0.8
      );
      
      this.reflectiveElements.add(sphere);
    }
    
    // Add event listener to show/hide based on box state
    document.addEventListener('boxOpened', () => {
      this.reflectiveElements.visible = true;
      
      // Animate elements appearing
      this.reflectiveElements.children.forEach((element, index) => {
        element.scale.set(0.001, 0.001, 0.001);
        
        // Scale up with delay
        setTimeout(() => {
          gsap.to(element.scale, {
            x: 1, y: 1, z: 1,
            duration: 1,
            ease: "elastic.out(1, 0.5)"
          });
          
          // Add floating animation
          gsap.to(element.position, {
            y: element.position.y + 0.2,
            duration: 2 + Math.random(),
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });
        }, 500 + index * 200);
      });
    });
    
    // Initially hide
    this.reflectiveElements.visible = false;
  }
  
  // Setup depth of field effect
  setupDepthOfField() {
    // Create bokeh pass for depth of field
    this.bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 5.0,
      aperture: 0.015,
      maxblur: 0.01,
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Add to composer but disable initially
    this.bokehPass.enabled = false;
    this.composer.addPass(this.bokehPass);
    
    // Enable depth of field when focusing on products
    document.addEventListener('productFocus', (event) => {
      if (event.detail && event.detail.position) {
        // Calculate distance to focused object
        const distance = this.camera.position.distanceTo(event.detail.position);
        
        // Update bokeh pass parameters
        this.bokehPass.uniforms["focus"].value = distance;
        this.bokehPass.uniforms["aperture"].value = 0.015;
        this.bokehPass.enabled = true;
      }
    });
    
    // Disable depth of field when unfocusing
    document.addEventListener('productUnfocus', () => {
      this.bokehPass.enabled = false;
    });
  }
  
  // Setup event listeners
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      // Update composer size
      this.composer.setSize(window.innerWidth, window.innerHeight);
      
      // Update passes that need resolution updates
      this.fxaaPass.material.uniforms['resolution'].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
      
      this.outlinePass.resolution.set(window.innerWidth, window.innerHeight);
      
      // Update bokeh pass
      this.bokehPass.uniforms["aspect"].value = window.innerWidth / window.innerHeight;
    });
    
    // Handle camera changes
    document.addEventListener('cameraChange', (event) => {
      if (event.detail && event.detail.camera) {
        // Update camera reference in passes
        this.renderPass.camera = event.detail.camera;
        this.ssaoPass.camera = event.detail.camera;
        this.outlinePass.renderCamera = event.detail.camera;
        this.bokehPass.camera = event.detail.camera;
      }
    });
  }
  
  // Update method called from main animation loop
  update(time) {
    // Update shader uniforms
    if (this.boxExperience.boxModel) {
      this.boxExperience.boxModel.traverse((child) => {
        if (child.isMesh && child.material.uniforms) {
          child.material.uniforms.time.value = time;
        }
      });
    }
    
    // Update particle system
    if (this.particles) {
      this.particles.material.uniforms.time.value = time * 10;
    }
    
    // Update cube camera for reflections (only when needed)
    if (this.reflectiveElements && this.reflectiveElements.visible) {
      // Hide the reflective elements temporarily
      this.reflectiveElements.visible = false;
      
      // Update cube camera
      this.cubeCamera.update(this.renderer, this.scene);
      
      // Show reflective elements again
      this.reflectiveElements.visible = true;
    }
    
    // Update outline pass for highlighting interactive elements
    if (this.boxExperience.focusedObject) {
      this.outlinePass.selectedObjects = [this.boxExperience.focusedObject];
    } else {
      this.outlinePass.selectedObjects = [];
    }
  }
}

export { AdvancedRenderer };

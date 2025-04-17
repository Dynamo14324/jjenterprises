// Performance optimization for the 3D box experience
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

class PerformanceOptimizer {
  constructor(boxExperience) {
    this.boxExperience = boxExperience;
    this.scene = boxExperience.scene;
    this.renderer = boxExperience.renderer;
    this.camera = boxExperience.activeCamera;
    
    // Performance monitoring
    this.stats = null;
    this.fpsHistory = [];
    this.memoryHistory = [];
    this.lastOptimizationTime = 0;
    this.optimizationInterval = 5000; // Check every 5 seconds
    
    // Optimization levels
    this.currentOptimizationLevel = 'auto'; // 'low', 'medium', 'high', 'ultra', 'auto'
    this.autoOptimizationEnabled = true;
    
    // Initialize optimizations
    this.setupPerformanceMonitoring();
    this.setupLODSystem();
    this.setupTextureOptimization();
    this.setupGeometryOptimization();
    this.setupRenderOptimization();
    this.setupCulling();
    this.setupCaching();
    this.setupWorkers();
    
    // Apply initial optimizations
    this.applyOptimizationLevel('auto');
  }
  
  // Setup performance monitoring tools
  setupPerformanceMonitoring() {
    // Create stats panel if in development mode
    if (window.location.hash === '#dev') {
      this.stats = new Stats();
      this.stats.dom.style.position = 'absolute';
      this.stats.dom.style.top = '0px';
      this.stats.dom.style.left = '0px';
      document.body.appendChild(this.stats.dom);
    }
    
    // Create performance monitor
    this.performanceMonitor = {
      fps: 60,
      frameTime: 16.67,
      memory: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      programs: 0
    };
    
    // Setup monitoring loop
    this.monitorPerformance();
  }
  
  // Monitor performance metrics
  monitorPerformance() {
    const now = performance.now();
    
    // Update stats if available
    if (this.stats) {
      this.stats.update();
    }
    
    // Get renderer info
    const info = this.renderer.info;
    this.performanceMonitor.drawCalls = info.render.calls;
    this.performanceMonitor.triangles = info.render.triangles;
    this.performanceMonitor.textures = info.memory.textures;
    this.performanceMonitor.programs = info.programs?.length || 0;
    
    // Get memory info if available
    if (window.performance && window.performance.memory) {
      this.performanceMonitor.memory = window.performance.memory.usedJSHeapSize / 1048576; // MB
      this.memoryHistory.push(this.performanceMonitor.memory);
      
      // Keep history limited
      if (this.memoryHistory.length > 60) {
        this.memoryHistory.shift();
      }
    }
    
    // Calculate FPS
    const elapsed = now - (this._lastFrameTime || now);
    this._lastFrameTime = now;
    
    // Skip first frame
    if (elapsed > 0) {
      const currentFps = 1000 / elapsed;
      // Smooth FPS
      this.performanceMonitor.fps = this.performanceMonitor.fps * 0.9 + currentFps * 0.1;
      this.performanceMonitor.frameTime = elapsed;
      
      // Record FPS history
      this.fpsHistory.push(this.performanceMonitor.fps);
      
      // Keep history limited
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
    }
    
    // Check if optimization is needed
    if (this.autoOptimizationEnabled && now - this.lastOptimizationTime > this.optimizationInterval) {
      this.autoOptimize();
      this.lastOptimizationTime = now;
    }
    
    // Continue monitoring
    requestAnimationFrame(this.monitorPerformance.bind(this));
  }
  
  // Setup Level of Detail (LOD) system
  setupLODSystem() {
    // Create LOD group for box model
    if (this.boxExperience.boxModel) {
      this.setupModelLOD(this.boxExperience.boxModel);
    }
    
    // Create LOD for environment
    this.setupEnvironmentLOD();
  }
  
  // Setup LOD for a specific model
  setupModelLOD(model) {
    // Skip if model doesn't exist
    if (!model) return;
    
    // Process each mesh in the model
    model.traverse(child => {
      if (child.isMesh && child.geometry) {
        // Store original geometry
        child.userData.originalGeometry = child.geometry;
        
        // Create simplified geometries if complex enough
        if (child.geometry.attributes.position.count > 1000) {
          // Create medium detail version (50% reduction)
          child.userData.mediumGeometry = this.simplifyGeometry(child.geometry, 0.5);
          
          // Create low detail version (75% reduction)
          child.userData.lowGeometry = this.simplifyGeometry(child.geometry, 0.25);
        }
      }
    });
  }
  
  // Simplify geometry (mock implementation - would use actual decimation in production)
  simplifyGeometry(geometry, factor) {
    // In a real implementation, we would use:
    // - SimplifyModifier from Three.js
    // - Decimation algorithms
    // - Mesh optimization libraries
    
    // For this example, we'll create a simplified version by skipping vertices
    const originalPositions = geometry.attributes.position.array;
    const originalNormals = geometry.attributes.normal?.array;
    const originalUvs = geometry.attributes.uv?.array;
    
    // Calculate how many vertices to keep
    const originalCount = geometry.attributes.position.count;
    const targetCount = Math.max(24, Math.floor(originalCount * factor));
    const skipFactor = Math.floor(originalCount / targetCount);
    
    // Create new arrays
    const newPositions = new Float32Array(targetCount * 3);
    const newNormals = originalNormals ? new Float32Array(targetCount * 3) : null;
    const newUvs = originalUvs ? new Float32Array(targetCount * 2) : null;
    
    // Sample vertices
    let newIndex = 0;
    for (let i = 0; i < originalCount; i += skipFactor) {
      // Copy position
      newPositions[newIndex * 3] = originalPositions[i * 3];
      newPositions[newIndex * 3 + 1] = originalPositions[i * 3 + 1];
      newPositions[newIndex * 3 + 2] = originalPositions[i * 3 + 2];
      
      // Copy normal if available
      if (newNormals) {
        newNormals[newIndex * 3] = originalNormals[i * 3];
        newNormals[newIndex * 3 + 1] = originalNormals[i * 3 + 1];
        newNormals[newIndex * 3 + 2] = originalNormals[i * 3 + 2];
      }
      
      // Copy UV if available
      if (newUvs) {
        newUvs[newIndex * 2] = originalUvs[i * 2];
        newUvs[newIndex * 2 + 1] = originalUvs[i * 2 + 1];
      }
      
      newIndex++;
      
      // Ensure we don't exceed the target count
      if (newIndex >= targetCount) break;
    }
    
    // Create new geometry
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    
    if (newNormals) {
      newGeometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
    }
    
    if (newUvs) {
      newGeometry.setAttribute('uv', new THREE.BufferAttribute(newUvs, 2));
    }
    
    return newGeometry;
  }
  
  // Setup LOD for environment elements
  setupEnvironmentLOD() {
    // Create different detail levels for environment elements
    if (this.boxExperience.ground) {
      const ground = this.boxExperience.ground;
      
      // Store original geometry
      ground.userData.originalGeometry = ground.geometry;
      
      // Create simplified versions
      const highDetail = new THREE.PlaneGeometry(20, 20, 10, 10);
      const mediumDetail = new THREE.PlaneGeometry(20, 20, 5, 5);
      const lowDetail = new THREE.PlaneGeometry(20, 20, 2, 2);
      
      ground.userData.highGeometry = highDetail;
      ground.userData.mediumGeometry = mediumDetail;
      ground.userData.lowGeometry = lowDetail;
    }
    
    // Setup LOD for particle systems
    if (this.boxExperience.particles) {
      const particles = this.boxExperience.particles;
      
      // Store original particle count
      particles.userData.originalCount = particles.geometry.attributes.position.count;
      
      // Create methods to adjust particle count
      particles.userData.setParticleCount = (percentage) => {
        const count = particles.geometry.attributes.position.count;
        const sizes = particles.geometry.attributes.size.array;
        
        // Hide particles by setting size to 0
        for (let i = 0; i < count; i++) {
          if (i < count * percentage) {
            // Show this particle
            sizes[i] = particles.userData.originalSizes ? 
              particles.userData.originalSizes[i] : 0.01;
          } else {
            // Hide this particle
            sizes[i] = 0;
          }
        }
        
        particles.geometry.attributes.size.needsUpdate = true;
      };
      
      // Store original sizes
      if (particles.geometry.attributes.size) {
        particles.userData.originalSizes = new Float32Array(particles.geometry.attributes.size.array);
      }
    }
  }
  
  // Setup texture optimization
  setupTextureOptimization() {
    // Track all textures
    this.textures = [];
    
    // Find all textures in the scene
    this.scene.traverse(object => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          // Check for various texture types
          const textureProperties = [
            'map', 'normalMap', 'roughnessMap', 'metalnessMap', 
            'aoMap', 'emissiveMap', 'displacementMap', 'alphaMap'
          ];
          
          textureProperties.forEach(prop => {
            if (material[prop] && !this.textures.includes(material[prop])) {
              // Store original texture
              material[prop].userData.originalSize = {
                width: material[prop].image?.width || 1024,
                height: material[prop].image?.height || 1024
              };
              
              this.textures.push(material[prop]);
            }
          });
        });
      }
    });
    
    // Create mipmap control
    this.setMipmapQuality = (quality) => {
      // quality: 'high', 'medium', 'low'
      const minFilter = quality === 'high' ? 
        THREE.LinearMipmapLinearFilter : 
        (quality === 'medium' ? THREE.LinearMipmapNearestFilter : THREE.LinearFilter);
      
      this.textures.forEach(texture => {
        texture.minFilter = minFilter;
        texture.needsUpdate = true;
      });
    };
  }
  
  // Setup geometry optimization
  setupGeometryOptimization() {
    // Track all geometries
    this.geometries = [];
    
    // Find all geometries in the scene
    this.scene.traverse(object => {
      if (object.isMesh && object.geometry && !this.geometries.includes(object.geometry)) {
        this.geometries.push(object.geometry);
      }
    });
    
    // Optimize geometries
    this.geometries.forEach(geometry => {
      // Store original attributes
      geometry.userData.originalAttributes = {};
      
      for (const key in geometry.attributes) {
        geometry.userData.originalAttributes[key] = geometry.attributes[key].clone();
      }
      
      // Merge geometries where possible (would be implemented in a real scenario)
    });
  }
  
  // Setup render optimization
  setupRenderOptimization() {
    // Store original renderer settings
    this.rendererSettings = {
      pixelRatio: this.renderer.getPixelRatio(),
      shadowMapEnabled: this.renderer.shadowMap.enabled,
      shadowMapType: this.renderer.shadowMap.type,
      outputEncoding: this.renderer.outputEncoding,
      toneMapping: this.renderer.toneMapping,
      toneMappingExposure: this.renderer.toneMappingExposure
    };
    
    // Store original composer passes if available
    if (this.boxExperience.composer) {
      this.composerPasses = this.boxExperience.composer.passes.map(pass => ({
        pass: pass,
        enabled: pass.enabled
      }));
    }
    
    // Create methods to adjust render quality
    this.setRenderQuality = (quality) => {
      // Adjust pixel ratio
      switch (quality) {
        case 'ultra':
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
          break;
        case 'high':
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          break;
        case 'medium':
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          break;
        case 'low':
          this.renderer.setPixelRatio(1);
          break;
        default:
          this.renderer.setPixelRatio(this.rendererSettings.pixelRatio);
      }
      
      // Adjust shadow quality
      if (quality === 'low') {
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
      } else if (quality === 'medium') {
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
      } else {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      
      // Adjust post-processing if available
      if (this.boxExperience.composer) {
        this.boxExperience.composer.passes.forEach(pass => {
          // Disable expensive passes on lower quality settings
          if (pass.name === 'UnrealBloomPass') {
            pass.enabled = quality !== 'low';
            if (pass.enabled) {
              pass.strength = quality === 'ultra' ? 0.5 : 
                              (quality === 'high' ? 0.4 : 0.3);
            }
          } else if (pass.name === 'SSAOPass') {
            pass.enabled = quality === 'ultra' || quality === 'high';
          } else if (pass.name === 'BokehPass') {
            pass.enabled = quality === 'ultra';
          }
        });
      }
    };
  }
  
  // Setup culling optimizations
  setupCulling() {
    // Setup frustum culling
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
    
    // Track objects for manual culling
    this.cullableObjects = [];
    
    // Find objects that can be culled
    this.scene.traverse(object => {
      if (object.isMesh && !object.userData.noCulling) {
        this.cullableObjects.push(object);
        
        // Store original visibility
        object.userData.originalVisible = object.visible;
      }
    });
    
    // Create distance-based culling method
    this.updateCulling = () => {
      // Update frustum
      this.projScreenMatrix.multiplyMatrices(
        this.boxExperience.activeCamera.projectionMatrix,
        this.boxExperience.activeCamera.matrixWorldInverse
      );
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
      
      // Check each object
      this.cullableObjects.forEach(object => {
        // Skip if object has been removed
        if (!object.parent) return;
        
        // Get object bounding sphere
        if (!object.geometry.boundingSphere) {
          object.geometry.computeBoundingSphere();
        }
        
        // Create world bounding sphere
        const boundingSphere = object.geometry.boundingSphere.clone();
        boundingSphere.applyMatrix4(object.matrixWorld);
        
        // Check if in frustum
        const inFrustum = this.frustum.intersectsSphere(boundingSphere);
        
        // Check distance for LOD
        const distance = this.boxExperience.activeCamera.position.distanceTo(object.position);
        
        // Update visibility
        object.visible = inFrustum && object.userData.originalVisible;
        
        // Update geometry detail based on distance
        if (object.visible && object.userData.originalGeometry) {
          if (distance > 10 && object.userData.lowGeometry) {
            object.geometry = object.userData.lowGeometry;
          } else if (distance > 5 && object.userData.mediumGeometry) {
            object.geometry = object.userData.mediumGeometry;
          } else {
            object.geometry = object.userData.originalGeometry;
          }
        }
      });
      
      // Update particle system LOD if available
      if (this.boxExperience.particles && 
          this.boxExperience.particles.userData.setParticleCount) {
        
        // Get camera distance to center
        const distance = this.boxExperience.activeCamera.position.length();
        
        // Adjust particle count based on distance
        if (distance > 10) {
          this.boxExperience.particles.userData.setParticleCount(0.25);
        } else if (distance > 5) {
          this.boxExperience.particles.userData.setParticleCount(0.5);
        } else {
          this.boxExperience.particles.userData.setParticleCount(1.0);
        }
      }
    };
  }
  
  // Setup caching optimizations
  setupCaching() {
    // Create geometry cache
    THREE.Cache.enabled = true;
    
    // Setup object pooling for particles or other frequently created objects
    this.objectPools = {};
    
    // Create object pool method
    this.getFromPool = (type, createFunc) => {
      // Initialize pool if needed
      if (!this.objectPools[type]) {
        this.objectPools[type] = [];
      }
      
      // Get from pool or create new
      if (this.objectPools[type].length > 0) {
        return this.objectPools[type].pop();
      } else {
        return createFunc();
      }
    };
    
    // Return to pool method
    this.returnToPool = (type, object) => {
      if (!this.objectPools[type]) {
        this.objectPools[type] = [];
      }
      
      // Reset object state
      if (object.reset && typeof object.reset === 'function') {
        object.reset();
      }
      
      // Add to pool
      this.objectPools[type].push(object);
    };
  }
  
  // Setup web workers for heavy computations
  setupWorkers() {
    // Check if Web Workers are supported
    if (window.Worker) {
      // In a real implementation, we would create workers for:
      // - Physics calculations
      // - Particle system updates
      // - Geometry processing
      // - Path finding
      
      // For this example, we'll just create a mock worker
      this.mockWorker = {
        active: false,
        start: () => {
          this.mockWorker.active = true;
          console.log('Mock worker started');
        },
        stop: () => {
          this.mockWorker.active = false;
          console.log('Mock worker stopped');
        }
      };
    }
  }
  
  // Apply optimization level
  applyOptimizationLevel(level) {
    // Store current level
    this.currentOptimizationLevel = level;
    
    // If auto, determine best level based on device
    if (level === 'auto') {
      // Check if mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if low-end device
      const isLowEnd = isMobile || (window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency <= 4);
      
      // Check if high-end device
      const isHighEnd = !isMobile && window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency >= 8;
      
      // Set level based on device
      if (isLowEnd) {
        level = 'low';
      } else if (isHighEnd) {
        level = 'high';
      } else {
        level = 'medium';
      }
    }
    
    // Apply settings based on level
    switch (level) {
      case 'ultra':
        this.setRenderQuality('ultra');
        this.setMipmapQuality('high');
        break;
        
      case 'high':
        this.setRenderQuality('high');
        this.setMipmapQuality('high');
        break;
        
      case 'medium':
        this.setRenderQuality('medium');
        this.setMipmapQuality('medium');
        break;
        
      case 'low':
        this.setRenderQuality('low');
        this.setMipmapQuality('low');
        break;
    }
    
    // Log optimization level
    console.log(`Applied optimization level: ${level}`);
  }
  
  // Auto-optimize based on performance metrics
  autoOptimize() {
    // Skip if not in auto mode
    if (this.currentOptimizationLevel !== 'auto') return;
    
    // Calculate average FPS
    const avgFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / 
                  Math.max(1, this.fpsHistory.length);
    
    // Determine if we need to change quality
    let newLevel = null;
    
    if (avgFps < 30) {
      // Performance is poor, reduce quality
      if (this.currentOptimizationLevel === 'ultra') {
        newLevel = 'high';
      } else if (this.currentOptimizationLevel === 'high') {
        newLevel = 'medium';
      } else if (this.currentOptimizationLevel === 'medium') {
        newLevel = 'low';
      }
    } else if (avgFps > 55) {
      // Performance is good, try increasing quality
      if (this.currentOptimizationLevel === 'low') {
        newLevel = 'medium';
      } else if (this.currentOptimizationLevel === 'medium') {
        newLevel = 'high';
      } else if (this.currentOptimizationLevel === 'high') {
        newLevel = 'ultra';
      }
    }
    
    // Apply new level if needed
    if (newLevel && newLevel !== this.currentOptimizationLevel) {
      this.applyOptimizationLevel(newLevel);
    }
  }
  
  // Create performance HUD
  createPerformanceHUD() {
    // Only create in development mode
    if (window.location.hash !== '#dev') return;
    
    // Create HUD container
    const hud = document.createElement('div');
    hud.className = 'performance-hud';
    hud.innerHTML = `
      <div class="hud-content">
        <div class="hud-row">
          <span class="hud-label">FPS:</span>
          <span class="hud-value" id="hud-fps">60</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Draw Calls:</span>
          <span class="hud-value" id="hud-draw-calls">0</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Triangles:</span>
          <span class="hud-value" id="hud-triangles">0</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Memory:</span>
          <span class="hud-value" id="hud-memory">0 MB</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">Quality:</span>
          <span class="hud-value" id="hud-quality">auto</span>
        </div>
      </div>
    `;
    document.body.appendChild(hud);
    
    // Update HUD
    setInterval(() => {
      document.getElementById('hud-fps').textContent = Math.round(this.performanceMonitor.fps);
      document.getElementById('hud-draw-calls').textContent = this.performanceMonitor.drawCalls;
      document.getElementById('hud-triangles').textContent = this.performanceMonitor.triangles;
      document.getElementById('hud-memory').textContent = `${Math.round(this.performanceMonitor.memory)} MB`;
      document.getElementById('hud-quality').textContent = this.currentOptimizationLevel;
    }, 500);
  }
  
  // Update method called from main animation loop
  update() {
    // Update culling
    this.updateCulling();
    
    // Update stats if available
    if (this.stats) {
      this.stats.update();
    }
  }
}

export { PerformanceOptimizer };

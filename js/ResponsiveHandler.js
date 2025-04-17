// Responsive design implementation for the 3D box experience
import * as THREE from 'three';

class ResponsiveHandler {
  constructor(boxExperience) {
    this.boxExperience = boxExperience;
    this.scene = boxExperience.scene;
    this.camera = boxExperience.activeCamera;
    this.renderer = boxExperience.renderer;
    
    // Device detection
    this.isMobile = this.detectMobileDevice();
    this.isTablet = this.detectTabletDevice();
    this.deviceType = this.getDeviceType();
    
    // Initialize responsive features
    this.setupResponsiveRendering();
    this.setupTouchControls();
    this.setupDeviceOrientationControls();
    this.setupAdaptiveQuality();
    this.setupResponsiveLayout();
    this.setupEventListeners();
    
    // Apply initial device-specific optimizations
    this.applyDeviceOptimizations();
  }
  
  // Detect if user is on a mobile device
  detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && 
           window.innerWidth < 768;
  }
  
  // Detect if user is on a tablet device
  detectTabletDevice() {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
           (window.innerWidth >= 768 && window.innerWidth < 1024);
  }
  
  // Get device type for optimizations
  getDeviceType() {
    if (this.isMobile) return 'mobile';
    if (this.isTablet) return 'tablet';
    return 'desktop';
  }
  
  // Setup responsive rendering parameters
  setupResponsiveRendering() {
    // Set pixel ratio based on device
    if (this.isMobile) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else if (this.isTablet) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    }
    
    // Adjust camera parameters for different screen sizes
    this.updateCameraForScreenSize();
  }
  
  // Update camera parameters based on screen size
  updateCameraForScreenSize() {
    // Get current screen dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    
    // Update all cameras
    [
      this.boxExperience.externalCamera,
      this.boxExperience.internalCamera
    ].forEach(camera => {
      if (!camera) return;
      
      // Update aspect ratio
      camera.aspect = aspectRatio;
      
      // Adjust field of view for mobile (wider FOV for better experience on small screens)
      if (this.isMobile && camera.fov < 45) {
        camera.fov = 45;
      }
      
      // Update projection matrix
      camera.updateProjectionMatrix();
    });
    
    // Update active camera reference
    this.camera = this.boxExperience.activeCamera;
  }
  
  // Setup touch controls for mobile devices
  setupTouchControls() {
    // Skip if not mobile or tablet
    if (!this.isMobile && !this.isTablet) return;
    
    // Touch variables
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isTouching = false;
    
    // Add touch event listeners
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    
    // Create touch UI elements
    this.createTouchUI();
  }
  
  // Handle touch start event
  onTouchStart(event) {
    if (event.touches.length === 1) {
      // Prevent default only if in the canvas area
      const touch = event.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element && element.classList.contains('webgl')) {
        event.preventDefault();
      }
      
      // Store touch start position
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchMoveX = touch.clientX;
      this.touchMoveY = touch.clientY;
      this.isTouching = true;
      
      // Emit touch start event for other components
      const touchStartEvent = new CustomEvent('experienceTouchStart', {
        detail: {
          x: touch.clientX,
          y: touch.clientY,
          normalized: {
            x: (touch.clientX / window.innerWidth) * 2 - 1,
            y: -(touch.clientY / window.innerHeight) * 2 + 1
          }
        }
      });
      document.dispatchEvent(touchStartEvent);
    }
  }
  
  // Handle touch move event
  onTouchMove(event) {
    if (event.touches.length === 1 && this.isTouching) {
      const touch = event.touches[0];
      
      // Check if touch is on canvas
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.classList.contains('webgl')) {
        event.preventDefault();
      }
      
      // Calculate delta
      const deltaX = touch.clientX - this.touchMoveX;
      const deltaY = touch.clientY - this.touchMoveY;
      
      // Store current position for next delta calculation
      this.touchMoveX = touch.clientX;
      this.touchMoveY = touch.clientY;
      
      // Handle different states
      if (this.boxExperience.isInsideBox) {
        // Inside box - look around
        this.handleInsideBoxTouchMove(deltaX, deltaY);
      } else if (this.boxExperience.controls && this.boxExperience.controls.enabled) {
        // External view - orbit controls
        this.handleExternalTouchMove(deltaX, deltaY);
      }
      
      // Emit touch move event for other components
      const touchMoveEvent = new CustomEvent('experienceTouchMove', {
        detail: {
          x: touch.clientX,
          y: touch.clientY,
          deltaX: deltaX,
          deltaY: deltaY,
          normalized: {
            x: (touch.clientX / window.innerWidth) * 2 - 1,
            y: -(touch.clientY / window.innerHeight) * 2 + 1
          }
        }
      });
      document.dispatchEvent(touchMoveEvent);
    }
  }
  
  // Handle touch end event
  onTouchEnd(event) {
    // Calculate total movement
    const totalMoveX = Math.abs(this.touchMoveX - this.touchStartX);
    const totalMoveY = Math.abs(this.touchMoveY - this.touchStartY);
    
    // If minimal movement, consider it a tap
    if (totalMoveX < 10 && totalMoveY < 10) {
      this.handleTap(this.touchMoveX, this.touchMoveY);
    }
    
    this.isTouching = false;
    
    // Emit touch end event for other components
    const touchEndEvent = new CustomEvent('experienceTouchEnd', {
      detail: {
        x: this.touchMoveX,
        y: this.touchMoveY
      }
    });
    document.dispatchEvent(touchEndEvent);
  }
  
  // Handle inside box touch movement (look around)
  handleInsideBoxTouchMove(deltaX, deltaY) {
    if (!this.boxExperience.internalCamera) return;
    
    // Get current rotation
    const sensitivity = 0.002;
    this.boxExperience.lookEuler.y -= deltaX * sensitivity;
    
    // Limit vertical look
    const maxVerticalAngle = Math.PI / 3;
    this.boxExperience.lookEuler.x = Math.max(
      -maxVerticalAngle, 
      Math.min(maxVerticalAngle, this.boxExperience.lookEuler.x - deltaY * sensitivity)
    );
    
    // Apply rotation
    this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
  }
  
  // Handle external view touch movement (orbit)
  handleExternalTouchMove(deltaX, deltaY) {
    if (!this.boxExperience.controls) return;
    
    // Manually update orbit controls
    this.boxExperience.controls.rotateLeft(deltaX * 0.002);
    this.boxExperience.controls.rotateUp(deltaY * 0.002);
    this.boxExperience.controls.update();
  }
  
  // Handle tap (touch equivalent of click)
  handleTap(x, y) {
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Calculate normalized device coordinates
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    // Set raycaster
    raycaster.setFromCamera(mouse, this.boxExperience.activeCamera);
    
    // Check for intersections with the box
    if (this.boxExperience.boxModel) {
      const intersects = raycaster.intersectObject(this.boxExperience.boxModel, true);
      
      if (intersects.length > 0) {
        if (!this.boxExperience.isBoxOpen) {
          // Open the box
          this.boxExperience.boxAnimations.open();
        } else if (!this.boxExperience.isInsideBox) {
          // Enter the box
          this.boxExperience.boxAnimations.enterBox();
        }
      } else if (this.boxExperience.isInsideBox) {
        // Exit the box when tapping outside (only when inside)
        this.boxExperience.boxAnimations.exitBox();
      }
    }
    
    // Emit tap event for other components
    const tapEvent = new CustomEvent('experienceTap', {
      detail: {
        x: x,
        y: y,
        normalized: mouse
      }
    });
    document.dispatchEvent(tapEvent);
  }
  
  // Create touch UI elements for mobile
  createTouchUI() {
    // Create container for touch controls
    this.touchUI = document.createElement('div');
    this.touchUI.className = 'touch-ui';
    document.body.appendChild(this.touchUI);
    
    // Add help button for mobile instructions
    const helpButton = document.createElement('button');
    helpButton.className = 'touch-help-button';
    helpButton.innerHTML = '?';
    helpButton.addEventListener('click', this.showTouchInstructions.bind(this));
    this.touchUI.appendChild(helpButton);
  }
  
  // Show touch instructions overlay
  showTouchInstructions() {
    // Create or show instructions overlay
    let instructionsOverlay = document.getElementById('touch-instructions');
    
    if (!instructionsOverlay) {
      instructionsOverlay = document.createElement('div');
      instructionsOverlay.id = 'touch-instructions';
      instructionsOverlay.className = 'touch-instructions-overlay';
      instructionsOverlay.innerHTML = `
        <div class="instructions-content">
          <h2>Touch Controls</h2>
          <div class="instruction">
            <div class="instruction-icon">👆</div>
            <div class="instruction-text">Tap on the box to open it</div>
          </div>
          <div class="instruction">
            <div class="instruction-icon">👆</div>
            <div class="instruction-text">Tap on the open box to step inside</div>
          </div>
          <div class="instruction">
            <div class="instruction-icon">👆</div>
            <div class="instruction-text">Tap outside the box to exit</div>
          </div>
          <div class="instruction">
            <div class="instruction-icon">👆↕️</div>
            <div class="instruction-text">Drag to rotate view or look around</div>
          </div>
          <div class="instruction">
            <div class="instruction-icon">👆</div>
            <div class="instruction-text">Tap on products to view details</div>
          </div>
          <button class="close-instructions">Got it!</button>
        </div>
      `;
      document.body.appendChild(instructionsOverlay);
      
      // Add close button functionality
      const closeButton = instructionsOverlay.querySelector('.close-instructions');
      closeButton.addEventListener('click', () => {
        instructionsOverlay.classList.remove('active');
        setTimeout(() => {
          instructionsOverlay.style.display = 'none';
        }, 300);
      });
    }
    
    // Show with animation
    instructionsOverlay.style.display = 'flex';
    setTimeout(() => {
      instructionsOverlay.classList.add('active');
    }, 10);
  }
  
  // Setup device orientation controls for mobile
  setupDeviceOrientationControls() {
    // Skip if not mobile or tablet
    if (!this.isMobile && !this.isTablet) return;
    
    // Check if device orientation is available
    if (window.DeviceOrientationEvent) {
      // Create permission request button (needed for iOS)
      const permissionButton = document.createElement('button');
      permissionButton.className = 'orientation-permission-button';
      permissionButton.textContent = 'Enable Gyroscope';
      permissionButton.style.display = 'none';
      document.body.appendChild(permissionButton);
      
      // Check if permission is needed (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Show permission button when inside box
        document.addEventListener('enterBox', () => {
          permissionButton.style.display = 'block';
        });
        
        // Hide when exiting box
        document.addEventListener('exitBox', () => {
          permissionButton.style.display = 'none';
        });
        
        // Request permission when button is clicked
        permissionButton.addEventListener('click', () => {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
                permissionButton.style.display = 'none';
              }
            })
            .catch(console.error);
        });
      } else {
        // No permission needed, add listener directly
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
      }
    }
  }
  
  // Handle device orientation event
  handleDeviceOrientation(event) {
    // Only use orientation when inside box
    if (!this.boxExperience.isInsideBox) return;
    
    // Get orientation angles
    const beta = event.beta;  // x-axis rotation (-180 to 180)
    const gamma = event.gamma; // y-axis rotation (-90 to 90)
    const alpha = event.alpha; // z-axis rotation (0 to 360)
    
    // Skip if no valid data
    if (beta === null || gamma === null || alpha === null) return;
    
    // Convert to radians and apply to camera
    const degToRad = Math.PI / 180;
    
    // Apply rotation with limits
    const maxVerticalAngle = Math.PI / 3;
    
    // Calculate target rotation
    const targetX = THREE.MathUtils.clamp(beta * degToRad * 0.1, -maxVerticalAngle, maxVerticalAngle);
    const targetY = gamma * degToRad * 0.1;
    
    // Smoothly interpolate current rotation to target
    this.boxExperience.lookEuler.x = THREE.MathUtils.lerp(
      this.boxExperience.lookEuler.x,
      targetX,
      0.05
    );
    
    this.boxExperience.lookEuler.y = THREE.MathUtils.lerp(
      this.boxExperience.lookEuler.y,
      targetY,
      0.05
    );
    
    // Apply rotation
    this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
  }
  
  // Setup adaptive quality based on device performance
  setupAdaptiveQuality() {
    // Initial quality level based on device
    this.qualityLevel = this.isMobile ? 'low' : (this.isTablet ? 'medium' : 'high');
    
    // FPS monitoring for adaptive quality
    this.fpsMonitor = {
      frames: 0,
      lastTime: performance.now(),
      avgFps: 60,
      lowFpsCount: 0,
      checkInterval: 2000 // Check every 2 seconds
    };
    
    // Apply initial quality settings
    this.applyQualitySettings();
    
    // Start monitoring FPS for adaptive quality
    this.monitorPerformance();
  }
  
  // Apply quality settings based on current level
  applyQualitySettings() {
    // Get references to quality-dependent components
    const composer = this.boxExperience.composer;
    const renderer = this.boxExperience.renderer;
    
    if (!composer || !renderer) return;
    
    // Apply settings based on quality level
    switch (this.qualityLevel) {
      case 'low':
        // Reduce resolution
        renderer.setPixelRatio(1);
        
        // Disable expensive post-processing
        composer.passes.forEach(pass => {
          if (pass.name === 'UnrealBloomPass' || 
              pass.name === 'SSAOPass' || 
              pass.name === 'BokehPass') {
            pass.enabled = false;
          }
        });
        
        // Reduce shadow quality
        renderer.shadowMap.type = THREE.BasicShadowMap;
        
        // Reduce particle count if available
        if (this.boxExperience.particles) {
          this.boxExperience.particles.visible = false;
        }
        break;
        
      case 'medium':
        // Balanced resolution
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        // Enable basic post-processing
        composer.passes.forEach(pass => {
          if (pass.name === 'UnrealBloomPass') {
            pass.enabled = true;
            pass.strength = 0.3;
          } else if (pass.name === 'SSAOPass' || pass.name === 'BokehPass') {
            pass.enabled = false;
          }
        });
        
        // Medium shadow quality
        renderer.shadowMap.type = THREE.PCFShadowMap;
        
        // Reduce particle count if available
        if (this.boxExperience.particles && 
            this.boxExperience.particles.geometry.attributes.position) {
          // Show half of particles
          const count = this.boxExperience.particles.geometry.attributes.position.count;
          for (let i = 0; i < count; i++) {
            if (i % 2 === 0) {
              this.boxExperience.particles.geometry.attributes.size.array[i] = 0;
            }
          }
          this.boxExperience.particles.geometry.attributes.size.needsUpdate = true;
          this.boxExperience.particles.visible = true;
        }
        break;
        
      case 'high':
      default:
        // Full resolution
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable all post-processing
        composer.passes.forEach(pass => {
          pass.enabled = true;
        });
        
        // High shadow quality
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Full particle system
        if (this.boxExperience.particles) {
          this.boxExperience.particles.visible = true;
        }
        break;
    }
    
    // Log quality change
    console.log(`Quality set to: ${this.qualityLevel}`);
  }
  
  // Monitor performance for adaptive quality
  monitorPerformance() {
    // Update FPS counter
    this.fpsMonitor.frames++;
    const now = performance.now();
    const elapsed = now - this.fpsMonitor.lastTime;
    
    // Check FPS every interval
    if (elapsed >= this.fpsMonitor.checkInterval) {
      // Calculate average FPS
      const currentFps = (this.fpsMonitor.frames * 1000) / elapsed;
      this.fpsMonitor.avgFps = 0.7 * this.fpsMonitor.avgFps + 0.3 * currentFps;
      this.fpsMonitor.frames = 0;
      this.fpsMonitor.lastTime = now;
      
      // Adjust quality if needed
      this.adjustQualityBasedOnPerformance();
    }
    
    // Continue monitoring
    requestAnimationFrame(this.monitorPerformance.bind(this));
  }
  
  // Adjust quality based on performance
  adjustQualityBasedOnPerformance() {
    // Get current FPS
    const fps = this.fpsMonitor.avgFps;
    
    // Adjust quality based on FPS thresholds
    if (fps < 30) {
      this.fpsMonitor.lowFpsCount++;
      
      // If consistently low FPS, reduce quality
      if (this.fpsMonitor.lowFpsCount >= 3) {
        if (this.qualityLevel === 'high') {
          this.qualityLevel = 'medium';
          this.applyQualitySettings();
        } else if (this.qualityLevel === 'medium') {
          this.qualityLevel = 'low';
          this.applyQualitySettings();
        }
        this.fpsMonitor.lowFpsCount = 0;
      }
    } else if (fps > 55 && this.qualityLevel !== 'high') {
      // If FPS is good, consider increasing quality
      this.fpsMonitor.lowFpsCount = 0;
      
      // Only increase quality if device is capable
      if (this.qualityLevel === 'low' && !this.isMobile) {
        this.qualityLevel = 'medium';
        this.applyQualitySettings();
      } else if (this.qualityLevel === 'medium' && !this.isMobile && !this.isTablet) {
        this.qualityLevel = 'high';
        this.applyQualitySettings();
      }
    } else {
      // Reset counter if FPS is acceptable
      this.fpsMonitor.lowFpsCount = 0;
    }
  }
  
  // Setup responsive layout for UI elements
  setupResponsiveLayout() {
    // Add responsive CSS classes to body
    document.body.classList.add(`device-${this.deviceType}`);
    
    // Create responsive UI container
    this.responsiveUI = document.createElement('div');
    this.responsiveUI.className = 'responsive-ui';
    document.body.appendChild(this.responsiveUI);
    
    // Add device-specific UI elements
    if (this.isMobile) {
      this.createMobileUI();
    } else if (this.isTablet) {
      this.createTabletUI();
    } else {
      this.createDesktopUI();
    }
  }
  
  // Create mobile-specific UI
  createMobileUI() {
    // Add mobile navigation buttons
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-navigation';
    mobileNav.innerHTML = `
      <button class="nav-button home-button">Home</button>
      <button class="nav-button products-button">Products</button>
      <button class="nav-button contact-button">Contact</button>
    `;
    this.responsiveUI.appendChild(mobileNav);
    
    // Add event listeners
    mobileNav.querySelector('.home-button').addEventListener('click', () => {
      if (this.boxExperience.isInsideBox) {
        this.boxExperience.boxAnimations.exitBox();
      }
    });
    
    mobileNav.querySelector('.products-button').addEventListener('click', () => {
      // Trigger product showcase
      document.dispatchEvent(new CustomEvent('showProducts'));
    });
    
    mobileNav.querySelector('.contact-button').addEventListener('click', () => {
      // Show contact form
      if (typeof this.boxExperience.showContactForm === 'function') {
        this.boxExperience.showContactForm();
      } else {
        // Fallback - dispatch event for other components
        document.dispatchEvent(new CustomEvent('showContactForm'));
      }
    });
  }
  
  // Create tablet-specific UI
  createTabletUI() {
    // Add tablet navigation
    const tabletNav = document.createElement('div');
    tabletNav.className = 'tablet-navigation';
    tabletNav.innerHTML = `
      <button class="nav-button home-button">Home</button>
      <button class="nav-button products-button">Products</button>
      <button class="nav-button about-button">About</button>
      <button class="nav-button contact-button">Contact</button>
    `;
    this.responsiveUI.appendChild(tabletNav);
    
    // Add event listeners (similar to mobile)
    tabletNav.querySelector('.home-button').addEventListener('click', () => {
      if (this.boxExperience.isInsideBox) {
        this.boxExperience.boxAnimations.exitBox();
      }
    });
    
    tabletNav.querySelector('.products-button').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('showProducts'));
    });
    
    tabletNav.querySelector('.about-button').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('showAbout'));
    });
    
    tabletNav.querySelector('.contact-button').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('showContactForm'));
    });
  }
  
  // Create desktop-specific UI
  createDesktopUI() {
    // Add desktop controls help
    const controlsHelp = document.createElement('div');
    controlsHelp.className = 'desktop-controls-help';
    controlsHelp.innerHTML = `
      <div class="controls-icon">⌨️</div>
      <div class="controls-tooltip">
        <h3>Keyboard Controls</h3>
        <ul>
          <li><strong>Space:</strong> Open box / Enter box / Exit box</li>
          <li><strong>WASD:</strong> Move camera</li>
          <li><strong>Arrow Keys:</strong> Look around</li>
          <li><strong>I:</strong> Toggle info panel</li>
          <li><strong>ESC:</strong> Exit current view</li>
        </ul>
      </div>
    `;
    this.responsiveUI.appendChild(controlsHelp);
    
    // Add keyboard controls
    this.setupKeyboardControls();
  }
  
  // Setup keyboard controls for desktop
  setupKeyboardControls() {
    // Add keyboard event listener
    window.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'Space':
          // Already handled in BoxExperience
          break;
          
        case 'KeyW':
        case 'ArrowUp':
          // Move forward / look up
          if (this.boxExperience.isInsideBox) {
            this.boxExperience.lookEuler.x = Math.max(
              -Math.PI/3, 
              this.boxExperience.lookEuler.x - 0.05
            );
            this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
          }
          break;
          
        case 'KeyS':
        case 'ArrowDown':
          // Move backward / look down
          if (this.boxExperience.isInsideBox) {
            this.boxExperience.lookEuler.x = Math.min(
              Math.PI/3, 
              this.boxExperience.lookEuler.x + 0.05
            );
            this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
          }
          break;
          
        case 'KeyA':
        case 'ArrowLeft':
          // Move left / look left
          if (this.boxExperience.isInsideBox) {
            this.boxExperience.lookEuler.y += 0.05;
            this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
          }
          break;
          
        case 'KeyD':
        case 'ArrowRight':
          // Move right / look right
          if (this.boxExperience.isInsideBox) {
            this.boxExperience.lookEuler.y -= 0.05;
            this.boxExperience.internalCamera.quaternion.setFromEuler(this.boxExperience.lookEuler);
          }
          break;
          
        case 'Escape':
          // Exit current view
          if (this.boxExperience.isInsideBox) {
            this.boxExperience.boxAnimations.exitBox();
          }
          break;
      }
    });
  }
  
  // Apply device-specific optimizations
  applyDeviceOptimizations() {
    // Mobile optimizations
    if (this.isMobile) {
      // Reduce shadow quality
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      
      // Disable some post-processing effects if available
      if (this.boxExperience.composer) {
        this.boxExperience.composer.passes.forEach(pass => {
          if (pass.name === 'SSAOPass' || pass.name === 'BokehPass') {
            pass.enabled = false;
          }
        });
      }
      
      // Show mobile instructions on first visit
      if (!localStorage.getItem('mobileInstructionsShown')) {
        setTimeout(() => {
          this.showTouchInstructions();
          localStorage.setItem('mobileInstructionsShown', 'true');
        }, 3000);
      }
    }
    
    // Tablet optimizations
    if (this.isTablet) {
      // Medium shadow quality
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      
      // Adjust post-processing
      if (this.boxExperience.composer) {
        this.boxExperience.composer.passes.forEach(pass => {
          if (pass.name === 'SSAOPass') {
            pass.enabled = false;
          }
        });
      }
    }
  }
  
  // Setup event listeners for responsive behavior
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Handle orientation change
    window.addEventListener('orientationchange', this.onOrientationChange.bind(this));
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
  }
  
  // Handle window resize
  onWindowResize() {
    // Update device detection
    this.isMobile = this.detectMobileDevice();
    this.isTablet = this.detectTabletDevice();
    this.deviceType = this.getDeviceType();
    
    // Update body classes
    document.body.className = '';
    document.body.classList.add(`device-${this.deviceType}`);
    
    // Update camera parameters
    this.updateCameraForScreenSize();
    
    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update composer if available
    if (this.boxExperience.composer) {
      this.boxExperience.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  // Handle orientation change
  onOrientationChange() {
    // Wait for orientation change to complete
    setTimeout(() => {
      // Force resize event
      this.onWindowResize();
      
      // Show orientation message if needed
      if (window.innerHeight < window.innerWidth && this.isMobile) {
        this.showLandscapeMessage();
      } else {
        this.hideLandscapeMessage();
      }
    }, 300);
  }
  
  // Show landscape orientation message
  showLandscapeMessage() {
    let landscapeMsg = document.getElementById('landscape-message');
    
    if (!landscapeMsg) {
      landscapeMsg = document.createElement('div');
      landscapeMsg.id = 'landscape-message';
      landscapeMsg.className = 'landscape-message';
      landscapeMsg.innerHTML = `
        <div class="landscape-content">
          <div class="phone-icon">📱</div>
          <p>For the best experience, please rotate your device to portrait mode.</p>
          <button class="continue-landscape">Continue anyway</button>
        </div>
      `;
      document.body.appendChild(landscapeMsg);
      
      // Add continue button functionality
      const continueButton = landscapeMsg.querySelector('.continue-landscape');
      continueButton.addEventListener('click', () => {
        this.hideLandscapeMessage();
      });
    }
    
    // Show message
    landscapeMsg.style.display = 'flex';
  }
  
  // Hide landscape orientation message
  hideLandscapeMessage() {
    const landscapeMsg = document.getElementById('landscape-message');
    if (landscapeMsg) {
      landscapeMsg.style.display = 'none';
    }
  }
  
  // Handle visibility change (tab switching)
  onVisibilityChange() {
    if (document.hidden) {
      // Pause animations and sounds when tab is not visible
      if (this.boxExperience.clock) {
        this.boxExperience.clock.stop();
      }
    } else {
      // Resume when tab becomes visible again
      if (this.boxExperience.clock) {
        this.boxExperience.clock.start();
      }
    }
  }
  
  // Update method called from main animation loop
  update() {
    // Add any continuous updates here
  }
}

export { ResponsiveHandler };

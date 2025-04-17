// Cross-browser and cross-device testing utilities
import * as THREE from 'three';
import { Detector } from './utils/Detector.js';

class CrossBrowserTester {
  constructor(boxExperience) {
    this.boxExperience = boxExperience;
    this.scene = boxExperience.scene;
    this.renderer = boxExperience.renderer;
    
    // Browser and device detection
    this.browserInfo = this.detectBrowser();
    this.deviceInfo = this.detectDevice();
    this.webglInfo = this.checkWebGLSupport();
    
    // Test results
    this.testResults = {
      browserCompatibility: null,
      renderingCapabilities: null,
      performanceMetrics: null,
      touchInteraction: null,
      responsiveness: null
    };
    
    // Initialize testing
    this.setupCompatibilityChecks();
    this.setupFallbacks();
    this.createTestUI();
    
    // Log environment info
    this.logEnvironmentInfo();
  }
  
  // Detect browser type and version
  detectBrowser() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    // Chrome
    if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1 && userAgent.indexOf('OPR') === -1) {
      browser = 'Chrome';
      version = userAgent.match(/Chrome\/(\d+\.\d+)/)[1];
    }
    // Edge
    else if (userAgent.indexOf('Edg') !== -1) {
      browser = 'Edge';
      version = userAgent.match(/Edg\/(\d+\.\d+)/)[1];
    }
    // Firefox
    else if (userAgent.indexOf('Firefox') !== -1) {
      browser = 'Firefox';
      version = userAgent.match(/Firefox\/(\d+\.\d+)/)[1];
    }
    // Safari
    else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'Safari';
      version = userAgent.match(/Version\/(\d+\.\d+)/)[1];
    }
    // Opera
    else if (userAgent.indexOf('OPR') !== -1) {
      browser = 'Opera';
      version = userAgent.match(/OPR\/(\d+\.\d+)/)[1];
    }
    // IE
    else if (userAgent.indexOf('Trident') !== -1) {
      browser = 'Internet Explorer';
      version = userAgent.match(/rv:(\d+\.\d+)/)[1];
    }
    
    return {
      name: browser,
      version: version,
      userAgent: userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth < 1024),
      isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent))
    };
  }
  
  // Detect device capabilities
  detectDevice() {
    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchSupport: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
      orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
  }
  
  // Check WebGL support and capabilities
  checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    let gl;
    let glInfo = {
      supported: false,
      version: 'unknown',
      renderer: 'unknown',
      vendor: 'unknown',
      maxTextureSize: 0,
      maxCubeMapSize: 0,
      extensions: []
    };
    
    try {
      gl = canvas.getContext('webgl2');
      if (gl) {
        glInfo.supported = true;
        glInfo.version = 'WebGL 2.0';
      } else {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          glInfo.supported = true;
          glInfo.version = 'WebGL 1.0';
        }
      }
      
      if (gl) {
        glInfo.renderer = gl.getParameter(gl.RENDERER);
        glInfo.vendor = gl.getParameter(gl.VENDOR);
        glInfo.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        glInfo.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        
        // Get extensions
        const extensions = gl.getSupportedExtensions();
        glInfo.extensions = extensions || [];
      }
    } catch (e) {
      console.error('Error checking WebGL support:', e);
    }
    
    return glInfo;
  }
  
  // Setup compatibility checks
  setupCompatibilityChecks() {
    // Check browser compatibility
    this.testResults.browserCompatibility = {
      supported: this.isSupported(),
      issues: this.checkForBrowserIssues()
    };
    
    // Check rendering capabilities
    this.testResults.renderingCapabilities = {
      webgl2: this.webglInfo.version === 'WebGL 2.0',
      maxTextureSize: this.webglInfo.maxTextureSize,
      floatTextures: this.webglInfo.extensions.includes('OES_texture_float'),
      depthTextures: this.webglInfo.extensions.includes('WEBGL_depth_texture'),
      anisotropicFiltering: this.webglInfo.extensions.includes('EXT_texture_filter_anisotropic')
    };
    
    // Check performance metrics
    this.testResults.performanceMetrics = {
      fps: 0,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0
    };
    
    // Check touch interaction
    this.testResults.touchInteraction = {
      supported: this.deviceInfo.touchSupport,
      multiTouch: navigator.maxTouchPoints > 1,
      events: {
        touchstart: this.testTouchEvent('touchstart'),
        touchmove: this.testTouchEvent('touchmove'),
        touchend: this.testTouchEvent('touchend')
      }
    };
    
    // Check responsiveness
    this.testResults.responsiveness = {
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: this.deviceInfo.devicePixelRatio,
      orientationChange: 'orientationchange' in window
    };
  }
  
  // Check if browser is supported
  isSupported() {
    // Check for WebGL support
    if (!this.webglInfo.supported) {
      return false;
    }
    
    // Check for minimum browser versions
    const minVersions = {
      'Chrome': 70,
      'Firefox': 65,
      'Safari': 12,
      'Edge': 79,
      'Opera': 60
    };
    
    if (minVersions[this.browserInfo.name]) {
      const currentVersion = parseFloat(this.browserInfo.version);
      return currentVersion >= minVersions[this.browserInfo.name];
    }
    
    // Internet Explorer is not supported
    if (this.browserInfo.name === 'Internet Explorer') {
      return false;
    }
    
    // Default to supported if we can't determine
    return true;
  }
  
  // Check for known browser-specific issues
  checkForBrowserIssues() {
    const issues = [];
    
    // Safari WebGL issues
    if (this.browserInfo.name === 'Safari') {
      if (!this.webglInfo.extensions.includes('OES_texture_float')) {
        issues.push('Safari may have limited support for floating point textures');
      }
    }
    
    // Mobile Chrome memory issues
    if (this.browserInfo.name === 'Chrome' && this.browserInfo.isMobile) {
      issues.push('Mobile Chrome may have memory limitations for complex 3D scenes');
    }
    
    // iOS Safari issues
    if (this.browserInfo.name === 'Safari' && /iPhone|iPad|iPod/.test(this.browserInfo.userAgent)) {
      issues.push('iOS Safari may have issues with DeviceOrientation API requiring permission');
      
      // Check for iOS 13+ which requires permission for DeviceOrientation
      const match = this.browserInfo.userAgent.match(/OS (\d+)_/);
      if (match && parseInt(match[1]) >= 13) {
        issues.push('iOS 13+ requires user permission for DeviceOrientation API');
      }
    }
    
    // Firefox WebVR/XR issues
    if (this.browserInfo.name === 'Firefox') {
      issues.push('Firefox may have different WebXR implementation');
    }
    
    return issues;
  }
  
  // Test if a touch event is supported
  testTouchEvent(eventName) {
    let isSupported = false;
    
    try {
      const event = document.createEvent('TouchEvent');
      isSupported = true;
    } catch (e) {
      isSupported = false;
    }
    
    return isSupported;
  }
  
  // Setup fallbacks for unsupported features
  setupFallbacks() {
    // If WebGL is not supported, show fallback message
    if (!this.webglInfo.supported) {
      this.showWebGLFallback();
      return;
    }
    
    // If browser is not supported, show warning
    if (!this.testResults.browserCompatibility.supported) {
      this.showBrowserWarning();
    }
    
    // Setup specific fallbacks based on capabilities
    
    // Fallback for no float textures
    if (!this.testResults.renderingCapabilities.floatTextures) {
      this.setupFloatTextureFallback();
    }
    
    // Fallback for no anisotropic filtering
    if (!this.testResults.renderingCapabilities.anisotropicFiltering) {
      this.setupAnisotropicFallback();
    }
    
    // Fallback for touch devices
    if (this.deviceInfo.touchSupport) {
      this.setupTouchFallbacks();
    }
  }
  
  // Show WebGL not supported fallback
  showWebGLFallback() {
    // Create fallback container
    const fallbackContainer = document.createElement('div');
    fallbackContainer.className = 'webgl-fallback';
    fallbackContainer.innerHTML = `
      <div class="fallback-content">
        <h2>WebGL Not Supported</h2>
        <p>Unfortunately, your browser or device doesn't support WebGL, which is required for this 3D experience.</p>
        <div class="fallback-options">
          <h3>You can try:</h3>
          <ul>
            <li>Updating your browser to the latest version</li>
            <li>Trying a different browser like Chrome, Firefox, or Edge</li>
            <li>Checking if your graphics drivers are up to date</li>
            <li>Disabling hardware acceleration in your browser settings</li>
          </ul>
        </div>
        <div class="fallback-image">
          <img src="/assets/images/fallback-image.jpg" alt="JJ Enterprises Packaging" />
        </div>
        <div class="fallback-contact">
          <h3>Contact JJ Enterprises</h3>
          <p>Phone: +91 9819256432</p>
          <p>Email: info@thejjenterprise.com</p>
          <p>Address: ITT Bhatti, Dindoshipada, Goregaon</p>
        </div>
      </div>
    `;
    document.body.appendChild(fallbackContainer);
    
    // Hide canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'none';
    }
  }
  
  // Show browser warning
  showBrowserWarning() {
    const warningContainer = document.createElement('div');
    warningContainer.className = 'browser-warning';
    warningContainer.innerHTML = `
      <div class="warning-content">
        <p>Your browser may not fully support all features of this 3D experience. For the best experience, please use the latest version of Chrome, Firefox, Edge, or Safari.</p>
        <button class="warning-close">Continue Anyway</button>
      </div>
    `;
    document.body.appendChild(warningContainer);
    
    // Add close button functionality
    const closeButton = warningContainer.querySelector('.warning-close');
    closeButton.addEventListener('click', () => {
      warningContainer.style.display = 'none';
    });
  }
  
  // Setup fallback for float textures
  setupFloatTextureFallback() {
    // Replace any shaders using float textures with simpler versions
    if (this.boxExperience.corrugatedShader) {
      // Simplified version of the shader without float textures
      const simplifiedFragmentShader = `
        uniform vec3 diffuse;
        uniform float roughness;
        uniform sampler2D map;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          vec3 normal = normalize(vNormal);
          float diffuseFactor = max(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0);
          vec3 color = texColor.rgb * diffuse * (0.5 + 0.5 * diffuseFactor);
          gl_FragColor = vec4(color, 1.0);
        }
      `;
      
      // Replace shader if needed
      // In a real implementation, we would update all materials using this shader
    }
  }
  
  // Setup fallback for anisotropic filtering
  setupAnisotropicFallback() {
    // Increase mipmap quality to compensate for lack of anisotropic filtering
    this.scene.traverse(object => {
      if (object.isMesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          // Check for textures
          const textureProperties = [
            'map', 'normalMap', 'roughnessMap', 'metalnessMap', 
            'aoMap', 'emissiveMap', 'displacementMap', 'alphaMap'
          ];
          
          textureProperties.forEach(prop => {
            if (material[prop]) {
              // Use trilinear filtering as fallback
              material[prop].minFilter = THREE.LinearMipmapLinearFilter;
              material[prop].needsUpdate = true;
            }
          });
        });
      }
    });
  }
  
  // Setup fallbacks for touch devices
  setupTouchFallbacks() {
    // Add touch-specific UI elements if not already added
    if (!document.querySelector('.touch-controls')) {
      const touchControls = document.createElement('div');
      touchControls.className = 'touch-controls';
      
      // Add controls based on device type
      if (this.browserInfo.isTablet) {
        touchControls.innerHTML = `
          <div class="touch-button left-button">←</div>
          <div class="touch-button right-button">→</div>
          <div class="touch-button action-button">Action</div>
        `;
      } else if (this.browserInfo.isMobile) {
        touchControls.innerHTML = `
          <div class="touch-button action-button">Action</div>
        `;
      }
      
      document.body.appendChild(touchControls);
      
      // Add event listeners
      const actionButton = touchControls.querySelector('.action-button');
      if (actionButton) {
        actionButton.addEventListener('touchstart', () => {
          // Trigger action based on current state
          if (!this.boxExperience.isBoxOpen) {
            this.boxExperience.boxAnimations.open();
          } else if (!this.boxExperience.isInsideBox) {
            this.boxExperience.boxAnimations.enterBox();
          } else {
            this.boxExperience.boxAnimations.exitBox();
          }
        });
      }
      
      // Add rotation buttons for tablets
      if (this.browserInfo.isTablet) {
        const leftButton = touchControls.querySelector('.left-button');
        const rightButton = touchControls.querySelector('.right-button');
        
        if (leftButton && rightButton) {
          leftButton.addEventListener('touchstart', () => {
            // Rotate left
            if (this.boxExperience.controls) {
              this.boxExperience.controls.rotateLeft(0.1);
              this.boxExperience.controls.update();
            }
          });
          
          rightButton.addEventListener('touchstart', () => {
            // Rotate right
            if (this.boxExperience.controls) {
              this.boxExperience.controls.rotateRight(0.1);
              this.boxExperience.controls.update();
            }
          });
        }
      }
    }
  }
  
  // Create test UI for development
  createTestUI() {
    // Only create in development mode
    if (window.location.hash !== '#test') return;
    
    // Create test panel
    const testPanel = document.createElement('div');
    testPanel.className = 'test-panel';
    testPanel.innerHTML = `
      <div class="test-header">
        <h3>Cross-Browser Testing</h3>
        <button class="test-toggle">▼</button>
      </div>
      <div class="test-content">
        <div class="test-section">
          <h4>Browser Info</h4>
          <p>Name: ${this.browserInfo.name}</p>
          <p>Version: ${this.browserInfo.version}</p>
          <p>Device: ${this.browserInfo.isMobile ? 'Mobile' : (this.browserInfo.isTablet ? 'Tablet' : 'Desktop')}</p>
        </div>
        <div class="test-section">
          <h4>WebGL Info</h4>
          <p>Support: ${this.webglInfo.supported ? 'Yes' : 'No'}</p>
          <p>Version: ${this.webglInfo.version}</p>
          <p>Renderer: ${this.webglInfo.renderer}</p>
        </div>
        <div class="test-section">
          <h4>Test Actions</h4>
          <button id="test-open-box">Test Open Box</button>
          <button id="test-enter-box">Test Enter Box</button>
          <button id="test-exit-box">Test Exit Box</button>
          <button id="test-resize">Test Resize</button>
          <button id="test-orientation">Test Orientation</button>
        </div>
        <div class="test-section">
          <h4>Performance</h4>
          <p>FPS: <span id="test-fps">0</span></p>
          <p>Draw Calls: <span id="test-draw-calls">0</span></p>
          <p>Triangles: <span id="test-triangles">0</span></p>
        </div>
      </div>
    `;
    document.body.appendChild(testPanel);
    
    // Add toggle functionality
    const testToggle = testPanel.querySelector('.test-toggle');
    const testContent = testPanel.querySelector('.test-content');
    
    testToggle.addEventListener('click', () => {
      if (testContent.style.display === 'none') {
        testContent.style.display = 'block';
        testToggle.textContent = '▼';
      } else {
        testContent.style.display = 'none';
        testToggle.textContent = '▲';
      }
    });
    
    // Add test action handlers
    const testOpenBox = testPanel.querySelector('#test-open-box');
    testOpenBox.addEventListener('click', () => {
      if (this.boxExperience.boxAnimations && this.boxExperience.boxAnimations.open) {
        this.boxExperience.boxAnimations.open();
      }
    });
    
    const testEnterBox = testPanel.querySelector('#test-enter-box');
    testEnterBox.addEventListener('click', () => {
      if (this.boxExperience.boxAnimations && this.boxExperience.boxAnimations.enterBox) {
        this.boxExperience.boxAnimations.enterBox();
      }
    });
    
    const testExitBox = testPanel.querySelector('#test-exit-box');
    testExitBox.addEventListener('click', () => {
      if (this.boxExperience.boxAnimations && this.boxExperience.boxAnimations.exitBox) {
        this.boxExperience.boxAnimations.exitBox();
      }
    });
    
    const testResize = testPanel.querySelector('#test-resize');
    testResize.addEventListener('click', () => {
      // Simulate resize event
      window.dispatchEvent(new Event('resize'));
    });
    
    const testOrientation = testPanel.querySelector('#test-orientation');
    testOrientation.addEventListener('click', () => {
      // Simulate orientation change
      window.dispatchEvent(new Event('orientationchange'));
    });
    
    // Update performance metrics
    setInterval(() => {
      if (this.boxExperience.renderer && this.boxExperience.renderer.info) {
        const info = this.boxExperience.renderer.info;
        document.getElementById('test-fps').textContent = Math.round(this.testResults.performanceMetrics.fps);
        document.getElementById('test-draw-calls').textContent = info.render.calls;
        document.getElementById('test-triangles').textContent = info.render.triangles;
      }
    }, 1000);
  }
  
  // Log environment information
  logEnvironmentInfo() {
    console.log('Environment Information:');
    console.log('Browser:', this.browserInfo);
    console.log('Device:', this.deviceInfo);
    console.log('WebGL:', this.webglInfo);
    console.log('Test Results:', this.testResults);
  }
  
  // Run performance test
  runPerformanceTest() {
    // Start time
    const startTime = performance.now();
    let frames = 0;
    
    // Test duration in ms
    const testDuration = 5000;
    
    // Create test function
    const testFrame = () => {
      frames++;
      
      // Check if test is complete
      if (performance.now() - startTime < testDuration) {
        requestAnimationFrame(testFrame);
      } else {
        // Calculate results
        const elapsed = performance.now() - startTime;
        const fps = (frames * 1000) / elapsed;
        
        // Update test results
        this.testResults.performanceMetrics.fps = fps;
        
        if (this.boxExperience.renderer && this.boxExperience.renderer.info) {
          const info = this.boxExperience.renderer.info;
          this.testResults.performanceMetrics.drawCalls = info.render.calls;
          this.testResults.performanceMetrics.triangles = info.render.triangles;
        }
        
        if (window.performance && window.performance.memory) {
          this.testResults.performanceMetrics.memoryUsage = 
            window.performance.memory.usedJSHeapSize / 1048576; // MB
        }
        
        console.log('Performance Test Results:', this.testResults.performanceMetrics);
      }
    };
    
    // Start test
    requestAnimationFrame(testFrame);
  }
  
  // Create compatibility report
  createCompatibilityReport() {
    // Create report object
    const report = {
      timestamp: new Date().toISOString(),
      browser: this.browserInfo,
      device: this.deviceInfo,
      webgl: this.webglInfo,
      testResults: this.testResults,
      recommendations: []
    };
    
    // Add recommendations based on test results
    if (!this.webglInfo.supported) {
      report.recommendations.push('Use a browser with WebGL support');
    }
    
    if (this.browserInfo.name === 'Internet Explorer') {
      report.recommendations.push('Switch to a modern browser like Chrome, Firefox, or Edge');
    }
    
    if (this.testResults.performanceMetrics.fps < 30) {
      report.recommendations.push('Lower quality settings for better performance');
    }
    
    if (this.browserInfo.isMobile && this.testResults.performanceMetrics.drawCalls > 100) {
      report.recommendations.push('Optimize for mobile by reducing draw calls');
    }
    
    return report;
  }
  
  // Update method called from main animation loop
  update() {
    // Update FPS counter
    const now = performance.now();
    const elapsed = now - (this._lastUpdateTime || now);
    this._lastUpdateTime = now;
    
    if (elapsed > 0) {
      const currentFps = 1000 / elapsed;
      this.testResults.performanceMetrics.fps = 
        this.testResults.performanceMetrics.fps * 0.9 + currentFps * 0.1;
    }
    
    // Update draw calls and triangles
    if (this.boxExperience.renderer && this.boxExperience.renderer.info) {
      const info = this.boxExperience.renderer.info;
      this.testResults.performanceMetrics.drawCalls = info.render.calls;
      this.testResults.performanceMetrics.triangles = info.render.triangles;
    }
  }
}

// Detector utility for feature detection
class Detector {
  static isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  static isWebGL2Available() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }
  
  static isDeviceOrientationAvailable() {
    return 'DeviceOrientationEvent' in window;
  }
  
  static isTouchAvailable() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}

export { CrossBrowserTester, Detector };

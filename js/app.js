// Main application entry point for JJ Enterprises Immersive 3D Box Experience
import * as THREE from 'three';
import { BoxExperience } from './BoxExperience.js';
import { BusinessShowcase } from './BusinessShowcase.js';
import { AdvancedRenderer } from './AdvancedRenderer.js';
import { ResponsiveHandler } from './ResponsiveHandler.js';
import { PerformanceOptimizer } from './PerformanceOptimizer.js';
import { CrossBrowserTester, Detector } from './CrossBrowserTester.js';

// Check for WebGL support first
if (!Detector.isWebGLAvailable()) {
  showWebGLFallback();
} else {
  // Initialize the application
  initializeApplication();
}

// Show fallback content when WebGL is not supported
function showWebGLFallback() {
  // Hide loading screen
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  // Show WebGL fallback content
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
        <img src="assets/fallback-image.jpg" alt="JJ Enterprises Packaging" />
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
}

// Initialize the 3D application
function initializeApplication() {
  // Create loading screen animation
  animateLoadingScreen();
  
  // Create canvas for Three.js
  const canvas = document.createElement('canvas');
  canvas.className = 'webgl';
  document.body.appendChild(canvas);
  
  // Track loaded assets
  const assetsToLoad = 10; // Approximate number of assets to load
  let assetsLoaded = 0;
  
  // Asset loading progress handler
  const onAssetLoaded = () => {
    assetsLoaded++;
    updateLoadingProgress(assetsLoaded / assetsToLoad);
    
    // When all assets are loaded, initialize the experience
    if (assetsLoaded >= assetsToLoad) {
      initializeExperience(canvas);
    }
  };
  
  // Preload critical assets
  preloadAssets(onAssetLoaded);
  
  // Fallback for loading screen removal if assets take too long
  setTimeout(() => {
    if (assetsLoaded < assetsToLoad) {
      console.warn('Some assets are taking too long to load, proceeding anyway');
      initializeExperience(canvas);
    }
  }, 10000); // 10 second timeout
}

// Animate the loading screen
function animateLoadingScreen() {
  const loadingBar = document.querySelector('.loading-bar');
  if (!loadingBar) return;
  
  // Initial progress
  loadingBar.style.width = '5%';
  
  // Simulate initial loading progress
  let progress = 5;
  const interval = setInterval(() => {
    progress += Math.random() * 3;
    if (progress > 70) {
      clearInterval(interval);
    }
    loadingBar.style.width = `${Math.min(progress, 70)}%`;
  }, 200);
}

// Update loading progress
function updateLoadingProgress(progress) {
  const loadingBar = document.querySelector('.loading-bar');
  if (!loadingBar) return;
  
  // Calculate actual progress (70% from preload + 30% from initialization)
  const displayProgress = 70 + (progress * 30);
  loadingBar.style.width = `${displayProgress}%`;
}

// Preload assets
function preloadAssets(onAssetLoaded) {
  // Preload textures
  const textureLoader = new THREE.TextureLoader();
  const texturesToLoad = [
    'assets/textures/corrugated_color.jpg',
    'assets/textures/corrugated_normal.jpg',
    'assets/textures/corrugated_roughness.jpg',
    'assets/textures/corrugated_ao.jpg',
    'assets/textures/particle.png',
    'assets/textures/product_corrugated.jpg',
    'assets/textures/product_kraft.jpg',
    'assets/textures/product_custom.jpg'
  ];
  
  texturesToLoad.forEach(url => {
    textureLoader.load(url, () => onAssetLoaded());
  });
  
  // Preload environment map
  new THREE.TextureLoader().load('assets/environment.jpg', () => onAssetLoaded());
  
  // Preload fonts
  document.fonts.ready.then(() => onAssetLoaded());
}

// Initialize the 3D experience
function initializeExperience(canvas) {
  // Create core experience
  const boxExperience = new BoxExperience(canvas);
  
  // Add business showcase components
  const businessShowcase = new BusinessShowcase(boxExperience);
  
  // Add advanced rendering features
  const advancedRenderer = new AdvancedRenderer(boxExperience);
  
  // Add responsive handling
  const responsiveHandler = new ResponsiveHandler(boxExperience);
  
  // Add performance optimization
  const performanceOptimizer = new PerformanceOptimizer(boxExperience);
  
  // Add cross-browser testing utilities (only in test mode)
  let crossBrowserTester;
  if (window.location.hash === '#test') {
    crossBrowserTester = new CrossBrowserTester(boxExperience);
    crossBrowserTester.runPerformanceTest();
  }
  
  // Create business information overlay
  createBusinessInfoOverlay();
  
  // Override the animation loop to include our components
  const originalAnimate = boxExperience.animate;
  boxExperience.animate = function() {
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update business showcase
    if (businessShowcase.update) {
      businessShowcase.update(elapsedTime);
    }
    
    // Update advanced renderer
    if (advancedRenderer.update) {
      advancedRenderer.update(elapsedTime);
    }
    
    // Update responsive handler
    if (responsiveHandler.update) {
      responsiveHandler.update(elapsedTime);
    }
    
    // Update performance optimizer
    if (performanceOptimizer.update) {
      performanceOptimizer.update(elapsedTime);
    }
    
    // Update cross-browser tester
    if (crossBrowserTester && crossBrowserTester.update) {
      crossBrowserTester.update(elapsedTime);
    }
    
    // Call the original animation method
    originalAnimate.call(this);
  };
  
  // Start the animation loop
  boxExperience.animate();
  
  // Remove loading screen
  removeLoadingScreen();
  
  // Log initialization complete
  console.log('JJ Enterprises Immersive 3D Box Experience initialized successfully');
}

// Remove loading screen
function removeLoadingScreen() {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    // Update progress to 100%
    const loadingBar = loadingScreen.querySelector('.loading-bar');
    if (loadingBar) {
      loadingBar.style.width = '100%';
    }
    
    // Fade out loading screen
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          document.body.removeChild(loadingScreen);
        }
      }, 1000);
    }, 500);
  }
}

// Create business information overlay
function createBusinessInfoOverlay() {
  const infoOverlay = document.createElement('div');
  infoOverlay.className = 'info-overlay';
  infoOverlay.innerHTML = `
    <div class="company-logo">
      <h1>JJ Enterprises</h1>
      <p>Everything Printing & Packaging</p>
    </div>
    <div class="contact-info">
      <p><i class="phone-icon"></i> +91 9819256432</p>
      <p><i class="email-icon"></i> info@thejjenterprise.com</p>
      <p><i class="location-icon"></i> ITT Bhatti, Dindoshipada, Goregaon</p>
    </div>
    <div class="experience-instructions">
      <p>Click on the box to begin your immersive journey</p>
    </div>
  `;
  document.body.appendChild(infoOverlay);
  
  // Add event listener to minimize/expand info overlay
  const toggleButton = document.createElement('button');
  toggleButton.className = 'toggle-info';
  toggleButton.innerHTML = '<span>i</span>';
  toggleButton.setAttribute('aria-label', 'Toggle information panel');
  toggleButton.addEventListener('click', () => {
    infoOverlay.classList.toggle('minimized');
    toggleButton.classList.toggle('expanded');
    
    // Update aria-expanded attribute for accessibility
    const isExpanded = !infoOverlay.classList.contains('minimized');
    toggleButton.setAttribute('aria-expanded', isExpanded.toString());
  });
  document.body.appendChild(toggleButton);
  
  // Add keyboard shortcut for info panel (i key)
  window.addEventListener('keydown', (event) => {
    if (event.key === 'i') {
      infoOverlay.classList.toggle('minimized');
      toggleButton.classList.toggle('expanded');
      
      // Update aria-expanded attribute for accessibility
      const isExpanded = !infoOverlay.classList.contains('minimized');
      toggleButton.setAttribute('aria-expanded', isExpanded.toString());
    }
  });
}

// Add accessibility features
function setupAccessibility() {
  // Add skip to content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Skip to content';
  document.body.prepend(skipLink);
  
  // Add main content identifier
  const mainContent = document.createElement('div');
  mainContent.id = 'main-content';
  mainContent.setAttribute('role', 'main');
  mainContent.setAttribute('tabindex', '-1');
  document.body.appendChild(mainContent);
  
  // Add ARIA labels to interactive elements
  document.querySelectorAll('button').forEach(button => {
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', button.textContent.trim());
    }
  });
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAccessibility);
} else {
  setupAccessibility();
}

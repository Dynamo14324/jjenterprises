// Integration of WebGL and Three.js features with main application
import { BoxExperience } from './BoxExperience.js';
import { BusinessShowcase } from './BusinessShowcase.js';
import { AdvancedRenderer } from './AdvancedRenderer.js';
import './styles.css';
import './business-showcase.css';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create loading screen
  createLoadingScreen();
  
  // Initialize the 3D experience
  initializeExperience();
});

// Create loading screen with animated box
function createLoadingScreen() {
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'loading-screen';
  loadingScreen.innerHTML = `
    <div class="loading-content">
      <h1>JJ Enterprises</h1>
      <h2>Everything Printing & Packaging</h2>
      <div class="loading-box">
        <div class="loading-box-inner"></div>
      </div>
      <p>Loading immersive experience...</p>
      <div class="loading-progress">
        <div class="loading-bar"></div>
      </div>
    </div>
  `;
  document.body.appendChild(loadingScreen);
  
  // Simulate loading progress
  const loadingBar = loadingScreen.querySelector('.loading-bar');
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) {
      progress = 100;
      clearInterval(interval);
    }
    loadingBar.style.width = `${progress}%`;
  }, 200);
}

// Initialize the 3D experience
function initializeExperience() {
  // Create canvas for Three.js
  const canvas = document.createElement('canvas');
  canvas.className = 'webgl';
  document.body.appendChild(canvas);
  
  // Initialize the core box experience
  const boxExperience = new BoxExperience(canvas);
  
  // Add business showcase components
  const businessShowcase = new BusinessShowcase(boxExperience);
  
  // Add advanced rendering features
  const advancedRenderer = new AdvancedRenderer(boxExperience);
  
  // Create business information overlay
  createBusinessInfoOverlay();
  
  // Create performance monitor (in development mode)
  if (window.location.hash === '#dev') {
    createPerformanceMonitor();
  }
  
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
    
    // Call the original animation method
    originalAnimate.call(this);
  };
  
  // Remove loading screen after assets are loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loadingScreen = document.querySelector('.loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(loadingScreen);
        }, 1000);
      }
    }, 1000);
  });
  
  // Fallback for loading screen removal if load event doesn't fire
  setTimeout(() => {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen && !loadingScreen.classList.contains('fade-out')) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          document.body.removeChild(loadingScreen);
        }
      }, 1000);
    }
  }, 8000);
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
  toggleButton.addEventListener('click', () => {
    infoOverlay.classList.toggle('minimized');
    toggleButton.classList.toggle('expanded');
  });
  document.body.appendChild(toggleButton);
  
  // Add keyboard shortcut for info panel (i key)
  window.addEventListener('keydown', (event) => {
    if (event.key === 'i') {
      infoOverlay.classList.toggle('minimized');
      toggleButton.classList.toggle('expanded');
    }
  });
}

// Create performance monitor for development
function createPerformanceMonitor() {
  const stats = document.createElement('div');
  stats.className = 'performance-stats';
  stats.innerHTML = `
    <div class="stats-panel">
      <div class="stat">
        <span class="stat-label">FPS:</span>
        <span class="stat-value" id="fps">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">MS:</span>
        <span class="stat-value" id="ms">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">MB:</span>
        <span class="stat-value" id="mb">0</span>
      </div>
    </div>
  `;
  document.body.appendChild(stats);
  
  // Variables for FPS calculation
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  
  // Update stats
  function updateStats() {
    // Calculate FPS
    frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    
    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = currentTime;
      
      // Update DOM
      document.getElementById('fps').textContent = fps;
      document.getElementById('ms').textContent = Math.round(elapsed / frameCount);
      
      // Estimate memory usage (not accurate in all browsers)
      if (window.performance && window.performance.memory) {
        const memoryMB = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
        document.getElementById('mb').textContent = memoryMB;
      }
    }
    
    requestAnimationFrame(updateStats);
  }
  
  // Start monitoring
  updateStats();
}

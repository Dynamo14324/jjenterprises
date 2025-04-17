// Main entry point for the 3D Box Experience website
import { BoxExperience } from './BoxExperience.js';
import './styles.css';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create loading screen
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
    </div>
  `;
  document.body.appendChild(loadingScreen);
  
  // Create canvas for Three.js
  const canvas = document.createElement('canvas');
  canvas.className = 'webgl';
  document.body.appendChild(canvas);
  
  // Initialize the 3D experience
  const boxExperience = new BoxExperience(canvas);
  
  // Remove loading screen after assets are loaded
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(loadingScreen);
    }, 1000);
  }, 3000); // Simulated loading time - would be replaced with actual asset loading events
  
  // Add business information overlay
  createBusinessInfoOverlay();
});

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
}

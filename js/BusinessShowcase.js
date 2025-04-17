// Business showcase components for the 3D Box Experience
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

class BusinessShowcase {
  constructor(boxExperience) {
    this.boxExperience = boxExperience;
    this.scene = boxExperience.scene;
    this.camera = boxExperience.activeCamera;
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    
    // Business information
    this.businessInfo = {
      name: "JJ Enterprises",
      tagline: "Everything Printing & Packaging",
      phone: "+91 9819256432",
      email: "info@thejjenterprise.com",
      address: "ITT Bhatti, Dindoshipada, Goregaon",
      products: [
        {
          name: "Premium Corrugated Boxes",
          description: "High-quality corrugated boxes for shipping and packaging",
          image: "/assets/textures/product_corrugated.jpg"
        },
        {
          name: "Kraft Paper Bags",
          description: "Eco-friendly kraft paper bags for retail and gifts",
          image: "/assets/textures/product_kraft.jpg"
        },
        {
          name: "Custom Packaging Solutions",
          description: "Tailored packaging designs for your specific needs",
          image: "/assets/textures/product_custom.jpg"
        }
      ]
    };
    
    // Initialize components
    this.initProductShowcase();
    this.createBusinessInfoPanel();
    this.setupProductInteractions();
  }
  
  // Initialize product showcase inside the box
  initProductShowcase() {
    // Create product display area inside the box
    this.productShowcase = new THREE.Group();
    this.productShowcase.position.set(0, 0.1, 0);
    this.productShowcase.visible = false; // Initially hidden until box is opened
    this.scene.add(this.productShowcase);
    
    // Create product cards
    this.productCards = [];
    this.businessInfo.products.forEach((product, index) => {
      const card = this.createProductCard(product, index);
      this.productCards.push(card);
      this.productShowcase.add(card);
    });
    
    // Position cards in a circular arrangement
    this.arrangeProductCards();
    
    // Add event listener to show products when box is opened
    document.addEventListener('boxOpened', () => {
      this.productShowcase.visible = true;
      this.animateProductCards();
    });
    
    // Add event listener to hide products when inside box
    document.addEventListener('enterBox', () => {
      this.productShowcase.visible = false;
    });
    
    // Add event listener to show products when exiting box
    document.addEventListener('exitBox', () => {
      this.productShowcase.visible = true;
    });
  }
  
  // Create a 3D product card
  createProductCard(product, index) {
    // Card group
    const card = new THREE.Group();
    
    // Load product texture
    const texture = this.textureLoader.load(product.image, (texture) => {
      texture.encoding = THREE.sRGBEncoding;
    });
    
    // Create card geometry
    const cardGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const cardMaterial = [
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }), // right
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }), // left
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }), // top
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }), // bottom
      new THREE.MeshStandardMaterial({ map: texture }), // front
      new THREE.MeshStandardMaterial({ color: 0xd2b48c }) // back
    ];
    
    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    cardMesh.castShadow = true;
    cardMesh.receiveShadow = true;
    card.add(cardMesh);
    
    // Add product name text
    this.createTextTexture(product.name, 0.7, 0.1, 0x333333, (textTexture) => {
      const textGeometry = new THREE.PlaneGeometry(0.7, 0.1);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 0.2, 0.03);
      card.add(textMesh);
    });
    
    // Add product description text
    this.createTextTexture(product.description, 0.7, 0.15, 0x666666, (textTexture) => {
      const textGeometry = new THREE.PlaneGeometry(0.7, 0.15);
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, -0.15, 0.03);
      card.add(textMesh);
    });
    
    // Store product info in the card object for interaction
    card.userData = {
      product: product,
      index: index,
      originalPosition: new THREE.Vector3(),
      originalRotation: new THREE.Euler()
    };
    
    return card;
  }
  
  // Create a texture with text
  createTextTexture(text, width, height, color, callback) {
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512 * (height / width);
    
    // Set background transparent
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    
    // Wrap text if needed
    const words = text.split(' ');
    let line = '';
    let lines = [];
    const maxWidth = canvas.width * 0.8;
    const lineHeight = 40;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    // Draw lines
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    callback(texture);
  }
  
  // Arrange product cards in a circular pattern
  arrangeProductCards() {
    const radius = 1.2;
    const totalCards = this.productCards.length;
    
    this.productCards.forEach((card, index) => {
      const angle = (index / totalCards) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      
      card.position.set(x, 0, z);
      card.rotation.y = -angle + Math.PI;
      
      // Store original position and rotation for animations
      card.userData.originalPosition.copy(card.position);
      card.userData.originalRotation.copy(card.rotation);
      
      // Initially scale down
      card.scale.set(0.001, 0.001, 0.001);
    });
  }
  
  // Animate product cards appearing
  animateProductCards() {
    this.productCards.forEach((card, index) => {
      gsap.to(card.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        delay: 0.2 * index,
        ease: "elastic.out(1, 0.5)"
      });
      
      // Add floating animation
      gsap.to(card.position, {
        y: card.position.y + 0.1,
        duration: 1.5,
        delay: 0.2 * index + 1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    });
  }
  
  // Create business information panel inside the box
  createBusinessInfoPanel() {
    // Create a panel for business information
    const panelGeometry = new THREE.PlaneGeometry(1.5, 1);
    
    // Create canvas for the panel
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 682;
    
    // Fill background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    context.strokeStyle = '#d2b48c';
    context.lineWidth = 20;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add company name
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.fillStyle = '#333333';
    context.fillText(this.businessInfo.name, canvas.width / 2, 120);
    
    // Add tagline
    context.font = '36px Arial';
    context.fillStyle = '#666666';
    context.fillText(this.businessInfo.tagline, canvas.width / 2, 180);
    
    // Add separator line
    context.beginPath();
    context.moveTo(canvas.width * 0.2, 220);
    context.lineTo(canvas.width * 0.8, 220);
    context.strokeStyle = '#d2b48c';
    context.lineWidth = 4;
    context.stroke();
    
    // Add contact information
    context.font = '32px Arial';
    context.textAlign = 'left';
    context.fillStyle = '#333333';
    
    // Phone
    context.fillText(`Phone: ${this.businessInfo.phone}`, canvas.width * 0.2, 300);
    
    // Email
    context.fillText(`Email: ${this.businessInfo.email}`, canvas.width * 0.2, 350);
    
    // Address
    context.fillText(`Address: ${this.businessInfo.address}`, canvas.width * 0.2, 400);
    
    // Add call to action
    context.font = 'italic 36px Arial';
    context.textAlign = 'center';
    context.fillStyle = '#d2b48c';
    context.fillText('Explore our premium packaging solutions', canvas.width / 2, 500);
    context.font = 'bold 32px Arial';
    context.fillText('Click on products to learn more', canvas.width / 2, 550);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material and mesh
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });
    
    this.infoPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    this.infoPanel.position.set(0, 0.5, -0.45);
    this.infoPanel.rotation.x = -0.2;
    this.infoPanel.visible = false;
    
    // Add to scene
    this.scene.add(this.infoPanel);
    
    // Show panel when inside box
    document.addEventListener('enterBox', () => {
      this.infoPanel.visible = true;
      
      // Animate panel appearing
      gsap.fromTo(this.infoPanel.scale, 
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.7)" }
      );
    });
    
    // Hide panel when exiting box
    document.addEventListener('exitBox', () => {
      gsap.to(this.infoPanel.scale, {
        x: 0.001, y: 0.001, z: 0.001,
        duration: 0.5,
        onComplete: () => {
          this.infoPanel.visible = false;
        }
      });
    });
  }
  
  // Setup interactions with product cards
  setupProductInteractions() {
    // Raycaster for detecting interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Track currently focused product
    this.focusedProduct = null;
    
    // Add mouse move listener
    window.addEventListener('mousemove', (event) => {
      // Calculate mouse position in normalized device coordinates
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
      
      // Only check interactions when products are visible
      if (!this.productShowcase.visible || this.boxExperience.isInsideBox) return;
      
      // Update the raycaster
      this.raycaster.setFromCamera(this.mouse, this.boxExperience.activeCamera);
      
      // Check for intersections with product cards
      const intersects = this.raycaster.intersectObjects(this.productCards, true);
      
      if (intersects.length > 0) {
        // Find the parent card
        let cardMesh = intersects[0].object;
        let card = null;
        
        while (cardMesh && !card) {
          if (cardMesh.userData && cardMesh.userData.product) {
            card = cardMesh;
          } else {
            cardMesh = cardMesh.parent;
          }
        }
        
        if (card && this.focusedProduct !== card) {
          // Unfocus previously focused product
          if (this.focusedProduct) {
            this.unfocusProduct(this.focusedProduct);
          }
          
          // Focus new product
          this.focusProduct(card);
          this.focusedProduct = card;
          
          // Change cursor to pointer
          document.body.style.cursor = 'pointer';
        }
      } else if (this.focusedProduct) {
        // Unfocus product when mouse leaves
        this.unfocusProduct(this.focusedProduct);
        this.focusedProduct = null;
        
        // Reset cursor
        document.body.style.cursor = 'auto';
      }
    });
    
    // Add click listener for product selection
    window.addEventListener('click', (event) => {
      // Only check interactions when products are visible
      if (!this.productShowcase.visible || this.boxExperience.isInsideBox) return;
      
      // Update the raycaster
      this.raycaster.setFromCamera(this.mouse, this.boxExperience.activeCamera);
      
      // Check for intersections with product cards
      const intersects = this.raycaster.intersectObjects(this.productCards, true);
      
      if (intersects.length > 0) {
        // Find the parent card
        let cardMesh = intersects[0].object;
        let card = null;
        
        while (cardMesh && !card) {
          if (cardMesh.userData && cardMesh.userData.product) {
            card = cardMesh;
          } else {
            cardMesh = cardMesh.parent;
          }
        }
        
        if (card) {
          this.showProductDetails(card.userData.product);
        }
      }
    });
  }
  
  // Focus a product card (hover effect)
  focusProduct(card) {
    gsap.to(card.position, {
      y: card.userData.originalPosition.y + 0.2,
      duration: 0.5,
      ease: "power2.out"
    });
    
    gsap.to(card.scale, {
      x: 1.2,
      y: 1.2,
      z: 1.2,
      duration: 0.5,
      ease: "power2.out"
    });
  }
  
  // Unfocus a product card
  unfocusProduct(card) {
    gsap.to(card.position, {
      y: card.userData.originalPosition.y,
      duration: 0.5,
      ease: "power2.out"
    });
    
    gsap.to(card.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.5,
      ease: "power2.out"
    });
  }
  
  // Show detailed product information
  showProductDetails(product) {
    // Create or update product detail modal in DOM
    let modal = document.getElementById('product-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'product-modal';
      modal.className = 'product-modal';
      document.body.appendChild(modal);
    }
    
    // Update modal content
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>${product.name}</h2>
        <div class="product-image" style="background-image: url(${product.image})"></div>
        <p>${product.description}</p>
        <div class="product-features">
          <h3>Features:</h3>
          <ul>
            <li>Premium quality materials</li>
            <li>Customizable designs</li>
            <li>Eco-friendly options available</li>
            <li>Bulk ordering discounts</li>
          </ul>
        </div>
        <button class="inquiry-button">Request Quote</button>
      </div>
    `;
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Add close button functionality
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    });
    
    // Add inquiry button functionality
    const inquiryButton = modal.querySelector('.inquiry-button');
    inquiryButton.addEventListener('click', () => {
      this.showContactForm();
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    });
  }
  
  // Show contact form
  showContactForm() {
    // Create or update contact form in DOM
    let contactForm = document.getElementById('contact-form');
    
    if (!contactForm) {
      contactForm = document.createElement('div');
      contactForm.id = 'contact-form';
      contactForm.className = 'contact-form';
      document.body.appendChild(contactForm);
    }
    
    // Update form content
    contactForm.innerHTML = `
      <div class="form-content">
        <span class="close-button">&times;</span>
        <h2>Contact JJ Enterprises</h2>
        <p>Fill out the form below to request a quote or inquire about our products.</p>
        <form>
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" id="phone" name="phone">
          </div>
          <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="4" required></textarea>
          </div>
          <button type="submit" class="submit-button">Send Inquiry</button>
        </form>
      </div>
    `;
    
    // Show form with animation
    contactForm.style.display = 'flex';
    setTimeout(() => {
      contactForm.classList.add('active');
    }, 10);
    
    // Add close button functionality
    const closeButton = contactForm.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      contactForm.classList.remove('active');
      setTimeout(() => {
        contactForm.style.display = 'none';
      }, 300);
    });
    
    // Add form submission handler
    const form = contactForm.querySelector('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      // Show success message
      contactForm.innerHTML = `
        <div class="form-content">
          <h2>Thank You!</h2>
          <p>Your inquiry has been submitted successfully. We will contact you shortly.</p>
          <button class="close-button">Close</button>
        </div>
      `;
      
      // Add close button functionality
      const closeButton = contactForm.querySelector('.close-button');
      closeButton.addEventListener('click', () => {
        contactForm.classList.remove('active');
        setTimeout(() => {
          contactForm.style.display = 'none';
        }, 300);
      });
    });
  }
  
  // Update method called from main animation loop
  update() {
    // Add any continuous updates here
  }
}

export { BusinessShowcase };

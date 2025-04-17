# JJ Enterprises Immersive 3D Box Experience

This is a state-of-the-art single-page website for JJ Enterprises, a corrugated paper box manufacturing company. The website features an immersive 3D experience where users can interact with a virtual box, explore products, and learn about the company's services.

## Features

- **Immersive 3D Environment**: Interactive 3D box with opening animation and inside-box experience
- **Animated Box-Opening Sequences**: Realistic animations when interacting with the box
- **Layered 3D Corrugated Textures**: High-quality materials with realistic corrugated paper appearance
- **Dynamic Transitions**: Smooth animations between different states and views
- **Box-Themed Microinteractions**: Interactive elements with subtle animations
- **Responsive Design**: Mobile-first approach ensuring compatibility across all devices
- **Performance Optimizations**: Adaptive quality settings based on device capabilities
- **Accessibility Compliance**: WCAG guidelines implementation for inclusive user experience

## Installation

1. Upload all files to your web server, maintaining the directory structure
2. No server-side processing is required - this is a pure front-end application
3. The website will work on any standard web hosting service

## Browser Compatibility

The website is compatible with all modern browsers:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Opera 60+

Mobile browsers are also supported on iOS and Android devices.

## Directory Structure

```
/
├── index.html              # Main HTML file
├── css/
│   └── main.css            # Main stylesheet
├── js/
│   ├── app.bundle.js       # Main application bundle (minified)
│   └── polyfills.js        # Browser compatibility polyfills
└── assets/
    ├── textures/           # Texture files for 3D models
    ├── models/             # 3D model files
    └── images/             # Images and icons
```

## Usage

The website is designed to be intuitive and self-explanatory:
1. Users are greeted with a loading screen while assets are loaded
2. The main 3D box appears in the center of the screen
3. Users can click/tap on the box to open it
4. After opening, users can click/tap again to step inside the box
5. Inside the box, users can look around and explore product information
6. Clicking/tapping outside the box returns to the external view

## Customization

To customize the website for your needs:
1. Replace the company information in `index.html`
2. Update contact details in the info panel
3. Replace product images and descriptions in the business showcase component
4. Adjust colors in the CSS to match your brand

## Technical Details

The website uses the following technologies:
- Three.js for 3D rendering
- WebGL for hardware-accelerated graphics
- GSAP for animations
- Responsive design with CSS Grid and Flexbox
- ES6+ JavaScript with polyfills for older browsers

## Performance Considerations

The website includes adaptive quality settings that automatically adjust based on the device's capabilities. For optimal performance:
- Use a device with WebGL support
- Ensure your graphics drivers are up to date
- Close unnecessary browser tabs and applications

## Credits

Developed by Manus AI for JJ Enterprises.

## Contact

For any questions or support, please contact:
- Phone: +91 9819256432
- Email: info@thejjenterprise.com
- Address: ITT Bhatti, Dindoshipada, Goregaon

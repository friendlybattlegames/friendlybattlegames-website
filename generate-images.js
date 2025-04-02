import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Image configurations
const images = [
    { name: 'logo.png', width: 200, height: 50, text: 'FBG', bg: '#4a90e2' },
    { name: 'snake.jpg', width: 300, height: 200, text: 'Snake Game', bg: '#2ecc71' },
    { name: 'memory.jpg', width: 300, height: 200, text: 'Memory Game', bg: '#e74c3c' },
    { name: 'space-shooter.jpg', width: 300, height: 200, text: 'Space Shooter', bg: '#9b59b6' }
];

// Generate each image
images.forEach(img => {
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = img.bg;
    ctx.fillRect(0, 0, img.width, img.height);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${img.height * 0.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(img.text, img.width / 2, img.height / 2);

    // Save image
    const buffer = canvas.toBuffer(img.name.endsWith('.png') ? 'image/png' : 'image/jpeg');
    fs.writeFileSync(path.join(imagesDir, img.name), buffer);
    console.log(`Generated ${img.name}`);
});

console.log('All images generated successfully!');

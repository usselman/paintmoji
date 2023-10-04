let emojis = [
    127802, // 
    128152, // 
    127806, // 
    128640, // 
    127819, // 
    127754, // 
    128184, // 
    128142, // 
    127807, // 
    128172  // 
];

let currentEmojiIndex = 0;
let brushSize = 30;
let textColor = [0, 0, 0]; // RGB

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255);
    frameRate(100);
    textSize(windowWidth / 42);
    textSize(25);
    fill(textColor);
    for (let i = 0; i < emojis.length; i++) {
        text(String.fromCodePoint(emojis[i]), 10 + (i * 50), 30);
    }
    text("Click to draw.", 10, 80);
    text("Press BACKSPACE to clear.", 10, 130);
    text("Press 's' to switch emoji.", 10, 180);
    text("Press ENTER to save screenshot.", 10, 230);
    text("Press 'i' to show emoji list.", 10, 280);
    text("Press 'z' to increase brush size, 'x' to decrease.", 10, 330);
    text("Press 'c' to change text color", 10, 380);
    //text("Currently selected emoji: " + String.fromCodePoint(emojis[currentEmojiIndex]), 10, 310);
    text("Clear screen of text before screenshotting!", 10, 430);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    // Draw the text only if we're not capturing a screenshot
}

function keyPressed() {
    if (keyCode === ENTER) {
        saveCanvas('paintmoji', 'png'); // Capture the screenshot
    }
    if (key === 's') {
        // Switch to the next emoji in the array
        currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
    }
    if (keyCode === BACKSPACE) {
        // Clear the canvas
        background(255);
    }
    if (key === 'z') {
        brushSize += 5;
    }
    if (key === 'x') {
        brushSize = max(5, brushSize - 5);
    }
    if (key === 'c') {
        textColor = [random(255), random(255), random(255)];
    }
    if (keyIsDown(73)) {
        textSize(25);
        fill(textColor);
        for (let i = 0; i < emojis.length; i++) {
            text(String.fromCodePoint(emojis[i]), 10 + (i * 50), 30);
        }
    }
}

function keyIsDown() {

}

function mouseDragged() {
    textSize(brushSize);
    text(String.fromCodePoint(emojis[currentEmojiIndex]), mouseX, mouseY);
}
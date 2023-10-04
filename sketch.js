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
let captureScreenshot = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255);
    frameRate(100);
    textSize(windowWidth / 42);
    //text("Press 'i' for instructions", 10, 60);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    if (!captureScreenshot) {
        // Draw the text only if we're not capturing a screenshot
        // textSize(55);
        text("Drag to draw, click to create space.", 10, 60);
        text("Press BACKSPACE to clear.", 10, 110);
        text("Press 'n' to switch emoji.", 10, 160);
        text("Press ENTER to save screenshot.", 10, 210)
        text("Press 'i' to bring this back.", 10, 260);
        for (let i = 0; i < emojis.length; i++) {
            text(String.fromCodePoint(emojis[i]), 10 + (i * 50), 310);
        }
        //text("Currently selected emoji: " + String.fromCodePoint(emojis[currentEmojiIndex]), 10, 310);
        text("Clear screen of text before screenshotting!", 10, 360);
    }
}

function keyPressed() {
    if (keyCode === ENTER) {
        //captureScreenshot = true;
        // Set the flag to true before capturing
        //background(255); // Clear the canvas to remove text
        saveCanvas('paintmoji', 'png'); // Capture the screenshot
        //captureScreenshot = false; // Reset the flag
    }
    if (key === 'n') {
        // Switch to the next emoji in the array
        currentEmojiIndex = (currentEmojiIndex + 1) % emojis.length;
    }
    if (keyCode === BACKSPACE) {
        // Clear the canvas
        background(255);
    }
    if (keyIsDown(73)) {
        text("Drag to draw, click to create space.", 10, 60);
        text("Press BACKSPACE to clear.", 10, 110);
        text("Press 'n' to switch emoji.", 10, 160);
        text("Press ENTER to save screenshot.", 10, 210)
        text("Press 'i' to bring this back.", 10, 260);
        text("Currently selected emoji: " + String.fromCodePoint(emojis[currentEmojiIndex]), 10, 310);
        text("Clear screen of text before screenshotting!", 10, 360);
    }
}

function keyIsDown() {

}

function mouseMoved() {
    captureScreenshot = true;
    // Draw the emoji
    text(String.fromCodePoint(emojis[currentEmojiIndex]), mouseX, mouseY);
}
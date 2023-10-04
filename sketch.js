let emojis = [
    128020, 128021, 128022, 128023, // Fish emojis
    128512, 128513, 128514, 128515, // Face emojis
    128516, 128517, 128518, 128519, // More face emojis
    128522, 128523, 128524, 128525, // Even more face emojis
    128526, 128527, 128528, 128529, // And more face emojis
    128640, 128641, 128642, 128643, // Transport emojis
    128644, 128645, 128646, 128647, // More transport emojis
    128648, 128649, 128650, 128651, // And more transport emojis
    128052, 128053, 128054, 128055, // Animal emojis
    128056, 128057, 128058, 128059  // More animal emojis
];

let currentEmojiIndex = 10;
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
        text("Press 'i' for instructions.", 10, 260);
        text("Clear screen of text before screenshotting!", 10, 310);
    }
}

function keyPressed() {
    if (keyCode === ENTER) {
        //captureScreenshot = true;
        // Set the flag to true before capturing
        //background(255); // Clear the canvas to remove text
        saveCanvas('mojiPaint', 'png'); // Capture the screenshot
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
        text("Press 'i' for instructions.", 10, 260);
        text("Clear screen of text before screenshotting!", 10, 310);
    }
}

function keyIsDown() {

}

function mouseMoved() {
    captureScreenshot = true;
    // Draw the emoji
    text(String.fromCodePoint(emojis[currentEmojiIndex]), mouseX, mouseY);
}
let emojis = [
    127802, // 🌺
    128152, // 💘
    127806, // 🌾
    128640, // 🚀
    127819, // 🍋
    127754, // 🌊
    128184, // 💸
    128142, // 💎
    127807, // 🌿
    128172  // 💬
];

let currentEmojiIndex = 0;
let brushSize = 20;
let textColor = [0, 0, 0]; // RGB

let snapshots = []; // Array to hold snapshots of the canvas
let currentSnapshotIndex = -1; // Index to keep track of the current snapshot

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    background(255);
    frameRate(60);

    // Setup brush size slider
    let brushSlider = select('#brush-size');
    brushSlider.input(() => {
        brushSize = brushSlider.value();
    });

    // Setup emoji selector
    let emojiSelect = select('#emoji-select');
    emojiSelect.changed(() => {
        currentEmojiIndex = emojiSelect.elt.selectedIndex;
    });

    takeSnapshot();
}

function draw() {
    // Instructions and controls are now shown in the HTML, no need to render them here
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
    if (keyCode === ENTER) {
        saveCanvas('paintmoji', 'png'); // Capture the screenshot
    }
    if (keyCode === BACKSPACE) {
        // Clear the canvas
        background(255);
    }
    if (key === 'u') {
        undo();
    }
    if (key === 'r') {
        redo();
    }
}

function mouseDragged() {
    // Only draw if the mouse is within the canvas bounds and not over any control or info boxes
    if (mouseIsPressed && isMouseInCanvas() && !isMouseOverUI()) {
        textSize(brushSize);
        text(String.fromCodePoint(emojis[currentEmojiIndex]), mouseX, mouseY);
        takeSnapshot();
    }
}

function takeSnapshot() {
    let snapshot = get(); // Capture the current state of the canvas
    if (currentSnapshotIndex < snapshots.length - 1) {
        snapshots.splice(currentSnapshotIndex + 1); // Remove 'future' snapshots if any
    }
    snapshots.push(snapshot);
    currentSnapshotIndex++;
}

function undo() {
    if (currentSnapshotIndex > 0) {
        currentSnapshotIndex--;
        image(snapshots[currentSnapshotIndex], 0, 0); // Display the previous snapshot
    }
}

function redo() {
    if (currentSnapshotIndex < snapshots.length - 1) {
        currentSnapshotIndex++;
        image(snapshots[currentSnapshotIndex], 0, 0); // Display the next snapshot
    }
}

// Helper function to check if the mouse is within the canvas bounds
function isMouseInCanvas() {
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// Helper function to check if the mouse is over any UI element (info or controls boxes)
function isMouseOverUI() {
    const infoBox = document.getElementById('info-box').getBoundingClientRect();
    const controlsBox = document.getElementById('controls-box').getBoundingClientRect();
    return (
        (mouseX > infoBox.left && mouseX < infoBox.right && mouseY > infoBox.top && mouseY < infoBox.bottom) ||
        (mouseX > controlsBox.left && mouseX < controlsBox.right && mouseY > controlsBox.top && mouseY < controlsBox.bottom)
    );
}

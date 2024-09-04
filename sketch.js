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
let brushType = 'emoji'; // Default brush type
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

    // Setup brush type selector
    let brushSelect = select('#brush-select');
    brushSelect.changed(() => {
        brushType = brushSelect.value();
        toggleEmojiSelect(brushType === 'emoji');
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
        drawBrush(mouseX, mouseY);
        takeSnapshot();
    }
}

function drawBrush(x, y) {
    textSize(brushSize);
    switch (brushType) {
        case 'emoji':
            text(String.fromCodePoint(emojis[currentEmojiIndex]), x, y);
            break;
        case 'circle':
            ellipse(x, y, brushSize, brushSize);
            break;
        case 'square':
            rect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
            break;
        case 'triangle':
            triangle(x, y - brushSize / 2, x - brushSize / 2, y + brushSize / 2, x + brushSize / 2, y + brushSize / 2);
            break;
        case 'star':
            drawStar(x, y, brushSize / 2, brushSize, 5);
            break;
    }
}

function drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
    }
    endShape(CLOSE);
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

// Toggle emoji select visibility based on brush type
function toggleEmojiSelect(show) {
    document.getElementById('emoji-select').style.display = show ? 'block' : 'none';
}

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

let snapshots = []; // Array to hold snapshots of the canvas
let currentSnapshotIndex = -1; // Index to keep track of the current snapshot

/*
* DOM BUTTONS
*/
let undoButton;
let redoButton;
let saveButton;
let clearButton;
let emojiButton;

let canvasConstant = 550;

function setup() {
    //background(0);
    //size(windowWidth, windowHeight);
    push();
    let canvas = createCanvas(canvasConstant, canvasConstant);
    translate(width / 2, height / 2);
    canvas.center('horizontal');
    canvas.center('vertical');
    stroke(0);
    strokeWeight(3);
    fill(50, 50, 50);
    rect(0, 0, canvasConstant - 5, canvasConstant - 5);
    background(255);
    pop();
    frameRate(1000);
    textSize(windowWidth / 42);
    textSize(25);
    fill(textColor);
    displayButtons();
    takeSnapshot();
}

function displayButtons() {
    // fill(textColor);
    // stroke(0);
    // textSize(20);
    // undoButton = createButton('↩️');
    // undoButton.size(100, 40);
    // //undoButton.center('horizontal');
    // undoButton.position(windowWidth / 2 + 30, canvasConstant * 1.38);
    // undoButton.mousePressed(undo);

    // redoButton = createButton('↪️');
    // redoButton.size(100, 40);
    // redoButton.position(windowWidth / 2 - 100, canvasConstant * 1.38);
    // redoButton.mousePressed(redo);
    // noStroke();
}

function displayInstructions() {
    // let emojiSpan = createSpan(`Currently selected emoji: ${String.fromCodePoint(emojis[currentEmojiIndex])}`);
    // emojiSpan.position(20, 50);
    // let instructionSpan = createSpan(`
    // Click to draw! <br/> 
    // Press BACKSPACE to clear <br/> 
    // Press 's' to switch emoji. <br/> 
    // Press ENTER to save screenshot. <br/> 
    // Press 'z' to increase brush size <br/> 
    // Press 'c' to change text color <br/> 
    // Press 'u' to undo, 'r' to redo <br/> 
    // (Instructions and buttons do not render in screenshot) <br/> 
    // `);
    // instructionSpan.position(20, 80);

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    displayInstructions();
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
        displayInstructions();
    }
    if (key === 'u') {
        undo();
    }
    if (key === 'r') {
        redo();
    }
}

function mouseDragged() {
    textSize(brushSize);
    text(String.fromCodePoint(emojis[currentEmojiIndex]), mouseX, mouseY);
    takeSnapshot();
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
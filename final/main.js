function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);

    canvas.mouseClicked(touch);
}

function draw() {
}

function touch() {
    ellipse(mouseX, mouseY, 50, 50);
}

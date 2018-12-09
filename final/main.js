var darts = [];
var CENTER = new Point(view.size.width / 2, view.size.height / 2);
var NUMBEROFNOTES = 8
var NOTEHEIGHT = view.size.height / 2 / NUMBEROFNOTES
var NUMBEROFSTEPS = 8
console.log(CENTER)

var melody = []

function updateNoteSequence() {
    for (var i = 0; i < NUMBEROFSTEPS; i++) {
        melody[i] = new Set()
    }
    for (var i = 0; i < balls.length; i++) {
        var toCenter = balls[i].point.getDistance(CENTER)
        noteIndex = Math.floor(toCenter / NOTEHEIGHT)
        timeIndex = Math.floor(((balls[i].point - CENTER).angle + 180) / (360 / NUMBEROFSTEPS))
        if (noteIndex < NUMBEROFNOTES) {
            melody[timeIndex].add(noteIndex)
        }
    }
    console.log(melody)
    globals.updateMelody(melody)
}

//-------------------- ball --------------------
var INSTRUMENTS = [{
        color: '#f19066',
        note: 'C4'
    },
    {
        color: '#f5cd79',
        note: 'D4'
    },
    {
        color: '#546de5',
        note: 'E4'
    },
    {
        color: '#c44569',
        note: 'F4'
    },
    {
        color: '#574b90',
        note: 'G4'
    },
    {
        color: '#f78fb3',
        note: 'A4'
    },
    {
        color: '#3dc1d3',
        note: 'B4'
    },
    {
        color: '#e66767',
        note: 'C4'
    },
]

function randomChoice(arr) {
    var rand = Math.random()
    return arr[Math.floor(rand * (arr.length - 1))]
}

function Ball(r, p, v) {
    this.instrument = randomChoice(INSTRUMENTS)
    this.radius = r;
    this.point = p;
    this.vector = v;
    this.maxVec = 15;
    this.numSegment = 36;
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.touched = [];

    this.path = new Path({
        fillColor: {
            gradient: {
                stops: [
                    [this.instrument.color, 0.05],
                    ['#dc2430', 1]
                ],
                radial: true
            },
            origin: CENTER,
            destination: rect.bottomRight
        },
        blendMode: 'negation'
    });

    for (var i = 0; i < this.numSegment; i++) {
        this.boundOffset.push(this.radius);
        this.boundOffsetBuff.push(this.radius);
        this.path.add(new Point());
        this.sidePoints.push(new Point({
            angle: 360 / this.numSegment * i,
            length: 1
        }));
    }
}

Ball.prototype = {
    iterate: function() {
        this.checkBorders();
        if (this.vector.length > this.maxVec)
            this.vector.length = this.maxVec;
        this.vector *= 0.98;
        this.point += this.vector;
        this.updateShape();
    },

    checkBorders: function() {
        if (!ring.contains(this.point)) {
            this.path.fillColor.alpha = 0.1
        } else {
            this.path.fillColor.alpha = 1
        }
        // if (!rect.contains(this.point)) {
        //     this.remove()
        // }
    },

    updateShape: function() {
        var segments = this.path.segments;
        for (var i = 0; i < this.numSegment; i++)
            segments[i].point = this.getSidePoint(i);

        this.path.smooth();
        for (var i = 0; i < this.numSegment; i++) {
            if (this.boundOffset[i] < this.radius / 4)
                this.boundOffset[i] = this.radius / 4;
            var next = (i + 1) % this.numSegment;
            var prev = (i > 0) ? i - 1 : this.numSegment - 1;
            var offset = this.boundOffset[i];
            offset += (this.radius - offset) / 15;
            offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
            this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
        }
    },

    react: function(b) {
        var dist = this.point.getDistance(b.point);
        if (dist < this.radius + b.radius && dist != 0) {
            if (this.touched.indexOf(b) < 0 && b.touched.indexOf(this) < 0) {
                this.touched.push(b);
                globals.playTouchSound(this.instrument.note)
            }
            var overlap = this.radius + b.radius - dist;
            var direc = (this.point - b.point).normalize(overlap * 0.015);
            this.vector += direc;
            b.vector -= direc;
            this.vector *= 0.95
            b.vector *= 0.95

            this.calcBounds(b);
            b.calcBounds(this);
            this.updateBounds();
            b.updateBounds();
        } else {
            var ind = this.touched.indexOf(b)
            if (ind > -1) {
                this.touched.splice(ind)
            }
        }
    },

    getBoundOffset: function(b) {
        var diff = this.point - b;
        var angle = (diff.angle + 180) % 360;
        return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
    },

    calcBounds: function(b) {
        for (var i = 0; i < this.numSegment; i++) {
            var tp = this.getSidePoint(i);
            var bLen = b.getBoundOffset(tp);
            var td = tp.getDistance(b.point);
            if (td < bLen) {
                this.boundOffsetBuff[i] -= (bLen - td) / 2;
            }
        }
    },

    getSidePoint: function(index) {
        return this.point + this.sidePoints[index] * this.boundOffset[index];
    },

    updateBounds: function() {
        for (var i = 0; i < this.numSegment; i++)
            this.boundOffset[i] = this.boundOffsetBuff[i];
    }
};

//--------------------- main ---------------------

var balls = [];
var ballsToRemove = [];

globals.getBall = function(index) {
    return balls[index]
}

var curr_ball
var start_pos
tool.onMouseDown = function(event) {
    start_pos = event.point;
    var vector = new Point({
        angle: 0,
        length: 0
    });
    curr_ball = new Ball(20, start_pos, vector, 36)
    balls.push(curr_ball);
}

tool.onMouseDrag = function(event) {
    curr_ball.point = event.point
}

tool.onMouseUp = function(event) {
    curr_ball.vector = (event.point - start_pos) * 0.9
    curr_ball = undefined;
    updateNoteSequence()
}

var notesUpdated = true

function onFrame() {
    if (curr_ball) {
        curr_ball.radius += 0.5
    }
    for (var i = 0; i < balls.length - 1; i++) {
        for (var j = i + 1; j < balls.length; j++) {
            balls[i].react(balls[j]);
        }
    }

    var vectorsLength = 0
    for (var i = 0, l = balls.length; i < l; i++) {
        balls[i].iterate();
        vectorsLength += balls[i].vector.length
    }
    for (var i = 0; i < ballsToRemove.length; i++) {
        ballsToRemove[i].path.remove()
        balls.splice(balls.indexOf(ballsToRemove[i]))
    }
    ballsToRemove = [];
    if (vectorsLength < 0.5 && !notesUpdated) {
        updateNoteSequence()
        notesUpdated = true
        console.log("NOTES UPDATED")
    } else if (vectorsLength >= 0.5 && notesUpdated) {
        notesUpdated = false
    }
}

var rect = new Path.Rectangle({
    point: [0, 0],
    size: [view.size.width, view.size.height],
    strokeColor: 'white',
});
rect.sendToBack();
rect.fillColor = {
    gradient: {
        stops: [
            ['#7b4397', 0.05],
            ['#dc2430', 1]
        ],
        radial: true
    },
    origin: rect.position,
    destination: rect.bottomRight
};

var ring = new Path.Circle({
    center: CENTER,
    radius: NOTEHEIGHT * NUMBEROFNOTES * 0.9,
    strokeColor: 'white'
})

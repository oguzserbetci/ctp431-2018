var darts = [];
var CENTER = new Point(view.size.width/2, view.size.height/2);
var NUMBEROFNOTES = 8
var NOTEHEIGHT = view.size.height/2/NUMBEROFNOTES
var NUMBEROFSTEPS = 8
console.log(CENTER)

var melody = {0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[]}
function updateNoteSequence() {
    for (var i = 0; i < NUMBEROFSTEPS; i++) {
        melody[i] = new Set()
    }
    for (var i = 0; i < balls.length; i++) {
        var toCenter = balls[i].point.getDistance(CENTER)
        noteIndex = Math.floor(toCenter / NOTEHEIGHT)
        timeIndex = Math.floor(((balls[i].point - CENTER).angle + 180)/(360/NUMBEROFSTEPS))
        melody[timeIndex].add(noteIndex)
    }
    console.log(melody)
}

//-------------------- ball --------------------
var INSTRUMENTS = [
    {
        color: '#f19066',
        note: 'C4'
    },
    {
        color: '#f5cd79',
        note: 'E4'
    },
    {
        color: '#546de5',
        note: 'D4'
    },
    {
        color: '#e15f41',
        note: 'H4'
    },
    {
        color: '#c44569',
        note: 'G4'
    },
    {
        color: '#574b90',
        note: 'B4'
    },
    {
        color: '#f78fb3',
        note: 'A4'
    },
    {
        color: '#3dc1d3',
        note: 'C4'
    },
    {
        color: '#e66767',
        note: 'C4'
    },
]
function randomChoice(arr) {
    var rand = Math.random()
    return arr[Math.floor(rand * (arr.length-1))]
}

function Ball(r, p, v, numSegments, color) {
    this.instrument = randomChoice(INSTRUMENTS)
    this.radius = r;
    this.point = p;
    this.vector = v;
    // this.text = new PointText(this.point)
    // this.text.fillColor = 'white'
    // this.text.content = this.instrument.note
    this.maxVec = 15;
    if (numSegments !== undefined) {
        this.numSegment = numSegments;
    } else {
        this.numSegment = 36;
    }
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.touched = [];
    if (color !== undefined) {
        var fillcolor = color
    } else {
        var fillcolor = this.instrument.color
    }
    this.path = new Path({
        // fillColor: {
        //     hue: Math.random() * 365.0,
        //     saturation: 1,
        //     brightness: 1
        // },
        fillColor: fillcolor,
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
        var size = view.size;
        if (this.point.x < this.radius)
        {
            // balls.splice(balls.indexOf(this))
            // this.path.remove()
            this.vector = this.vector * new Point(-1, 1)
            // this.point.x = size.width + this.radius;
        }
        if (this.point.x > size.width - this.radius)
        {
            // balls.splice(balls.indexOf(this))
            // this.path.remove()
            this.vector = this.vector * new Point(-1, 1)
            // this.point.x = -this.radius;
        }
        if (this.point.y < this.radius)
        {
            // balls.splice(balls.indexOf(this))
            // this.path.remove()
            this.vector = this.vector * new Point(1, -1)
            // this.point.y = size.height + this.radius;
        }
        if (this.point.y > size.height - this.radius)
        {
            // balls.splice(balls.indexOf(this))
            // this.path.remove()
            this.vector = this.vector * new Point(1, -1)
        }
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
                // console.log("TOUCH", this.touched)
                this.touched.push(b);
                // synth.triggerAttackRelease('C3', '4n', Tone.now())
                globals.playTouchSound()
            }
            var overlap = this.radius + b.radius - dist;
            var direc = (this.point - b.point).normalize(overlap * 0.015);
            this.vector += direc;
            b.vector -= direc;

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

globals.getBall = function(index) {
    return balls[index]
}

var curr_ball
var start_pos
tool.onMouseDown = function(event) {
    start_pos = event.point;
    var vector = new Point({angle: 0, length: 0});
    curr_ball = new Ball(10, start_pos, vector, 36)
    console.log(curr_ball)
    balls.push(curr_ball);
    globals.play(balls[balls.length-1].instrument.note)
}

tool.onMouseDrag = function(event) {
    curr_ball.point = event.point
}

tool.onMouseUp = function(event) {
    curr_ball.vector = (event.point - start_pos)
    curr_ball = undefined;
    updateNoteSequence()
}

var notesUpdated = false
function onFrame() {
    if (curr_ball) {
        curr_ball.radius += 1
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
    if (vectorsLength < 0.5 && !notesUpdated) {
        updateNoteSequence()
        notesUpdated = true
        console.log("NOTES UPDATED")
    } else if (vectorsLength >= 0.5 && notesUpdated) {
        notesUpdated = false
    }
}

var dart_layer = new Layer();
for (var i = NUMBEROFNOTES; i > 0; i--) {
    var radius = i*NOTEHEIGHT;
    var circle = new Path.RegularPolygon(CENTER, NUMBEROFSTEPS, radius)
    circle.rotate(360/NUMBEROFSTEPS/2.0)
    circle.strokeColor = 'white'
    darts.push(circle)
}
var balls_layer = new Layer();

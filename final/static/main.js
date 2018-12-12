var socket = io('http://localhost:5000');
socket.emit('new player');
socket.on('message', function(data) {
    console.log(data);
});

var darts = [];
var CENTER = view.center;
var NUMBEROFNOTES = globals.NUMBEROFNOTES
var NUMBEROFSTEPS = globals.NUMBEROFSTEPS
var RINGRADIUS = Math.min(view.size.height, view.size.width)/2 * 0.9
globals.RINGRADIUS = RINGRADIUS

var rect = new Path.Rectangle({
    point: [0, 0],
    size: [view.size.width, view.size.height],
    strokeColor: 'white',
});
rect.sendToBack();

var ring = new Path.Circle({
    center: CENTER,
    radius: RINGRADIUS,
    strokeColor: 'white'
})
var OUTSIDECOLOR = undefined

globals.setBackground = function(color) {
    switch (color) {
    case 'black':
        rect.fillColor = {
            gradient: {
                stops: [
                    ['#333333', 0.05],
                    ['#555555', 1]
                ],
                radial: true
            },
            origin: rect.position,
            destination: rect.bottomRight
        };
        OUTSIDECOLOR = '#555555'
        ring.strokeColor = '#333333';
        break;
    case 'white':
        rect.fillColor = {
            gradient: {
                stops: [
                    ['#aaaaaa', 0.05],
                    ['#f0f0f0', 1]
                ],
                radial: true
            },
            origin: rect.position,
            destination: rect.bottomRight
        };
        ring.strokeColor = '#aaaaaa';
        OUTSIDECOLOR = '#f0f0f0';
        break;
    case 'red':
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
        ring.strokeColor = '#7b4397';
        OUTSIDECOLOR = '#dc2430';
        break;
    }
}

globals.setBackground('white')

var NOTEHEIGHT = RINGRADIUS / NUMBEROFNOTES

function updateStepSequencer() {
    var melody = new Array(NUMBEROFSTEPS);
    for (var i = 0; i < NUMBEROFSTEPS; i++) {
        melody[i] = new Array(NUMBEROFNOTES).fill(0)
    }
    for (var i = 0; i < balls.length; i++) {
        var toCenter = balls[i].point.getDistance(CENTER)
        var noteIndex = Math.floor(toCenter / NOTEHEIGHT)
        var timeIndex = Math.floor(((balls[i].point - CENTER).angle + 180) / (360 / NUMBEROFSTEPS))
        if (noteIndex < NUMBEROFNOTES) {
            melody[timeIndex][noteIndex] = balls[i]//Math.ceil((balls[i].radius - 10) / 3)
        }
    }
    // console.log('melody',melody)
    globals.updateStepSequencer(melody)
}

//-------------------- ball --------------------
var INSTRUMENTS = [{
        color: '#f19066',
        note: 'C4'
    },
    {
        color: '#f5cd79',
        note: 'D#3'
    },
    {
        color: '#546de5',
        note: 'F#3'
    },
    {
        color: '#c44569',
        note: 'C4'
    },
    {
        color: '#574b90',
        note: 'D#3'
    },
    {
        color: '#f78fb3',
        note: 'F#3'
    },
    {
        color: '#3dc1d3',
        note: 'C4'
    },
    {
        color: '#e66767',
        note: 'D#3'
    },
]

function Ball(r, p, v) {
    this.instrument = _.sample(INSTRUMENTS)
    this.radius = r;
    this.point = p;
    this.vector = v;
    this.maxVec = 15;
    this.numSegment = 36;
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.touched = [];

    this.path = new Path();
    this.setColor();

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
    iterate: function(point) {
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

    setColor: function() {
        this.path.fillColor = {
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
        this.path.blendMode = 'negation'
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
    },

    trigger: function() {
        console.log('trigger')
        this.path.instrument = randomChoice(INSTRUMENTS)
        this.path.fillColor = this.path.instrument.color
        // this.path.fillColor.tween(
        //     'white',
        //     {
        //         duration: 500,
        //         easing: 'easeOutCubic'
        //     }
        // )
        //     .then(function() {
        //     this.path.tweenTo(
        //         { fillColor: this.instrument.color },
        //         {
        //             duration: 500,
        //             easing: 'easeInCubic'
        //         }
        //     )
        // })
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
var positions = []

function normalize(point) {
    point = (point - CENTER)
    point.length /= RINGRADIUS
    return point
}

function denormalize(point) {
    point.length *= RINGRADIUS
    point = (point + CENTER)
    return point
}

function toCoordinates(event) {
    var relativePoint = normalize(event.point)
    return [relativePoint.x, relativePoint.y]
}

function toPoint(coordinates) {
    return denormalize(new Point(coordinates));
}

tool.onMouseDown = function(event) {
    // if (!ring.contains(event.point)) {
        var coordinates = toCoordinates(event)
        createBall(coordinates)
        socket.emit('createball', coordinates)
    // }
}

function createBall(coordinates) {
    positions.push(toPoint(coordinates))
    var vector = new Point({
        angle: 0,
        length: 0
    });
    curr_ball = new Ball(RINGRADIUS/100, positions[0], vector);
    balls.push(curr_ball);
}

tool.onMouseDrag = function(event) {
    if (curr_ball) {
        var coordinates = toCoordinates(event)
        dragBall(coordinates)
        socket.emit('balldrag', coordinates)
    }
}

function dragBall(coordinates) {
    curr_ball.point = toPoint(coordinates)
    positions.push(toPoint(coordinates))
}

tool.onMouseUp = function(event) {
    if (curr_ball) {
        var coordinates = toCoordinates(event)
        dropBall(coordinates)
        socket.emit('ballup', coordinates)
    }
}

function dropBall(coordinates) {
    if (positions.length > 3) {
        var start_pos = positions[positions.length - 3]
    } else {
        var start_pos = positions[0]
    }
    curr_ball.vector = (toPoint(coordinates) - start_pos) * 0.9
    console.log('new ball with radius', curr_ball.radius)
    curr_ball = undefined;
    updateStepSequencer()
    positions = []
}

var notesUpdated = true

socket.on('balldrag', function(coordinates) {
    console.log('drag')
    dragBall(coordinates)
});
socket.on('ballup', function(coordinates) {
    console.log('up')
    dropBall(coordinates)
});
socket.on('createball', function(coordinates) {
    console.log('create')
    createBall(coordinates)
});

function onFrame() {
    if (curr_ball) {
        curr_ball.radius += RINGRADIUS/200
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
        // updateNoteSequence()
        updateStepSequencer()
        notesUpdated = true
    } else if (vectorsLength >= 0.5 && notesUpdated) {
        notesUpdated = false
    }
}

// ------------------- tone ----------------

var distortion = new Tone.Distortion(0.3)
distortion.wet = 0
var tremolo = new Tone.Tremolo().start()
var reverb = new Tone.Freeverb(0.7, 2000)
// reverb.decay = 5
// reverb.delay = 0.5
// reverb.generate()

//create a synth and connect it to the effects and master output (your speakers)
var synth = new Tone.Synth().chain(distortion, tremolo, reverb, Tone.Master)
var notes = ['C4', 'E4', 'G4', 'B4']
var composer = {
    init: [0.7, 0.1, 0.1, 0.1],
    transition: [
        [0.2, 0.4, 0.2, 0.2],
        [0.3, 0.1, 0.4, 0.2],
        [0.1, 0.1, 0.4, 0.4],
        [0.5, 0.3, 0.1, 0.1]
    ]
}

var firstNote = true
function play(time) {
    console.log('play')
    var note_ind
    if (firstNote) {
        note_ind = biasedChoice(composer.init)
        firstNode = false
    } else {
        note_ind = biasedChoice(composer.transition[note_ind])
    }

    var note = notes[note_ind]
    console.log('play', note)

    //play a note for the duration of an 8th note
    synth.triggerAttackRelease(note, '8n', time)
}

Tone.Transport.scheduleRepeat(play, '2n', '2n');
Tone.Transport.start();

function biasedChoice(p) {
    rand = Math.random()
    thrs = 0
    for (var i = 0; i < p.length; i++) {
        thrs += p[i]
        if (rand <= thrs) {
            return Math.floor(rand * p.length)
        }
    }
}

function randomChoice(arr) {
    rand = Math.random()
    return arr[Math.floor(rand * arr.length)]
}

//-------------------- ball --------------------
var colors = ['#f19066', '#f5cd79', '#546de5', '#e15f41', '#c44569', '#574b90', '#f78fb3', '#3dc1d3', '#e66767']

function Ball(r, p, v) {
    this.radius = r;
    this.point = p;
    this.vector = v;
    this.maxVec = 15;
    this.numSegment = Math.floor(r / 3 + 2);
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.touched = [];
    this.path = new Path({
        // fillColor: {
        //     hue: Math.random() * 365.0,
        //     saturation: 1,
        //     brightness: 1
        // },
        fillColor: randomChoice(colors),
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
                console.log("TOUCH", this.touched)
                this.touched.push(b);
                synth.triggerAttackRelease('C3', '4n', Tone.now())
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

tool.onMouseDown = function(event) {
    var position = event.point;
    // var vector = new Point({
    //     angle: 360 * Math.random(),
    //     length: Math.random() * 10
    // });
    var vector = new Point({angle: 0, length: 0});
    var radius = Math.random() * 60 + 60;
    balls.push(new Ball(radius, position, vector));
}

function onFrame() {
    for (var i = 0; i < balls.length - 1; i++) {
        for (var j = i + 1; j < balls.length; j++) {
            balls[i].react(balls[j]);
        }
    }

    // var dists = new Array(balls.length);
    // for (var i = 0; i < balls.length - 1; i++) {
    //     dists[i] = new Array(balls.length);
    //     for (var j = 0; j < balls.length - 1; j++) {
    //         console.log("hello")
    //         if (i == j) {
    //             console.log("Hello")
    //             dists[i][j] = balls[i].radius;
    //         } else {
    //             dists[i][j] = balls[i].point.getDistance(balls[j].point)
    //         }
    //     }
    // }
    // updateMarkov(dists)

    for (var i = 0, l = balls.length; i < l; i++) {
        balls[i].iterate();
    }
}

function updateMarkov(dists) {
    console.log(dists);
}

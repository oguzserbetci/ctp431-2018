//create a synth and connect it to the master output (your speakers)
var distortion = new Tone.Distortion(0.3)
distortion.wet = 0
var tremolo = new Tone.Tremolo().start()
var reverb = new Tone.Reverb()
reverb.wet = 1
reverb.delay = 1
reverb.generate()


var synth = new Tone.Synth().chain(distortion, tremolo, reverb, Tone.Master)
var notes = ['C4', 'E4', 'G4', 'B4']
var composer = {
    init: [0.7, 0.1, 0.1, 0.1],
    transition: [[0.2,0.3,0.2,0.2],[0.3,0.1,0.4,0.2],[0.1,0.1,0.4,0.4],[0.5,0.3,0.1,0.1]]
}

function setup() {
    var canvas = createCanvas(windowWidth, windowHeight)

    canvas.mouseClicked(touch)
}

function draw() {
}

function touch() {
    ellipse(mouseX, mouseY, 50, 50)

    play()
}

function play() {
    var note = choice(notes, composer.init)
    for (var i = 0; i < 5; i++) {
        console.log(note)
        //play a middle 'C' for the duration of an 8th note
        synth.triggerAttackRelease(note, '8n', Tone.now() + 1)

        note = choice(notes, composer.transition[notes.indexOf(note)])
    }
}

function choice(arr, p) {
    ind = Math.floor(Math.random() * p.length)
    return arr[ind]
}

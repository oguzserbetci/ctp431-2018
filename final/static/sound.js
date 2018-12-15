// ------------------- tone ----------------
var gain = new Tone.Gain(0.4)

var distortion = new Tone.Distortion(0.1)
var tremolo = new Tone.Tremolo(9, 0.75).start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.5

async function playTouchSound(note) {
    bassSampler.triggerAttackRelease(INSTRUMENTNOTES['bassSampler'][note], '3n')
}

var sequence = new Array()
async function updateStepSequencer(newSequence) {
    sequence = newSequence;
}

var pianoSampler = new Tone.Sampler({
    "A4": "piano-f-a4.wav",
    "A5": "piano-f-a5.wav",
    "C5": "piano-f-c5.wav",
    "D#5": "piano-f-d%235.wav",
    "F#4": "piano-f-f%234.wav",
    "F#5": "piano-f-f%235.wav",
}, function() {
    document.querySelector("#loading").remove();
}, "static/Samples/Grand Piano/").chain(reverb, Tone.Master)

var bassSampler = new Tone.Sampler({
    "A3": "basses-piz-rr1-a3.wav",
    "C4": "basses-piz-rr1-c4.wav",
    "D#2": "basses-piz-rr1-d%232.wav",
    "D#3": "basses-piz-rr1-d%233.wav",
    "F#2": "basses-piz-rr1-f%232.wav",
    "F#3": "basses-piz-rr1-f%233.wav",
}, function() {
    document.querySelector("#loading").remove();
}, "static/Samples/Basses/").chain(tremolo, distortion, reverb, Tone.Master)

var harpSampler = new Tone.Sampler({
    "A4": "harp-a4.wav",
    "C4": "harp-c4.wav",
    "D#3": "harp-d%233.wav",
    "D#4": "harp-d%234.wav",
    "F#3": "harp-f%233.wav",
    "F#4": "harp-f%234.wav",
}, function() {
    document.querySelector("#loading").remove();
}, "static/Samples/Harp/").chain(reverb, Tone.Master)

var INSTRUMENT_NAMES = ["pianoSampler", "bassSampler", "harpSampler"]
var INSTRUMENTS = {
    pianoSampler: pianoSampler,
    bassSampler: bassSampler,
    harpSampler: harpSampler,
}

var INSTRUMENTDURATION = {
    harpSampler: 2,
    pianoSampler: 1,
    bassSampler: 10
}

// Notes:
// "a D-flat major seventh chord with an added ninth"
// from: https://teropa.info/blog/2016/07/28/javascript-systems-music.html
var NOTES = ["F4", "Ab4", "C5", "Db5", "Eb5", "F5", "Ab5"]
// INSTRUMENTS x NOTES
var INSTRUMENTNOTES = {
    pianoSampler: NOTES,
    bassSampler: ["F3", "Ab3", "C4", "Db4", "Eb4", "F4", "Ab4"],
    harpSampler: NOTES,
    pluckSynth: ["F2", "Ab2", "C3", "Db3", "Eb3", "F3", "Ab3"],
}

// NOTES x INSTRUMENTS
var INSTRUMENTPROBS = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
]

// shift each note differently to make a longer loop
var SHIFTS = [10, 4, 5, 8, 20, 2, 16]
var STEPS = _.range(12)
var COUNTER = 0

TIMEQUEUE = []
BALLQUEUE = []
var loop = new Tone.Sequence(function(time, step) {
    COUNTER += 1
    for (var i = 0; i < NOTES.length; i++) {
        if (sequence.length == 0 || i > (NOTES.length - 1)) {
            return
        }
        var column = sequence[step]
        var adjustedTime = new Tone.Time(time + (COUNTER * Tone.Time("1n") / SHIFTS[i]))
        if (column[i] !== 0) {
            var size = column[i].radius / globals.RINGRADIUS / 3
            var instrumentName = _.sample(INSTRUMENT_NAMES)
            var vel = Math.min(1.0, Math.max(1 / size / 2, 0.4))
            var duration = Math.ceil(size) * INSTRUMENTDURATION[instrumentName] + "n"
            var note = Tone.Frequency(INSTRUMENTNOTES[instrumentName][i])
            console.log(instrumentName, note._val, duration, vel)
            INSTRUMENTS[instrumentName].triggerAttackRelease(note, duration, adjustedTime, vel)
            TIMEQUEUE.push(adjustedTime)
            BALLQUEUE.push(column[i])
            Tone.Draw.schedule(function() {
                console.log(TIMEQUEUE, BALLQUEUE.length)
                var min = _.min(TIMEQUEUE)
                var nIndex = TIMEQUEUE.indexOf(min)
                BALLQUEUE[nIndex].trigger()
                BALLQUEUE.splice(nIndex, 1)
                TIMEQUEUE.splice(nIndex, 1)
            }, adjustedTime)
        }
    }
}, STEPS, '1n')
loop.start()

globals = {
    playTouchSound: playTouchSound,
    updateStepSequencer: updateStepSequencer,
    NUMBEROFNOTES: NOTES.length,
    NUMBEROFSTEPS: STEPS.length
}

Tone.Transport.start()

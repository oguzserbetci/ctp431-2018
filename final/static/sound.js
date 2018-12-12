// ------------------- tone ----------------
var gain = new Tone.Gain(0.4)

var distortion = new Tone.Distortion(0.1)
var tremolo = new Tone.Tremolo(9, 0.75).start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.5

async function playTouchSound(note) {
    bassSampler.triggerAttackRelease(note, '4n')
}

var matrix1 = new Array()
async function updateStepSequencer(matrix) {
    matrix1 = matrix;
}

var pianoSampler = new Tone.Sampler({
    "A4" : "piano-f-a4.wav",
    'A5' : 'piano-f-a5.wav',
    'A6' : 'piano-f-a6.wav',
    'C4' : 'piano-f-c4.wav',
    'C5' : 'piano-f-c5.wav',
    'C6' : 'piano-f-c6.wav',
    'D#4' : 'piano-f-d%234.wav',
    'D#5' : 'piano-f-d%235.wav',
    'D#6' : 'piano-f-d%236.wav',
    'F#4' : 'piano-f-f%234.wav',
    'F#5' : 'piano-f-f%235.wav',
    'F#6' : 'piano-f-f%236.wav'
}, function() {
    document.querySelector('#loading').remove();
}, 'static/Samples/Grand Piano/').connect(reverb);

var bassSampler = new Tone.Sampler({
    "A3" : "basses-piz-rr1-a3.wav",
    "C4" : "basses-piz-rr1-c4.wav",
    'D#2' : 'basses-piz-rr1-d%232.wav',
    'D#3' : 'basses-piz-rr1-d%233.wav',
    'F#2' : 'basses-piz-rr1-f%232.wav',
    'F#3' : 'basses-piz-rr1-d%233.wav',
}, function() {
    document.querySelector('#loading').remove();
}, 'static/Samples/Basses/').connect(gain);

var harpSampler = new Tone.Sampler({
    'A2' : 'harp-a2.wav',
    'A4' : 'harp-a4.wav',
    'C4' : 'harp-c4.wav',
    'C7' : 'harp-c7.wav',
    "D#3" : "harp-d%233.wav",
    "D#4" : "harp-d%234.wav",
    "F#3" : "harp-f%233.wav",
    "F#4" : "harp-f%234.wav",
}, function() {
    document.querySelector('#loading').remove();
}, 'static/Samples/Harp/').connect(reverb);

var distortion3 = new Tone.BitCrusher(8)
var fat = new Tone.PolySynth(3, Tone.Synth, {
		"oscillator" : {
				"type" : "fatsawtooth",
				"count" : 5,
				"spread" : 7
		},
		"envelope": {
				"attack": 0.1,
				"decay": 0.1,
				"sustain": 0.5,
				"release": 0.4,
				"attackCurve" : "exponential"
		},
}).chain(distortion3, Tone.Master);
var fat_lfo = new Tone.LFO('1n', 1000, 5000)
fat_lfo.connect(fat.detune)
// fat.set('detune', -3200)

var pluck = new Tone.PluckSynth({attackNoise:2, dampening:1000, resonance:0.9})
fat_lfo.connect(pluck.dampening)
pluck.chain(reverb, Tone.Master)

var INSTRUMENT_NAMES = ['pianoSampler', 'bassSampler', 'harpSampler'] // 'pluckSynth'
var INSTRUMENTS = {
    pianoSampler: pianoSampler,
    bassSampler: bassSampler,
    harpSampler: harpSampler,
    pluckSynth: pluck
}

var INSTRUMENTDURATION = {
    pluckSynth: 10,
    harpSampler: 2,
    pianoSampler: 1,
    bassSampler: 2
}

var NOTES = ['F3', 'Ab3', 'C4', 'Db4', 'Eb4', 'F4', 'Ab4']
var INSTRUMENTNOTES = {
    // from: TODO
    pianoSampler: NOTES,
    bassSampler: ['F3', 'Ab3', 'C4', 'Db4', 'Eb3', 'F3', 'Ab4'],
    harpSampler: ['F2', 'Ab2', 'C3', 'Db3', 'Eb3', 'F3', 'C7'],
    pluckSynth: ['F2', 'Ab2', 'C3', 'Db3', 'Eb3', 'F3', 'Ab3'],
}

// shift each note differently to make a longer loop
var SHIFTS = [10, 4, 5, 8, 20, 2, 16]
var STEPS = _.range(12)
var COUNTER = 0

var loop = new Tone.Sequence(function(time, step){
    COUNTER += 1
    for (var i = 0; i < NOTES.length; i++) {
        if (matrix1.length == 0 || i > (NOTES.length-1)) { return }
        var column = matrix1[step]
        if (column[i] !== 0) {
            var size = column[i].radius / globals.RINGRADIUS / 3
            var adjustedTime = new Tone.Time(time + (COUNTER * Tone.Time("1n")/SHIFTS[i]))
            var instrumentName = _.sample(INSTRUMENT_NAMES)
            var vel = Math.min(1.0, Math.max(1/size, 0.4))
            var duration = Math.ceil(size) * INSTRUMENTDURATION[instrumentName] + "n"
            var note = Tone.Frequency(INSTRUMENTNOTES[instrumentName][i])
            console.log(instrumentName, note._val, duration, vel)
            INSTRUMENTS[instrumentName].triggerAttackRelease(note, duration, adjustedTime, vel)
        }
    }
}, STEPS, '1n');
loop.probability = 0.8
loop.start()

function triggerNoise() {
    console.log('trigger noise')
    noiseSynth.triggerAttack()
}

function stopNoise() {
    console.log('stop noise')
    noiseSynth.triggerRelease()
}

var noiseSynth = new Tone.NoiseSynth({
    noise: {
        type: 'white'
    },
    envelope: {
        attack: 0.3,
        decay: 0.1,
        sustain: 0.1,
        release: 0.01,
    }
})
var distortion2 = new Tone.BitCrusher(1)
var vibrato = new Tone.Vibrato()
// distortion2.oversample = '4x'
var lfo = new Tone.LFO("4n", 400, 4000);
var filter = new Tone.Filter(4)
lfo.connect(filter.frequency)

noiseSynth.chain(filter, distortion2, tremolo, reverb, Tone.Master)

globals = {playTouchSound: playTouchSound,
           updateStepSequencer: updateStepSequencer,
           NUMBEROFNOTES: NOTES.length,
           NUMBEROFSTEPS: STEPS.length,
           triggerNoise: triggerNoise,
           stopNoise: stopNoise}

Tone.Transport.start()

// ------------------- tone ----------------
var distortion = new Tone.Distortion(0.1)
var tremolo = new Tone.Tremolo().start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.5;

var gain = new Tone.Gain(0.4)


//create a synth and connect it to the effects and master output (your speakers)
var synth = new Tone.Synth().chain(gain, distortion, tremolo, reverb, Tone.Master)

async function playTouchSound(note) {
    // synth.triggerAttackRelease(note, '16n')
    bassSampler.triggerAttackRelease(note, '4n')
}

var matrix1 = new Array()
async function updateStepSequencer(matrix) {
    matrix1 = matrix;
    console.log(matrix1)
}

var sampler = new Tone.Sampler({
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
}, 'static/Samples/Grand Piano/').connect(tremolo);

var bassSampler = new Tone.Sampler({
    "C4" : "basses-piz-rr1-c4.wav",
    'D#3' : 'basses-piz-rr1-d%233.wav',
    'F#3' : 'basses-piz-rr1-d%233.wav',
}, function() {
    document.querySelector('#loading').remove();
}, 'static/Samples/Basses/').connect(gain);

var harpSampler = new Tone.Sampler({
    "F#3" : "harp-f%233.wav",
    "F#4" : "harp-f%234.wav",
    "D#3" : "harp-d%233.wav",
    "D#4" : "harp-d%234.wav",
    'A2' : 'harp-a2.wav',
    'A4' : 'harp-a4.wav',
    'C4' : 'harp-c4.wav',
}, function() {
    document.querySelector('#loading').remove();
}, 'static/Samples/Harp/').connect(reverb);

var INSTRUMENTS = [sampler, bassSampler, harpSampler]

// var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var NOTES = ['F3', 'Ab3', 'C4', 'Db4', 'Eb4', 'F4', 'Ab4']
var SHIFTS = [0.1, 0.12, 0.15, 0.17, 0.7, .27, .2]
var STEPS = _.range(12)
var COUNTER = 0

var loop = new Tone.Sequence(function(time, step){
    COUNTER += 1
    for (var i = 0; i < NOTES.length; i++) {
        if (matrix1.length == 0 || i > (NOTES.length-1)) { return }
        var column = matrix1[step]
        if (column[i] !== 0) {
            var size = (column[i].radius-1)/(16-1) * 1
            var vel = Math.min(1.0, Math.max(1/size, 0.4))
            var duration = Math.ceil(size) + "n"
            console.log(NOTES[i], duration, vel)
            var adjustedTime = new Tone.Time(time + (COUNTER/2 * SHIFTS[i]))
            _.sample(INSTRUMENTS).triggerAttackRelease(Tone.Frequency(NOTES[i]), duration, adjustedTime, vel)
        }
    }
    // noiseSynth.triggerAttackRelease('16n', time, 1)
}, STEPS, '1n');
loop.probability = 0.7
loop.start()

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

noiseSynth.chain(filter, distortion2, vibrato, reverb, Tone.Master)

globals = {playTouchSound: playTouchSound,
           updateStepSequencer: updateStepSequencer,
           NUMBEROFNOTES: NOTES.length,
           NUMBEROFSTEPS: STEPS.length}

Tone.Transport.start()

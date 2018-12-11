// ------------------- tone ----------------
var distortion = new Tone.Distortion(0.8)
var tremolo = new Tone.Tremolo().start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.4;

var gain = new Tone.Gain(0.1)

Tone.Transport.start()

//create a synth and connect it to the effects and master output (your speakers)
var synth = new Tone.Synth().chain(gain, distortion, tremolo, reverb, Tone.Master)

async function playTouchSound(note) {
    synth.triggerAttackRelease(note, '16n')
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
}, 'static/Samples/Grand Piano/').connect(reverb);

// var bassSampler = new Tone.Sampler({
//     "C4" : "basses-piz-rr1-c4.wav",
//     'D#3' : 'basses-piz-rr1-d%233.wav',
//     'F#3' : 'basses-piz-rr1-d%233.wav',
//     'F4' : 'piano-f-c4.wav',
//     'G4' : 'piano-f-c5.wav',
//     'A4' : 'piano-f-c6.wav',
//     'B4' : 'piano-f-d%234.wav',
//     'C5' : 'piano-f-d%235.wav'
// }, function() {
//     document.querySelector('#loading').remove();
// }, 'Samples/Basses/').connect(reverb);

// var NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var NOTES = ['F4', 'Ab4', 'C5', 'Db5', 'Eb5', 'F5', 'Ab5']
var STEPS = _.range(12)

var loop = new Tone.Sequence(function(time, col){
    if (matrix1.length == 0) { return }
		var column = matrix1[col];
		for (var i = 0; i < NOTES.length; i++){
				if (column[i] > 0){
					  //slightly randomized velocities
					  var vel = 1/column[i];
            var duration = column[i] + "n"
					  sampler.triggerAttackRelease(Tone.Frequency(NOTES[i]), column[i] + "n", time);
            console.log(NOTES[i], duration, vel)
				}
		}
}, STEPS, "1n");
loop.start()


globals = {playTouchSound: playTouchSound,
           updateStepSequencer: updateStepSequencer,
           NUMBEROFNOTES: NOTES.length,
           NUMBEROFSTEPS: STEPS.length}

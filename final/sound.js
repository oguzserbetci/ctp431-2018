// ------------------- tone ----------------
var distortion = new Tone.Distortion(0.8)
var tremolo = new Tone.Tremolo().start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.4;

var gain = new Tone.Gain(0.3)

//create a synth and connect it to the effects and master output (your speakers)
var synth = new Tone.Synth().chain(gain, distortion, tremolo, reverb, Tone.Master)

async function playTouchSound(note) {
    synth.triggerAttackRelease(note, '16n')
}

// Tone.Transport.scheduleRepeat(play, '2n');
Tone.Transport.start();

// *******
// MAGENTA
// *******

// Initialize the model.
music_rnn = new mm.MusicRNN('https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/chord_pitches_improv');

// Create a player to play the sequence we'll get from the model.
rnnPlayer = new mm.SoundFontPlayer("https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus");
rnn_steps = 20;
rnn_temperature = 1.1;

var chordProgressions = new Tone.CtrlMarkov({
  0: [
    { value: 1, probability: 0.1 },
    { value: 2, probability: 0.01 },
    { value: 3, probability: 0.13 },
    { value: 4, probability: 0.52 },
    { value: 5, probability: 0.02 },
    { value: 6, probability: 0.22 }
  ],
  1: [
    { value: 0, probability: 0.06 },
    { value: 2, probability: 0.02 },
    { value: 3, probability: 0.0 },
    { value: 4, probability: 0.87 },
    { value: 5, probability: 0.0 },
    { value: 6, probability: 0.05 }
  ],
  2: [
    { value: 0, probability: 0.0 },
    { value: 1, probability: 0.0 },
    { value: 3, probability: 0.0 },
    { value: 4, probability: 0.67 },
    { value: 5, probability: 0.33 },
    { value: 6, probability: 0.0 }
  ],
  3: [
    { value: 0, probability: 0.33 },
    { value: 1, probability: 0.03 },
    { value: 2, probability: 0.07 },
    { value: 4, probability: 0.4 },
    { value: 5, probability: 0.03 },
    { value: 6, probability: 0.13 }
  ],
  4: [
    { value: 0, probability: 0.56 },
    { value: 1, probability: 0.22 },
    { value: 2, probability: 0.01 },
    { value: 3, probability: 0.04 },
    { value: 5, probability: 0.07 },
    { value: 6, probability: 0.11 }
  ],
  5: [
    { value: 0, probability: 0.06 },
    { value: 1, probability: 0.44 },
    { value: 2, probability: 0.0 },
    { value: 3, probability: 0.06 },
    { value: 4, probability: 0.11 },
    { value: 6, probability: 0.33 }
  ],
  6: [
    { value: 0, probability: 0.8 },
    { value: 1, probability: 0.0 },
    { value: 2, probability: 0.0 },
    { value: 3, probability: 0.03 },
    { value: 4, probability: 0.0 },
    { value: 5, probability: 0.0 }
  ]
});
chordProgressions.value = 0;

async function play(noteSequence) {
    if (rnnPlayer.isPlaying()) {
        rnnPlayer.stop();
        return;
    }
    // The model expects a quantized sequence, and ours was unquantized:
    const qns = mm.sequences.quantizeNoteSequence(noteSequence, 2);
    console.log('get rnn steps',noteSequence.notes.length * 2)
    music_rnn
        .continueSequence(qns, noteSequence.notes.length * 4, rnn_temperature, ['C4'])
        .then((sample) => {
            for (var note of sample.notes) {
                console.log(note)
                notes.push(note)
                playNext(note)
            }
            console.log(sample)
            rnnPlayer.start(sample)
        });
}

NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C4"]
async function updateMelody(melody) {
    var notes = []
    for (var i = 0; i < melody.length; i++) {
        melody[i].forEach(n => notes.push({pitch: Tonal.midi(NOTES[n]), startTime:i/2, endTime:(i/2)+0.5}))
    }
    if (notes.length == 0) { console.log("empty melody"); return; }
    console.log('notes',notes)
    var noteSequence = {notes: notes, totalTime: melody.length/2}
    // play(noteSequence)
    return noteSequence
}

globals = {playTouchSound: playTouchSound,
           updateMelody: updateMelody}

notes = []
function playNext(time) {
    synth.triggerAttackRelease(notes.shift(), '16n')
}

let bufferLoadPromise = new Promise(res => Tone.Buffer.on('load', res));
Promise.all([music_rnn.initialize(), bufferLoadPromise]).then(() => {
    document.querySelector('#loading').remove();
    // generateNext(Tone.now());
    Tone.Transport.scheduleRepeat(playNext, '16n', '8n');
    Tone.Transport.start();
});


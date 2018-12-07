// ------------------- tone ----------------

var distortion = new Tone.Distortion(0.8)
var tremolo = new Tone.Tremolo().start()

var reverb = new Tone.Convolver(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/hm2_000_ortf_48k.mp3'
)
reverb.wet = 0.4;

//create a synth and connect it to the effects and master output (your speakers)
var synth = new Tone.Synth().chain(distortion, tremolo, reverb, Tone.Master)

async function playTouchSound() {
    synth.triggerAttackRelease("D3", '16n')
}

// Tone.Transport.scheduleRepeat(play, '2n');
Tone.Transport.start();

// *******
// MAGENTA
// *******

// Initialize the model.
music_rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
music_rnn.initialize();

// Create a player to play the sequence we'll get from the model.
rnnPlayer = new mm.SoundFontPlayer("https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus");
rnn_steps = 20;
rnn_temperature = 1.1;

async function play(noteSequence) {
    if (rnnPlayer.isPlaying()) {
        rnnPlayer.stop();
        return;
    }
    // The model expects a quantized sequence, and ours was unquantized:
    const qns = mm.sequences.quantizeNoteSequence(noteSequence, 2);
    console.log('get rnn steps',noteSequence.notes.length * 2)
    music_rnn
        .continueSequence(qns, noteSequence.notes.length * 4, rnn_temperature)
        .then((sample) => {rnnPlayer.start(sample)});
}

NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C4"]
async function updateMelody(melody) {
    var notes = []
    if (melody.length == 0) { console.log("empty melody"); return; }
    for (var i = 0; i < melody.length; i++) {
        console.log("HELLO")
        console.log("translate melody", melody[i])
        melody[i].forEach(n => notes.push({pitch: Tonal.midi(NOTES[n]), startTime:i/2, endTime:(i/2)+0.5}))
    }
    console.log('notes',notes)
    noteSequence = {notes: notes, totalTime: melody.length/2}
    play(noteSequence)
    // console.log(noteSequence)
    return noteSequence
}

globals = {playTouchSound: playTouchSound,
           updateMelody: updateMelody}

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

var transitions = []

var note_ind = 0
// function play(time) {
//     if (transitions.length > 0) {
//         console.log(transitions)
//         window.globals.getBall(note_ind).path.fillColor = window.globals.getBall(note_ind).instrument.color
//         note_ind = biasedChoice(transitions[note_ind])

//         var note = window.globals.getBall(note_ind).instrument.note
//         console.log('play', note)

//         //play a note for the duration of an 8th note
//         synth.triggerAttackRelease(note, '16n', time)
//         globals.getBall(note_ind).path.fillColor = "black"
//     }
// }

async function playTouchSound() {
    synth.triggerAttackRelease("E5", '16n')
}

// Tone.Transport.scheduleRepeat(play, '2n');
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


// MAGENTA
TWINKLE_TWINKLE = {
    notes: [
        {pitch: 60, startTime: 0.0, endTime: 0.5},
        {pitch: 60, startTime: 0.5, endTime: 1.0},
        {pitch: 67, startTime: 1.0, endTime: 1.5},
        {pitch: 67, startTime: 1.5, endTime: 2.0},
        {pitch: 69, startTime: 2.0, endTime: 2.5},
        {pitch: 69, startTime: 2.5, endTime: 3.0},
        {pitch: 67, startTime: 3.0, endTime: 4.0},
        {pitch: 65, startTime: 4.0, endTime: 4.5},
        {pitch: 65, startTime: 4.5, endTime: 5.0},
        {pitch: 64, startTime: 5.0, endTime: 5.5},
        {pitch: 64, startTime: 5.5, endTime: 6.0},
        {pitch: 62, startTime: 6.0, endTime: 6.5},
        {pitch: 62, startTime: 6.5, endTime: 7.0},
        {pitch: 60, startTime: 7.0, endTime: 8.0},
    ],
    totalTime: 8
};

function queueNote(note) {
    return {notes: [{pitch: Tonal.midi(note), startTime:0.0, endTime:0.5}], totalTime: 0.5}
}

// Initialize the model.
music_rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
music_rnn.initialize();

// Create a player to play the sequence we'll get from the model.
rnnPlayer = new mm.Player();
rnn_steps = 10
rnn_temperature = 2

async function play(note) {
    if (rnnPlayer.isPlaying()) {
        rnnPlayer.stop();
        return;
    }
    var note_seq = queueNote(note)
    // The model expects a quantized sequence, and ours was unquantized:
    const qns = mm.sequences.quantizeNoteSequence(note_seq, 4);
    music_rnn
        .continueSequence(qns, rnn_steps, rnn_temperature)
        .then((sample) => rnnPlayer.start(sample));
}

// var model_checkpoint = 'https://storage.googleapis.com/download.magenta.tensorflow.org/models/music_vae/dljs/mel_small';
// model_checkpoint = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_16bar_small_q2'
// var music_vae = new mm.MusicVAE(model_checkpoint);
// music_vae.initialize()
//     .then(function(model) {
//         console.log('initialized!');
//     });

// var vaePlayer = new mm.Player();
// async function play(note) {
//     var z = tf.ones([1,256])
//     var temperature = 2
//     // var chordProgression = TWINKLE_TWINKLE
//     // var stepsPerQuarter = 2

//     var melody = music_vae
//         .decode(z, temperature)
//         .then((sample) => vaePlayer.start(sample));
// }

globals = {play: play,
           playTouchSound: playTouchSound,
           queue_note: queueNote}

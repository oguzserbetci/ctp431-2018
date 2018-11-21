window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var filter_on = false;
var distortion_on = false;
var distortion_amount = 100;
var filter_freq = 1000;
var filter_q = 1;


// select a preset
window.onload = function() {

    window.addEventListener('keydown', function(key) {
        keyboardDown(key);
    });

    // launch MIDI 	
    if (navigator.requestMIDIAccess)
        navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
    else
        alert("No MIDI support present in your browser.  You're gonna have a bad time.")

}

function MySynth(context, highpass_freq, attacktime, decaytime, sustain, releasetime) {
    this.context = context;

    this.highpass_frequency = highpass_freq;

    this.amp_gain = 1.0;
    this.attacktime = attacktime;
    this.decaytime = decaytime;
    this.sustain = sustain;
    this.releasetime = releasetime;
};

// generate a wavetable for white noise 
MySynth.prototype.noiseBuffer = function() {
    var bufferSize = this.context.sampleRate;
    var buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    var output = buffer.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    return buffer;
};

// helper
function connect(context, nodes) {
    nodes.push(context.destination);
    for (var i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i+1]);
    }
}

function filterNode(context, type, freq, q) {
    var filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    return filter;
}

function gainNode(context, val) {
    var gain = context.createGain();
    gain.gain.value = val;
    return gain;
}

function distortionNode(context, ammount) {
    var distortion = context.createWaveShaper();

    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for ( ; i < n_samples; ++i ) {
        x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    distortion.curve = curve;
    distortion.oversample = '4x';

    return distortion;
}

MySynth.prototype.setup = function() {
    var osc1 = [];
    // oscillator
    this.osc1 = this.context.createOscillator();
    this.osc1.type = "triangle";
    osc1.push(this.osc1);
    if (filter_on) {
        var osc1_filter = filterNode(this.context, "highpass", filter_freq, filter_q);
        osc1.push(osc1_filter);
    }
    if (distortion_on) {
        console.log('DISTORTION')
        var osc1_distortion = distortionNode(this.context, distortion_amount);
        osc1.push(osc1_distortion);
    }
    this.osc1Envelope = gainNode(this.context, 0.5);
    osc1.push(this.osc1Envelope);
    connect(this.context, osc1);
    console.log(osc1);

    var osc2 = [];
    this.osc2 = this.context.createOscillator();
    this.osc2.type = "square";
    if (filter_on) {
        var osc2_filter = filterNode(this.context, "lowpass", filter_freq, filter_q);
        osc2.push(osc1_filter);
    }
    if (distortion_on) {
        console.log('DISTORTION');
        var osc2_distortion = distortionNode(this.context, distortion_amount);
        osc2.push(osc2_distortion);
    }
    this.osc2Envelope = gainNode(this.context, 0.5);
    osc2.push(this.osc2Envelope);
    connect(this.context, osc2);

    // white noise
    var array = [];
    this.noise = this.context.createBufferSource();
    this.noise.buffer = this.noiseBuffer();
    array.push(this.noise);
    if (distortion_on) {
        console.log('DISTORTION');
        var distortion = distortionNode(this.context, distortion_amount);
        array.push(distortion);
    }
    this.noiseEnvelope = gainNode(this.context, 1.0);
    array.push(this.noiseEnvelope);
    // highpass filter
    var noiseFilter = filterNode(this.context, "highpass", this.highpass_frequency, 1);
    array.push(noiseFilter);
    connect(this.context, array);
};

MySynth.prototype.trigger = function(time) {
    this.setup();

    this.osc1.frequency.exponentialRampToValueAtTime(500, time + this.attacktime + this.decaytime);
    this.osc2.frequency.exponentialRampToValueAtTime(500, time + this.attacktime + this.decaytime);

    this.osc1Envelope.gain.setValueAtTime(0.01, time);
    this.osc1Envelope.gain.linearRampToValueAtTime(this.amp_gain/3.0, time + this.attacktime);
    this.osc1Envelope.gain.exponentialRampToValueAtTime(this.sustain, time + this.attacktime + this.decaytime);
    this.osc1Envelope.gain.exponentialRampToValueAtTime(0.01, time + this.attacktime + this.decaytime + this.releasetime);
    this.osc1.start(time);
    this.osc1.stop(time + this.attacktime + this.decaytime);


    this.osc2Envelope.gain.setValueAtTime(0.01, time);
    this.osc2Envelope.gain.linearRampToValueAtTime(this.amp_gain/3.0, time + this.attacktime);
    this.osc2Envelope.gain.exponentialRampToValueAtTime(this.sustain, time + this.attacktime + this.decaytime);
    this.osc2Envelope.gain.exponentialRampToValueAtTime(0.01, time + this.attacktime + this.decaytime + this.releasetime);
    this.osc2.start(time);
    this.osc2.stop(time + this.attacktime + this.decaytime);

    this.noiseEnvelope.gain.setValueAtTime(this.amp_gain/5.0, time);
    this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.attacktime + this.decaytime);

    this.noise.start(time);
    this.noise.stop(time + this.attacktime + this.decaytime);
};

function play_mysynth() {
    var mysynth = new MySynth(context, 1000, 0.1, 0.1, 0.3, 0.1);
    var now = context.currentTime;
    mysynth.trigger(now);
}

function set_distortion(q) {
    distortion = q;
}

function TR808Tone1(context, osc_frequency, osc_sweep, amp_gain, amp_decaytime) {
    this.context = context;
    this.osc_frequency = osc_frequency;
    this.osc_sweep = osc_sweep;
    this.amp_gain = amp_gain;
    this.amp_decaytime = amp_decaytime;

    this.amp_attack_time = 0.0;
    //		this.decay = 0.7;
};

// create and connect
TR808Tone1.prototype.setup = function() {

    var array = [];

    // oscillator	
    this.osc = this.context.createOscillator();
    array.push(this.osc);

    // connect
    if (filter_on) {
        var filter = filterNode(this.context, "lowpass", filter_freq, filter_q);
        array.push(filter);
    }
    console.log("TR1")
    if (distortion_on) {
        console.log("DISTORTION")
        var distortion = distortionNode(this.context, distortion_amount);
        array.push(distortion);
    }
    // envelope
    this.gain = this.context.createGain();
    array.push(this.gain);

    connect(this.context, array);
};


// control
TR808Tone1.prototype.trigger = function(time) {
    this.setup();

    // frequency sweeping
    this.osc.frequency.setValueAtTime(this.osc_frequency, time);
    if (this.osc_sweep == 'linear') {
        this.osc.frequency.linearRampToValueAtTime(1, time + this.amp_attack_time + this.amp_decaytime);
    } else if (this.osc_sweep == 'exp') {
        this.osc.frequency.exponentialRampToValueAtTime(1, time + this.amp_attack_time + this.amp_decaytime);
    }

    // amp envelope
    this.gain.gain.setValueAtTime(0, time);
    this.gain.gain.linearRampToValueAtTime(this.amp_gain, time + this.amp_attack_time);
    this.gain.gain.exponentialRampToValueAtTime(0.01, time + this.amp_attack_time + this.amp_decaytime);

    this.osc.start(time);

    this.osc.stop(time + this.amp_attack_time + this.amp_decaytime);
};

function TR808Tone2(context, highpass_freq, amp_gain, amp_decaytime) {
    this.context = context;

    this.highpass_frequency = highpass_freq;

    this.amp_decaytime = amp_decaytime;
    this.amp_gain = amp_gain;
    this.amp_attack_time = 0.0;
    //		this.decay = 0.7;		
};

// generate a wavetable for white noise 
TR808Tone2.prototype.noiseBuffer = function() {
    var bufferSize = this.context.sampleRate;
    var buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    var output = buffer.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    return buffer;
};

TR808Tone2.prototype.setup = function() {

    var array = [];

    // white noise
    this.noise = this.context.createBufferSource();
    this.noise.buffer = this.noiseBuffer();
    array.push(this.noise);

    // highpass filter 
    var noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = this.highpass_frequency;
    noiseFilter.Q.value = 1;
    array.push(noiseFilter);


    console.log("TR2")
    if (filter_on) {
        var filter = filterNode(this.context, "lowpass", filter_freq, filter_q);
        array.push(filter);
    }
    if (distortion_on) {
        console.log("DISTORTION")
        var distortion = distortionNode(this.context, distortion_amount);
        array.push(distortion);
    }

    // amp envelop
    this.noiseEnvelope = this.context.createGain();
    array.push(this.noiseEnvelope);

    connect(this.context, array);
};

TR808Tone2.prototype.trigger = function(time) {
    this.setup();

    this.noiseEnvelope.gain.setValueAtTime(this.amp_gain, time);
    this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + this.amp_decaytime);
    this.noise.start(time);
    this.noise.stop(time + this.amp_decaytime);
};

function set_filter_onoff(status) {
    filter_on = status;
}

function set_filter_freq(freq) {
    filter_freq = freq;
}

function set_filter_q(q) {
    filter_q = q;
}

function set_distortion(q) {
    distortion_on = q;
}

function keyboardDown(key) {

    console.log(key.keyCode);

    switch (key.keyCode) {
        case 76: // 'l'
            play_kick();
            break;
        case 80: //'p'
            play_snare();
            break;
        case 81: //'q'
            play_close_hihat();
            break;
        case 87: //'w'
            play_open_hihat();
            break;
        case 65: //'a'
            play_lowtom();
            break;
        case 83: //'s'
            play_midtom();
            break;
        case 68: //'d'
            play_hightom();
            break;
    }
}

function play_kick() {
    var kick = new TR808Tone1(context, 150, 'exp', 2, 0.6);
    var now = context.currentTime;

    kick.trigger(now);
}

function play_lowtom() {
    var low_tom = new TR808Tone1(context, 200, 'linear', 1, 0.3);
    var now = context.currentTime;

    low_tom.trigger(now);
}


function play_midtom() {
    var mid_tom = new TR808Tone1(context, 300, 'linear', 1, 0.3);
    var now = context.currentTime;

    mid_tom.trigger(now);
}

function play_hightom() {
    var high_tom = new TR808Tone1(context, 400, 'linear', 1, 0.3);
    var now = context.currentTime;

    high_tom.trigger(now);
}

function play_snare() {
    var snare = new TR808Tone2(context, 500, 0.5, 0.2);
    var now = context.currentTime;

    snare.trigger(now);
}

function play_open_hihat() {
    var snare = new TR808Tone2(context, 1000, 0.1, 0.4);
    var now = context.currentTime;

    snare.trigger(now);
}

function play_close_hihat() {
    var snare = new TR808Tone2(context, 2000, 0.5, 0.05);
    var now = context.currentTime;

    snare.trigger(now);
}

function play_rhythm() {
    var kick = new TR808Tone1(context, 150, 'exp', 2, 0.6);
    var snare = new TR808Tone2(context, 500, 0.5, 0.2);

    var now = context.currentTime;

    for (var i = 0; i < 1; i++) {
        kick.trigger(now + i * 4);
        snare.trigger(now + 0.5 + i * 4);
        kick.trigger(now + 1.25 + i * 4);
        snare.trigger(now + 1.5 + i * 4);

        kick.trigger(now + 2.0 + i * 4);
        snare.trigger(now + 2.5 + i * 4);
        kick.trigger(now + 3.0 + i * 4);
        kick.trigger(now + 3.0 + 1 / 4 + 1 / 8 + i * 4);
        kick.trigger(now + 3.25 + i * 4);
        snare.trigger(now + 3.5 + i * 4);
    }
}


function onMIDIInit(midi) {
    midiAccess = midi;

    var haveAtLeastOneDevice = false;
    var inputs = midiAccess.inputs.values();

    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        input.value.onmidimessage = MIDIMessageEventHandler;
        haveAtLeastOneDevice = true;
    }

    if (!haveAtLeastOneDevice)
        console.log("No MIDI input devices present.  You're gonna have a bad time.");
}


function onMIDIReject(err) {
    console.log("The MIDI system failed to start.  You're gonna have a bad time.");
}


function MIDIMessageEventHandler(event) {
    // Mask off the lower nibble (MIDI channel, which we don't care about)
    switch (event.data[0] & 0xf0) {
        case 0x90:
            if (event.data[2] != 0) // if velocity != 0, this is a note-on message
                //synth.noteOn(event.data[1], event.data[2]);	
                console.log(event.data[1])
            console.log(event.data[2])

            switch (event.data[1]) {
                case 44: // 'l'
                    play_kick();
                    break;
                case 45: //'p'
                    play_snare();
                    break;
                case 46: //'q'
                    play_close_hihat();
                    break;
                case 47: //'w'
                    play_open_hihat();
                    break;
                case 48: //'a'
                    play_lowtom();
                    break;
                case 49: //'s'
                    play_midtom();
                    break;
                case 50: //'d'
                    play_hightom();
                    break;
            }

            return;

            // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
        case 0x80:
            //synth.noteOff(event.data[1], event.data[2]);
            return;
    }
}

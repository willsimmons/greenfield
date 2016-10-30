// // Bind our analyser to the media element source.
// audioSrc.connect(analyser);
// audioSrc.connect(audioCtx.destination);

let myDebug = require('debug');
myDebug.enable('Visualizer:*');
const log = myDebug('Visualizer:log');
const info = myDebug('Visualizer:info');
const error = myDebug('Visualizer:error');

let audioContext, canvas, canvasWidth, canvasHeight, analyserContext, analyserNode, numBars, audioSrc;

let SPACING = 3;
let BAR_WIDTH = 1;

const updateAnalysers = time => {

  let freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

  analyserNode.getByteFrequencyData(freqByteData);

  analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
  analyserContext.fillStyle = '#F6D565';
  analyserContext.lineCap = 'round';
  let multiplier = analyserNode.frequencyBinCount / numBars;

  // Draw rectangle for each frequency bin.
  for (let i = 0; i < numBars; ++i) {
    let magnitude = 0;
    let offset = Math.floor(i * multiplier);
    // gotta sum/average the block, or we miss narrow-bandwidth spikes
    for (let j = 0; j < multiplier; j++) {
      magnitude += freqByteData[offset + j];
    }
    magnitude = magnitude / multiplier;
    let magnitude2 = freqByteData[i * multiplier];
    analyserContext.fillStyle = `hsl( ${ Math.round((i * 360) / numBars) }, 100%, 50%)`;
    analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
  }

  let rafId = window.requestAnimationFrame( updateAnalysers );
};

const gotStream = (stream, audioElement) => {
  let inputPoint = audioContext.createGain();

  // Create an AudioNode from the stream.
  let realAudioInput;
  if (audioElement) {
    realAudioInput = audioContext.createMediaElementSource(audioElement);
  } else {
    realAudioInput = audioContext.createMediaStreamSource(stream);
  }
  realAudioInput.connect(inputPoint);

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  inputPoint.connect(analyserNode);

  let zeroGain = audioContext.createGain();
  zeroGain.gain.value = 0.0;
  inputPoint.connect(zeroGain);
  zeroGain.connect(audioContext.destination);
  updateAnalysers();
};

let visualizer = {

  initAudio: audioElement => {
    if (!navigator.getUserMedia) {
      navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }
    if (!navigator.cancelAnimationFrame) {
      navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    }
    if (!navigator.requestAnimationFrame) {
      navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
    }
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContext();

    canvas = document.getElementById('analyser');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    analyserContext = canvas.getContext('2d');
    numBars = Math.round(canvasWidth / SPACING);

    if (audioElement) {
      gotStream(null, audioElement);
    } else {
      navigator.getUserMedia({
        'audio': {
          'mandatory': {
            'googEchoCancellation': 'false',
            'googAutoGainControl': 'false',
            'googNoiseSuppression': 'false',
            'googHighpassFilter': 'false'
          },
          'optional': []
        },
      }, gotStream, e => {
        console.log(e);
      });
    }
  }

};

export default visualizer;

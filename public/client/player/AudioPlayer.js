let myDebug = require('debug');
myDebug.enable('AudioPlayer:*');
const log = myDebug('AudioPlayer:log');
const info = myDebug('AudioPlayer:info');
const error = myDebug('AudioPlayer:error');

let audioPlayer = {
  set: (v, val) => { audioPlayer[v] = val; },
  get: v => audioPlayer[v],

  kmsWsUri: 'wss://138.197.196.39:8433/kurento', // Kurento secure websocket

  IDLE: 0,
  DISABLED: 1,
  PLAYING: 2,
  STOPPING: 3,
  state: 0, // start idle

  webRtcPeer: null,
  client: null,
  pipeline: null,
  fileUri: null,
  audioOutput: null,

  statusUpdate: null,

  init: statusUpdate => {
    audioPlayer.statusUpdate = statusUpdate;
    audioPlayer.webRtcPeer = null;
    audioPlayer.client = null;
    audioPlayer.pipeline = null;
    audioPlayer.setStatus(audioPlayer.IDLE);
  },

  start: (fileUri, audioOutput) => {
    audioPlayer.fileUri = fileUri;
    audioPlayer.audioOutput = audioOutput;

    audioPlayer.setStatus(audioPlayer.DISABLED);

    let options = {
      remoteVideo: audioPlayer.audioOutput,
      mediaConstraints: { audio: true, video: false } // audio only
    };

    audioPlayer.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, error => {
      if (error) { return audioPlayer.onError(error); }
      audioPlayer.webRtcPeer.generateOffer(audioPlayer.onPlayOffer);
    });
  },

  stop: () => {
    audioPlayer.setStatus(audioPlayer.STOPPING);

    if (audioPlayer.webRtcPeer) {
      audioPlayer.webRtcPeer.dispose();
      audioPlayer.webRtcPeer = null;
    }

    if (audioPlayer.pipeline) {
      audioPlayer.pipeline.release();
      audioPlayer.pipeline = null;
    }

    audioPlayer.audioOutput.src = '';

    audioPlayer.setStatus(audioPlayer.IDLE);
  },

  setStatus: nextState => {
    if (nextState === audioPlayer.IDLE) {
    } else if (nextState === audioPlayer.PLAYING) {
    } else if (nextState === audioPlayer.DISABLED) {
    }

    // set state and call update function
    audioPlayer.state = nextState;
    audioPlayer.statusUpdate(audioPlayer.state === audioPlayer.IDLE ? 'IDLE' :
                             audioPlayer.state === audioPlayer.PLAYING ? 'PLAYING' :
                             audioPlayer.state === audioPlayer.STOPPING ? 'STOPPING' : 'DISABLED');
  },

  setIceCandidateCallbacks: (webRtcPeer, webRtcEp, onerror) => {
    webRtcPeer.on('icecandidate', candidate => {
      log('Local candidate:', candidate);
      candidate = kurentoClient.getComplexType('IceCandidate')(candidate);
      webRtcEp.addIceCandidate(candidate, onerror);
    });

    webRtcEp.on('OnIceCandidate', event => {
      var candidate = event.candidate;
      log('Remote candidate:', candidate);
      webRtcPeer.addIceCandidate(candidate, onerror);
    });
  },

  onPlayOffer: (error, sdpOffer) => {
    if (error) { return audioPlayer.onError(error); }

    co(function *() {
      try {
        if (!audioPlayer.client) { audioPlayer.client = yield kurentoClient(audioPlayer.kmsWsUri); }

        // create media pipeline
        audioPlayer.pipeline = yield audioPlayer.client.create('MediaPipeline');

        // create webrtc endpoint
        var webRtc = yield audioPlayer.pipeline.create('WebRtcEndpoint');
        audioPlayer.setIceCandidateCallbacks(audioPlayer.webRtcPeer, webRtc, audioPlayer.onError);

        // create player pointing to our recording url
        var player = yield audioPlayer.pipeline.create('PlayerEndpoint', {
          uri: audioPlayer.fileUri,
          mediaProfile: 'WEBM_AUDIO_ONLY' // audio only
        });

        // set event handler for end-of-stream
        player.on('EndOfStream', audioPlayer.stop);

        // connect
        yield player.connect(webRtc);

        var sdpAnswer = yield webRtc.processOffer(sdpOffer);
        webRtc.gatherCandidates(audioPlayer.onError);
        audioPlayer.webRtcPeer.processAnswer(sdpAnswer);

        // start playing
        yield player.play();

        audioPlayer.setStatus(audioPlayer.PLAYING);

      } catch (e) {
        audioPlayer.onError(e);
      }
    })();
  },

  onError: error => {
    if (error) {
      error(error);
      audioPlayer.stop();
    }
  }
};

export default audioPlayer;

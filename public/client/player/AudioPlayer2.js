let myDebug = require('debug');
//myDebug.enable('AudioPlayer:*');
const log = myDebug('AudioPlayer:log');
const info = myDebug('AudioPlayer:info');
const error = myDebug('AudioPlayer:error');

let audioPlayer = {
  set: (v, val) => { audioPlayer[v] = val; },
  get: v => audioPlayer[v],

  kmsWsUri: 'wss://radradio.stream:8433/kurento', // Kurento secure websocket URI
  ws: null, // secure websocket with server

  IDLE: 0,
  DISABLED: 1,
  PLAYING: 2,
  STOPPING: 3,
  state: 0, // start idle

  webRtcPeer: null,
  client: null,
  streamId: null,

  statusUpdate: null,
  audioNode: null,
  user: null,

  init: (statusUpdate, ws, processMessage) => {
    audioPlayer.statusUpdate = statusUpdate;
    audioPlayer.webRtcPeer = null;
    audioPlayer.client = null;
    audioPlayer.setStatus(audioPlayer.IDLE);
    audioPlayer.wsInit(ws, processMessage);
  },

  wsInit: (ws, processMessage) => {
    audioPlayer.ws = ws;

    // setup communication handler
    audioPlayer.ws.onmessage = message => {
      var parsedMessage = JSON.parse(message.data);
      info('Received message:', parsedMessage);

      if (parsedMessage.id === 'stopCommunication') {
        audioPlayer.stop(true);
      } else if (parsedMessage.id === 'iceCandidate') {
        audioPlayer.webRtcPeer.addIceCandidate(parsedMessage.candidate);
      //} else if (parsedMessage.id === 'broadcasterResponse') {
      //  audioPlayer.broadcasterResponse(parsedMessage);
      } else if (parsedMessage.id === 'listenerResponse') {
        audioPlayer.listenerResponse(parsedMessage);
      } else if (parsedMessage.id === 'livenow') {
        // FIXME: do something with this
        // send list of live broadcasters
      } else if (parsedMessage.id === 'audioInfo') {
        // FIXME: do something with this
        // send audio info (isSeekable, initSeekable, endSeekable, audioDuration)
      } else if (parsedMessage.id === 'position') {
        // FIXME: do something with this
        // response to a get position
      } else if (parsedMessage.id === 'seek') {
        // FIXME: do something with this
        // This happens on a seek failure.
      } else {
        error('Unrecognized message', parsedMessage);
      }

      // send message back to view for further processing
      processMessage && processMessage(parsedMessage);
    };
  },

  start: (streamId, audioNode, user) => {
    audioPlayer.setStatus(audioPlayer.DISABLED);
    audioPlayer.audioNode = audioNode;
    audioPlayer.streamId = streamId;
    audioPlayer.user = user;

    let options = {
      remoteVideo: audioPlayer.audioNode,
      mediaConstraints: { audio: true, video: false }, // audio only
      onicecandidate: audioPlayer.onIceCandidate
    };

    audioPlayer.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, error => {
      if (error) { return audioPlayer.onError(error); }
      audioPlayer.webRtcPeer.generateOffer(audioPlayer.onOfferListener);
    });
  },

  stop: noMessage => {
    audioPlayer.setStatus(audioPlayer.STOPPING);

    if (audioPlayer.webRtcPeer) {
      if (!noMessage) {
        let message = {
          id: 'stop'
        };
        audioPlayer.sendMessage(message);
      }
      audioPlayer.dispose();
    }

    audioPlayer.audioNode.src = '';
    audioPlayer.setStatus(audioPlayer.IDLE);
  },

  dispose: () => {
    if (audioPlayer.webRtcPeer) {
      audioPlayer.webRtcPeer.dispose();
      audioPlayer.webRtcPeer = null;
    }
  },

  setStatus: nextState => {
    // set state and call update function
    audioPlayer.state = nextState;
    audioPlayer.statusUpdate(audioPlayer.state === audioPlayer.IDLE ? 'IDLE' :
                             audioPlayer.state === audioPlayer.PLAYING ? 'PLAYING' :
                             audioPlayer.state === audioPlayer.STOPPING ? 'STOPPING' : 'DISABLED');
  },

  onOfferListener: (error, sdpOffer) => {
    if (error) { return audioPlayer.onError(error); }

    let message = {
      id: 'listener',
      sdpOffer: sdpOffer,
      streamId: audioPlayer.streamId // file url or broadcaster user id
    };
    audioPlayer.sendMessage(message);
  },

  onIceCandidate: candidate => {
    log('Local candidate', candidate);

    let message = {
      id: 'onIceCandidate',
      candidate: candidate
    };
    audioPlayer.sendMessage(message);
  },

  listenerResponse: message => {
    if (message.response !== 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknown error';
      warn(`Broadcast not accepted for the following reason: ${errorMsg}`);
      audioPlayer.stop(true);
    } else {
      info('SDP ANSWER', message.sdpAnswer);
      audioPlayer.webRtcPeer.processAnswer(message.sdpAnswer);
      audioPlayer.audioNode.muted = false; // unmute player on start
      audioPlayer.setStatus(audioPlayer.PLAYING); // we are recording!
    }
  },

  onError: err => {
    if (err) {
      error(err);
      audioPlayer.stop();
    }
  },

  sendMessage: message => {
    message.user = audioPlayer.user; // send user id to server
    let jsonMessage = JSON.stringify(message);
    log('Sending message:', message);
    audioPlayer.ws.send(jsonMessage);
  }

};

window.onbeforeunload = () => {
  audioPlayer.ws && audioPlayer.ws.close(); // close websocket on unload
};

export default audioPlayer;

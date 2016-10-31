let myDebug = require('debug');
//myDebug.enable('AudioRecorder:*');
const log = myDebug('AudioRecorder:log');
const info = myDebug('AudioRecorder:info');
const error = myDebug('AudioRecorder:error');

let audioRecorder = {
  set: (v, val) => { audioRecorder[v] = val; },
  get: v => audioRecorder[v],

  kmsWsUri: 'wss://radradio.stream:8433/kurento', // Kurento secure websocket URI
  ws: null, // secure websocket with server

  IDLE: 0,
  DISABLED: 1,
  RECORDING: 2,
  STOPPING: 3,
  state: 0, // start idle

  webRtcPeer: null,
  client: null,
  streamId: null,

  statusUpdate: null,
  audioNode: null,
  user: null,
  metadata: null,

  init: (statusUpdate, ws, processMessage) => {
    audioRecorder.statusUpdate = statusUpdate;
    audioRecorder.webRtcPeer = null;
    audioRecorder.client = null;
    audioRecorder.setStatus(audioRecorder.IDLE);
    audioRecorder.wsInit(ws, processMessage);
  },

  wsInit: (ws, processMessage) => {
    audioRecorder.ws = ws;

    // setup communication handler
    audioRecorder.ws.onmessage = message => {
      var parsedMessage = JSON.parse(message.data);
      info('Received message:', parsedMessage);

      if (parsedMessage.id === 'stopCommunication') {
        audioRecorder.stop(true);
      } else if (parsedMessage.id === 'iceCandidate') {
        info('Received remote candidate', parsedMessage.candidate);
        audioRecorder.webRtcPeer.addIceCandidate(parsedMessage.candidate);
      } else if (parsedMessage.id === 'broadcasterResponse') {
        audioRecorder.broadcasterResponse(parsedMessage);
      //} else if (parsedMessage.id === 'listenerResponse') {
        //audioRecorder.listenerResponse(parsedMessage);
      } else if (parsedMessage.id === 'livenow') {
        // FIXME: do something with this
      } else {
        error('Unrecognized message', parsedMessage);
      }

      // send message back to view for further processing
      //   the server will send the media repo id and url in the broadcasterResponse message if accepted
      processMessage && processMessage(parsedMessage);
    };
  },

  start: (streamId, audioNode, metadata) => {
    audioRecorder.setStatus(audioRecorder.DISABLED);
    audioRecorder.audioNode = audioNode;
    audioRecorder.streamId = streamId;
    audioRecorder.user = metadata.user;
    let m = {};
    m.title = metadata.title;
    m.subject = metadata.subject;
    m.description = metadata.description;
    m.id = metadata.id;
    audioRecorder.metadata = m;

    let options = {
      localVideo: audioRecorder.audioNode,
      mediaConstraints: { audio: true, video: false }, // audio only
      onicecandidate: audioRecorder.onIceCandidate
    };

    // FIXME: do we need WebRtcPeerSendrecv or only WebRtcPeerSendonly?
    //        do we need to add another player if we want to do a sound analyzer?
    audioRecorder.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, error => {
      if (error) { return audioRecorder.onError(error); }
      audioRecorder.webRtcPeer.generateOffer(audioRecorder.onOfferBroadcaster);
    });
  },

  stop: noMessage => {
    audioRecorder.setStatus(audioRecorder.STOPPING);

    if (audioRecorder.webRtcPeer) {
      if (!noMessage) {
        let message = {
          id: 'stop'
        };
        audioRecorder.sendMessage(message);
      }
      audioRecorder.dispose();
    }

    audioRecorder.audioNode.src = '';
    audioRecorder.setStatus(audioRecorder.IDLE);
  },

  dispose: () => {
    if (audioRecorder.webRtcPeer) {
      audioRecorder.webRtcPeer.dispose();
      audioRecorder.webRtcPeer = null;
    }
  },

  setStatus: nextState => {
    // set state and call update function
    audioRecorder.state = nextState;
    audioRecorder.statusUpdate(audioRecorder.state === audioRecorder.IDLE ? 'IDLE' :
                               audioRecorder.state === audioRecorder.RECORDING ? 'RECORDING' :
                               audioRecorder.state === audioRecorder.STOPPING ? 'STOPPING' : 'DISABLED');
  },

  onOfferBroadcaster: (error, sdpOffer) => {
    if (error) { return audioRecorder.onError(error); }

    let message = {
      id: 'broadcaster',
      sdpOffer: sdpOffer,
      streamId: audioRecorder.streamId, // sending recording file url to server
      user: audioRecorder.user,
      metadata: audioRecorder.metadata
    };
    audioRecorder.sendMessage(message);
  },

  onIceCandidate: candidate => {
    log('Local candidate', candidate);

    let message = {
      id: 'onIceCandidate',
      candidate: candidate
    };
    audioRecorder.sendMessage(message);
  },

  broadcasterResponse: message => {
    if (message.response !== 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknown error';
      warn(`Broadcast not accepted for the following reason: ${errorMsg}`);
      audioRecorder.stop(true);
    } else {
      log('Received broadcaster response');
      audioRecorder.webRtcPeer.processAnswer(message.sdpAnswer);
      audioRecorder.setStatus(audioRecorder.RECORDING); // we are recording!
    }
  },

  onError: err => {
    if (err) {
      error(err);
      audioRecorder.stop();
    }
  },

  sendMessage: message => {
    message.user = audioRecorder.user; // send user id to server
    let jsonMessage = JSON.stringify(message);
    log('Sending message:', message);
    audioRecorder.ws.send(jsonMessage);
  }

};

window.onbeforeunload = () => {
  audioRecorder.ws && audioRecorder.ws.close(); // close websocket on unload
};

export default audioRecorder;

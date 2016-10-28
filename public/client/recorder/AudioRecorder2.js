let audioRecorder = {
  set: (v, val) => { audioRecorder[v] = val; },
  get: v => audioRecorder[v],

  kmsWsUri: 'wss://138.197.196.39:8433/kurento', // Kurento secure websocket URI
  wsUri: 'wss://127.0.0.1:8443/audio', // secure websocket URI with server
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

  init: (statusUpdate, processMessage) => {
    audioRecorder.statusUpdate = statusUpdate;
    audioRecorder.webRtcPeer = null;
    audioRecorder.client = null;
    audioRecorder.setStatus(audioRecorder.IDLE);
    audioRecorder.wsInit(processMessage);
  },

  wsInit: processMessage => {
    // open websocket
    audioRecorder.ws = new WebSocket(audioRecorder.wsUri);

    // setup communication handler
    audioRecorder.ws.onmessage = message => {
      var parsedMessage = JSON.parse(message.data);
      console.info('Received message: ' + message.data);

      if (parsedMessage.id === 'stopCommunication') {
        audioRecorder.stop(true);
      } else if (parsedMessage.id === 'iceCandidate') {
        console.info('Received remote candidate', parsedMessage.candidate);
        audioRecorder.webRtcPeer.addIceCandidate(parsedMessage.candidate);
      } else if (parsedMessage.id === 'broadcasterResponse') {
        audioRecorder.broadcasterResponse(parsedMessage);
      //} else if (parsedMessage.id === 'listenerResponse') {
        //listenerResponse(parsedMessage);
      } else {
        console.error('Unrecognized message', parsedMessage);
      }

      // send message back to view for further processing
      //   the server will send the media repo id and url in the broadcasterResponse message if accepted
      processMessage && processMessage(parsedMessage);
    };
  },

  start: (streamId, audioNode, user) => {
    audioRecorder.setStatus(audioRecorder.DISABLED);
    audioRecorder.audioNode = audioNode;
    audioRecorder.streamId = streamId;
    audioRecorder.user = user;

    let options = {
      localVideo: audioRecorder.audioNode,
      mediaConstraints: { audio: true, video: false }, // audio only
      onicecandidate: audioRecorder.onIceCandidate
    };

    //audioRecorder.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
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
      streamId: audioRecorder.streamId // sending recording file url to server
    };
    audioRecorder.sendMessage(message);
  },

  onIceCandidate: candidate => {
    console.log('Local candidate', candidate);

    let message = {
      id: 'onIceCandidate',
      candidate: candidate
    };
    audioRecorder.sendMessage(message);
  },

  broadcasterResponse: message => {
    if (message.response !== 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknown error';
      console.warn(`Broadcast not accepted for the following reason: ${errorMsg}`);
      audioRecorder.stop(true);
    } else {
      console.log('Received broadcaster response');
      audioRecorder.webRtcPeer.processAnswer(message.sdpAnswer);
      audioRecorder.setStatus(audioRecorder.RECORDING); // we are recording!
    }
  },

  onError: error => {
    if (error) {
      console.error(error);
      audioRecorder.stop();
    }
  },

  sendMessage: message => {
    message.user = audioRecorder.user; // send user id to server
    let jsonMessage = JSON.stringify(message);
    console.log('Sending message:', message);
    audioRecorder.ws.send(jsonMessage);
  }

};

window.onbeforeunload = () => {
  audioRecorder.ws && audioRecorder.ws.close(); // close websocket on unload
};

export default audioRecorder;

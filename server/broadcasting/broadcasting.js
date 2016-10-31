'use strict';

const debug = require('debug');
//debug.enable('broadcasting:*');
const log = debug('broadcasting:log');
const info = debug('broadcasting:info');
const error = debug('broadcasting:error');

const ws = require('ws');
const co = require('co');
const kurentoClient = require('kurento-client');

// using secure websocket
//const kmsWsUri = 'ws://radradio.stream:8888/kurento'; // kurento client non-secure websocket
const kmsWsUri = 'wss://radradio.stream:8433/kurento'; // kurento client secure websocket
const wssPath = '/audio'; // secure server websocket pathname

let wss; // websocket server
let idCounter = 0;
let candidatesQueue = {};
let ktClient = {};

let sessionInfo = {}; // get session id from broadcast host user id
let broadcasterStream = {}; // hash of broadcaster streams per sessionId
let listenerStream = {}; // hash of listener streams per sessionId
let listeners = {}; // hash of listeners per host sessionId
let broadcasterUser = {}; // hash of broadcast hosts per sessionId
let listenerUser = {}; // hash of broadcast listeners per sessionId
let recording = {}; // hash of recording identifiers per sessionId (recording url for broadcaster)
let listening = {}; // hash of listening identifiers per sessionId (file url or broadcaster user id for listener)
let liveNow = {}; // hash of broadcasters who are live per session Id

const nextUniqueId = () => {
  idCounter++;
  return idCounter.toString();
};

const onError = (error, sessionId, callback) => {
  if (error) {
    stop(sessionId);
    if (callback) {
      return callback(error);
    }
  }
};

// tell client(s) who is live now
const liveNowUpdate = ws => {
  wss.clients.forEach(client => {
    if (ws && client !== ws) {
      return;
    }
    info('Sending livenow to client');
    client.send(JSON.stringify({
      id: 'livenow',
      broadcasts: Object.keys(liveNow).map(key => liveNow[key]) || []
    }));
  });
};

const startWss = server => {
  // websocket server setup (for client communications)
  wss = new ws.Server({
    server: server,
    path: wssPath
  });
  info('secure websocket server enabled');

  // Management of WebSocket messages
  wss.on('connection', ws => {
    let sessionId = nextUniqueId();
    log('Connection received for session ' + sessionId);

    ws.on('error', error => {
      log('Connection for session ' + sessionId + ' error');
      stop(sessionId);
    });

    ws.on('close', () => {
      log('Connection for session ' + sessionId + ' closed');
      stop(sessionId);
    });

    // tell listener about broadcasters who are live
    liveNowUpdate(ws);

    ws.on('message', unparsedMessage => {
      let message = JSON.parse(unparsedMessage);
      log('Connection for session ' + sessionId + ' received message ', message);

      if (message.id === 'broadcaster') {
        broadcasterUser[sessionId] = message.user; // save broadcaster host
        recording[sessionId] = message.streamId; // recording file url

        startBroadcaster(sessionId, ws, message.sdpOffer, (error, sdpAnswer) => {
          if (error) {
            onError(error, sessionId);
            return ws.send(JSON.stringify({
              id: 'broadcasterResponse',
              response: 'rejected',
              message: error
            }));
          }

          log('Sending broadcaster response for session ' + sessionId);
          ws.send(JSON.stringify({
            id: 'broadcasterResponse',
            response: 'accepted',
            sdpAnswer: sdpAnswer
          }));

          liveNow[sessionId] = { user: broadcasterUser[sessionId], metadata: message.metadata };
          info('liveNow', liveNow[sessionId]);
          liveNowUpdate(); // update everyone on live broadcasters
        });

      } else if (message.id === 'listener') {
        listenerUser[sessionId] = message.user; // save listener user
        listening[sessionId] = message.streamId; // user id (live streaming) or file url (pre-recorded broadcast)

        if (!message.streamId.toString().match(/^http/)) {
          broadcasterUser[sessionId] = message.streamId; // set broadcast host
        }

        startListener(sessionId, ws, message.sdpOffer, (error, sdpAnswer) => {
          if (error) {
            return ws.send(JSON.stringify({
              id: 'listenerResponse',
              response: 'rejected',
              message: error
            }));
          }

          ws.send(JSON.stringify({
            id: 'listenerResponse',
            response: 'accepted',
            sdpAnswer: sdpAnswer
          }));
        });

      } else if (message.id === 'stop') {
        stop(sessionId);

      } else if (message.id === 'onIceCandidate') {
        onIceCandidate(sessionId, message.candidate);

      } else if (message.id === 'pause') {
        playerPause(sessionId);

      } else if (message.id === 'resume') {
        playerResume(sessionId);
        sendAudioInfo(sessionId);

      } else if (message.id === 'doSeek') {
        doSeek(sessionId, message.position);

      } else if (message.id === 'getPosition') {
        sendPosition(sessionId);

      } else {
        ws.send(JSON.stringify({
          id: 'error',
          message: `Invalid message ${message}`
        }));

      }
    });
  });
};

const startBroadcaster = (sessionId, ws, sdpOffer, callback) => {
  info('NEW BROADCASTER for session ' + sessionId);
  let host = broadcasterUser[sessionId];

  if (sessionInfo[host]) { // this means a host can only do one broadcasting at a time
    stop(sessionId);
    return callback('You are already acting as broadcaster in another session.');
  }
  sessionInfo[host] = sessionId;

  clearCandidatesQueue(sessionId);

  broadcasterStream[sessionId] = {
    id: sessionId,
    pipeline: null,
    webRtcEndpoint: null,
    recorderEndpoint: null
  };

  co(function *() {
    try {
      if (!ktClient[sessionId]) { ktClient[sessionId] = yield kurentoClient(kmsWsUri); }

      // create media pipeline
      let pipeline = yield ktClient[sessionId].create('MediaPipeline');
      broadcasterStream[sessionId].pipeline = pipeline;

      // create webrtc endpoint
      let webRtcEndpoint = yield pipeline.create('WebRtcEndpoint');
      broadcasterStream[sessionId].webRtcEndpoint = webRtcEndpoint;

      webRtcEndpoint.on('OnIceCandidate', event => {
        let candidate = kurentoClient.getComplexType('IceCandidate')(event.candidate);
        log('Sending ICE candidate for session ' + sessionId);
        ws.send(JSON.stringify({
          id: 'iceCandidate',
          candidate: candidate
        }));
      });

      if (candidatesQueue[sessionId]) {
        while (candidatesQueue[sessionId].length) {
          let candidate = candidatesQueue[sessionId].shift();
          log('Adding ICE candidate for session ' + sessionId);
          webRtcEndpoint.addIceCandidate(candidate);
        }
      }

      let sdpAnswer = yield webRtcEndpoint.processOffer(sdpOffer);
      webRtcEndpoint.gatherCandidates(error => onError(error, sessionId, callback));
      // send sdpAnswer back to client
      callback(null, sdpAnswer);

      // create recorder pointing to our recording url
      let recorderEndpoint = yield pipeline.create('RecorderEndpoint', {
        uri: recording[sessionId],
        mediaProfile: 'WEBM_AUDIO_ONLY' // audio only
      });
      broadcasterStream[sessionId].recorderEndpoint = recorderEndpoint;

      // connect
      yield webRtcEndpoint.connect(recorderEndpoint);
      yield webRtcEndpoint.connect(webRtcEndpoint);

      // start recorder
      yield recorderEndpoint.record();

    } catch (error) { onError(error, sessionId, callback); }
  });
};

const startListener = (sessionId, ws, sdpOffer, callback) => {
  info('NEW LISTENER for session ' + sessionId);
  let listener = listenerUser[sessionId];

  clearCandidatesQueue(sessionId);

  let fileUri, host, listenerErrorMessage;

  if (!broadcasterUser[sessionId]) { // pre-recorded broadcast

    fileUri = listening[sessionId];
    listenerStream[sessionId] = {
      id: sessionId,
      pipeline: null,
      webRtcEndpoint: null,
      playerEndpoint: null,
      ws: ws
    };

    listenerErrorMessage = `An error happened while trying to listen to ${fileUri} for session ${sessionId}`;
    info('Listening to pre-recorded broadcast: ', fileUri);

  } else { // live broadcast

    host = listening[sessionId];
    listenerStream[sessionId] = {
      id: sessionId,
      // no pipeline as we are using the broadcast host pipeline
      webRtcEndpoint: null,
      ws: ws
    };

    listenerErrorMessage = 'Not an active broadcaster at this time. Try again later...';
    info('Listening to host:', host);

  }

  co(function *() {
    try {
      let pipeline, broadcasterWebRtcEndpoint;

      if (fileUri) { // pre-recorded broadcast
        if (!ktClient[sessionId]) { ktClient[sessionId] = yield kurentoClient(kmsWsUri); }

        // create media pipeline
        listenerStream[sessionId].pipeline = yield ktClient[sessionId].create('MediaPipeline');
        pipeline = listenerStream[sessionId].pipeline;
      }

      if (host) { // live broadcast
        // get pipeline and connect endpoint from broadcast host
        let hostSessionId = sessionInfo[host];
        pipeline = broadcasterStream[hostSessionId].pipeline,
        broadcasterWebRtcEndpoint = broadcasterStream[hostSessionId].webRtcEndpoint;

        // keep track of host listeners (so that we can disconnect them when the host disconnects)
        if (!listeners[hostSessionId]) {
          listeners[hostSessionId] = {};
        }
        listeners[hostSessionId][sessionId] = true;
      }

      // create listener webRtc endpoint
      let webRtcEndpoint = yield pipeline.create('WebRtcEndpoint');
      listenerStream[sessionId].webRtcEndpoint = webRtcEndpoint;

      if (candidatesQueue[sessionId]) {
        while (candidatesQueue[sessionId].length) {
          let candidate = candidatesQueue[sessionId].shift();
          webRtcEndpoint.addIceCandidate(candidate);
        }
      }

      webRtcEndpoint.on('OnIceCandidate', event => {
        let candidate = kurentoClient.getComplexType('IceCandidate')(event.candidate);
        ws.send(JSON.stringify({
          id: 'iceCandidate',
          candidate: candidate
        }));
      });

      let sdpAnswer = yield webRtcEndpoint.processOffer(sdpOffer);
      webRtcEndpoint.gatherCandidates(error => onError(error, sessionId, callback));
      // send sdpAnswer back to client
      callback(null, sdpAnswer);

      if (fileUri) { // pre-recorded broadcast
        // create player endpoint
        let player = yield pipeline.create('PlayerEndpoint', {
          uri: fileUri,
          mediaProfile: 'WEBM_AUDIO_ONLY' // audio only
        });
        listenerStream.playerEndpoint = player;

        player.on('EndOfStream', event => {
          ws.send(JSON.stringify({
            id: 'stopCommunication'
          }));
          stop(sessionId);
        });

        yield player.connect(webRtcEndpoint);
        sendAudioInfo(sessionId);

        yield player.play(error => onError(error, sessionId, callback));
      }

      if (host) { // live broadcast
        // connect listener to broadcaster stream endpoint
        yield broadcasterWebRtcEndpoint.connect(webRtcEndpoint);
      }

    } catch (error) { onError(error, sessionId, callback); }
  });
};

const clearCandidatesQueue = sessionId => {
  if (candidatesQueue[sessionId]) {
    delete candidatesQueue[sessionId];
  }
};

const sendAudioInfo = sessionId => {
  let player = listenerStream[sessionId] ? listenerStream[sessionId].playerEndpoint : null;
  if (player) {
    let audioInfo = player.getVideoInfo();
    ws.send(JSON.stringify({
      id: 'audioInfo',
      isSeekable: audioInfo.getIsSeekable(),
      initSeekable: audioInfo.getSeekableInit(),
      endSeekable: audioInfo.getSeekableEnd(),
      audioDuration: audioInfo.getDuration()
    }));
  }
};

const sendPosition = sessionId => {
  let player = listenerStream[sessionId] ? listenerStream[sessionId].playerEndpoint : null;
  if (player) {
    let ws = listenerStream[sessionId].ws;
    ws.send(JSON.stringify({
      id: 'position',
      position: player.getPosition()
    }));
  }
};

const doSeek = (sessionId, position) => {
  let player = listenerStream[sessionId] ? listenerStream[sessionId].playerEndpoint : null;
  if (player) {
    try {
      player.setPosition(position);
    } catch (error) {
      let ws = listenerStream[sessionId].ws;
      ws.send(JSON.stringify({
        id: 'seek',
        message: 'Seek failed'
      }));
    }
  }
};

const playerPause = sessionId => {
  let player = listenerStream[sessionId] ? listenerStream[sessionId].playerEndpoint : null;
  if (player) {
    player.pause();
  }
};

const playerResume = sessionId => {
  let player = listenerStream[sessionId] ? listenerStream[sessionId].playerEndpoint : null;
  if (player) {
    player.play();
  }
};

const stop = sessionId => {
  info('STOP initiated for session ' + sessionId);
  let host = broadcasterUser[sessionId]; // get broadcast host (if any)

  let isHost, isPlayer;

  if (host && broadcasterStream[sessionId]) { // broadcast host
    isHost = true;
    liveNow[sessionId] = null;
    delete liveNow[sessionId];
    liveNowUpdate(); // update everyone on live broadcasters

    // host is stopping, send stop message to all listeners
    for (let sid in listeners[sessionId]) {
      let lstream = listenerStream[sid];
      if (lstream.ws) {
        info('Sending disconnect to listener on session ' + sid);
        lstream.ws.send(JSON.stringify({
          id: 'stopCommunication'
        }));
      }
    }

    // stop recorder
    log('Stopping recorder for session ' + sessionId);
    broadcasterStream[sessionId].recorderEndpoint && broadcasterStream[sessionId].recorderEndpoint.stop();
    recording[sessionId] = null;
    delete recording[sessionId];

    // release host broadcast media pipeline
    log('Releasing host media pipeline for session ' + sessionId);
    broadcasterStream[sessionId].pipeline && broadcasterStream[sessionId].pipeline.release();
    broadcasterStream[sessionId] = null;
    delete broadcasterStream[sessionId];
    listeners[sessionId] = {};

  } else if (host && listenerStream[sessionId]) { // live broadcast listener

    // release listener endpoint
    log('Releasing listener endpoint for session ' + sessionId);
    listenerStream[sessionId].webRtcEndpoint && listenerStream[sessionId].webRtcEndpoint.release();
    delete listenerStream[sessionId];

  } else if (!host && listenerStream[sessionId]) { // pre-recorded broadcast
    isPlayer = true;

    // release player pipeline
    log('Releasing player pipeline for session ' + sessionId);
    listenerStream[sessionId].pipeline && listenerStream[sessionId].pipeline.release();
    listenerStream[sessionId] = null;
    delete listenerStream[sessionId];

  }

  clearCandidatesQueue(sessionId);

  // player or host, we can close the media pipeline
  if (isPlayer || isHost) {
    log('Closing kurento client for session ' + sessionId);
    ktClient[sessionId] && ktClient[sessionId].close();
    ktClient[sessionId] = null;
    delete ktClient[sessionId];
  }

  if (!isPlayer) {
    broadcasterUser[sessionId] = null;
    delete broadcasterUser[sessionId];
    sessionInfo[host] = null;
    delete sessionInfo[host];
  }
  if (!isHost) {
    listenerUser[sessionId] = null;
    delete listenerUser[sessionId];
    listening[sessionId] = null;
    delete listening[sessionId];
  }
};

const onIceCandidate = (sessionId, _candidate) => {
  log('onIceCandidate: session ' + sessionId);
  let host = broadcasterUser[sessionId]; // get broadcaster host

  let candidate = kurentoClient.getComplexType('IceCandidate')(_candidate);

  if (host && broadcasterStream[sessionId] && broadcasterStream[sessionId].webRtcEndpoint) {
    info('Sending broadcaster ICE candidate for session ' + sessionId);
    broadcasterStream[sessionId].webRtcEndpoint.addIceCandidate(candidate);

  } else if (host && listenerStream[sessionId] && listenerStream[sessionId].webRtcEndpoint) {
    info('Sending listener ICE candidate for session ' + sessionId);
    listenerStream[sessionId].webRtcEndpoint.addIceCandidate(candidate);

  } else {
    info('Queueing ICE candidate for session ' + sessionId);
    if (!candidatesQueue[sessionId]) {
      candidatesQueue[sessionId] = [];
    }
    candidatesQueue[sessionId].push(candidate);
  }
};

module.exports = {
  startWss: startWss
};

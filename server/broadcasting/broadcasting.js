'use strict';

const debug = require('debug');
debug.enable('broadcasting:*');
const log = debug('broadcasting:log');
const info = debug('broadcasting:info');
const error = debug('broadcasting:error');

const fs = require('fs');
const debugLog = msg => fs.appendFileSync('debug.log', msg + '\n');
debugLog('start');
const ws = require('ws');
const co = require('co');
const kurentoClient = require('kurento-client');

const kmsWsUri = 'wss://138.197.196.39:8433/kurento'; // kurento client websocket

let idCounter = 0;
let candidatesQueue = {};
let ktClient = {};

let broadcasters = {}; // hash of broadcasters
let listeners = {}; // listeners[host] is a hash of listeners for host
let broadcasterUser = {}; // hash of broadcast hosts
let listenerUser = {}; // hash of broadcast listeners
let playerStream = {}; // hash of player streams (pre-recorded broadcasts)
let stream = {}; // hash of stream identifiers (recording url for broadcaster, file url or user id for listener)

const noBroadcasterMessage = 'Not an active broadcaster at this time. Try again later...';

const nextUniqueId = () => {
  idCounter++;
  return idCounter.toString();
};

const startWss = server => {
  // websocket server setup (for client communications)
  info('secure websocket for client communications starting');
  const wss = new ws.Server({
    server: server,
    path: '/audio'
  });

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

    ws.on('message', _message => {
      let message = JSON.parse(_message);
      log('Connection for session ' + sessionId + ' received message ', message);

      if (message.id === 'broadcaster') {
        broadcasterUser[sessionId] = message.user; // save broadcaster host
        stream[sessionId] = message.streamId; // recording file url

        startBroadcaster(sessionId, ws, message.sdpOffer, (error, sdpAnswer) => {
          if (error) {
            console.error(error);
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
        });

      } else if (message.id === 'listener') {
        listenerUser[sessionId] = message.user; // save listener user
        stream[sessionId] = message.streamId; // user id (live streaming) or file url (pre-recorded broadcast)

        if (!message.streamId.toString().match(/^http/)) {
          broadcasterUser[sessionId] = message.streamId;
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

      } else {
        ws.send(JSON.stringify({
          id: 'error',
          message: `Invalid message ${message}`
        }));

      }
    });
  });
};

// Recover kurentoClient for the first time
const getktClient = (sessionId, callback) => {
  if (ktClient[sessionId]) {
    return callback(null, ktClient[sessionId]);
  }

  info('HERE: calling kurento to get a client for session ' + sessionId);
  kurentoClient(kmsWsUri, (error, _ktClient) => {
    if (error) {
      log(`Could not find media server at address ${kmsWsUri}`);
      return callback(`Could not find media server at address ${kmsWsUri}. Exiting with error ${error}`);
    }

    info('NOW: got kurento client for session ' + sessionId);
    ktClient[sessionId] = _ktClient;
    callback(null, ktClient[sessionId]);
  });
};

const startBroadcaster = (sessionId, ws, sdpOffer, callback) => {
  let host = broadcasterUser[sessionId];

  clearCandidatesQueue(sessionId);

  if (broadcasters[host]) {
    stop(sessionId);
    return callback('You are already acting as broadcaster in another session.');
  }

  broadcasters[host] = {
    id: sessionId,
    pipeline: null,
    webRtcEndpoint: null,
    recorderEndpoint: null
  };

  co(function *() {
    try {
      if (!ktClient[sessionId]) { ktClient[sessionId] = yield kurentoClient(kmsWsUri); }

      console.log('Got client instance from kurento');

      // create media pipeline
      let pipeline = yield ktClient[sessionId].create('MediaPipeline');
      broadcasters[host].pipeline = pipeline;

      log('Media pipeline created for session ' + sessionId);

      // create webrtc endpoint
      let webRtcEndpoint = yield pipeline.create('WebRtcEndpoint');
      broadcasters[host].webRtcEndpoint = webRtcEndpoint;

      //setIceCandidateCallbacks(webRtcPeer, webRtc, audioRecorder.onError);
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

      webRtcEndpoint.gatherCandidates(error => {
        if (error) {
          stop(sessionId);
          return callback(error);
        }
      });

      // send sdpAnswer back to client
      callback(null, sdpAnswer);

      // create recorder pointing to our recording url
      let fileUri = stream[sessionId];
      let recorderEndpoint = yield pipeline.create('RecorderEndpoint', {
        uri: fileUri,
        mediaProfile: 'WEBM_AUDIO_ONLY' // audio only
      });
      broadcasters[host].recorderEndpoint = recorderEndpoint;

      // connect
      yield webRtc.connect(recorder);
      yield webRtc.connect(webRtc);

      // start recorder
      yield recorder.record();

    } catch (error) {

      if (error) {
        stop(sessionId);
        return callback(error);
      }

    }
  });
};

const startListener = (sessionId, ws, sdpOffer, callback) => {
  let streamId = stream[sessionId]; // get stream identifier

  clearCandidatesQueue(sessionId);

  let fileUri, listenerStream, host, listenerErrorMessage;
  if (streamId.toString().match(/^http/)) {
    // pre-recorded broadcast
    fileUri = streamId;
    listenerStream = {
      id: sessionId,
      pipeline: null,
      webRtcEndpoint: null
    };
    playerStream[sessionId] = listenerStream;
    listenerErrorMessage = `An error happened while trying to listen to ${fileUri} for session ${sessionId}`;
  } else {
    // live broadcast
    host = streamId;
    listenerStream = broadcasters[host];
    listenerErrorMessage = noBroadcasterMessage;
  }

  const createEndpoints = fileUri => {
    listenerStream.pipeline.create('WebRtcEndpoint', (error, webRtcEndpoint) => {
      if (error) {
        stop(sessionId);
        return callback(error);
      }

      if (host) {
        if (!listeners[host]) {
          listeners[host] = {};
        }
        listeners[host][sessionId] = {
          webRtcEndpoint: webRtcEndpoint,
          ws: ws
        };
      }

      if (!listenerStream) {
        stop(sessionId);
        return callback(listenerErrorMessage);
      }

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

      webRtcEndpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
        if (error) {
          stop(sessionId);
          return callback(error);
        }
        if (!listenerStream) {
          stop(sessionId);
          return callback(listenerErrorMessage);
        }

        listenerStream.webRtcEndpoint.connect(webRtcEndpoint, error => {
          if (error) {
            stop(sessionId);
            return callback(error);
          }
          if (!listenerStream) {
            stop(sessionId);
            return callback(listenerErrorMessage);
          }

          callback(null, sdpAnswer);
          webRtcEndpoint.gatherCandidates(error => {
            if (error) {
              stop(sessionId);
              return callback(error);
            }
          });
        });
      });

      if (fileUri) {
        // create player endpoint
        let options = { uri: fileUri, mediaProfile: 'WEBM_AUDIO_ONLY' };
        listenerStream.pipeline.create('PlayerEndpoint', options, (error, player) => {
          if (error) {
            stop(sessionId);
            return callback(error);
          }

          player.on('EndOfStream', event => {
            stop(sessionId);
            return callback(null, event);
          });

          player.connect(webRtc, error => {
            if (error) {
              stop(sessionId);
              return callback(error);
            }

            player.play(error => {
              if (error) {
                stop(sessionId);
                return callback(error);
              }

              log('Playing ' + fileUri + ' for ' + sessionId);
            });
          });
        });
      }

    });
  };

  // pre-recorded broadcast
  if (fileUri) {

    getKurentoClient(sessionId, (error, ktClient) => {
      if (error) {
        stop(sessionId);
        return callback(error);
      }

      ktClient.create('MediaPipeline', (error, pipeline) => {
        if (error) {
          stop(sessionId);
          return callback(error);
        }

        listenerStream.pipeline = pipeline;
        createEndpoints(fileUri);
      });
    });

  } else {

    if (!listenerStream) {
      stop(sessionId);
      return callback(listenerErrorMessage);
    }
    createEndpoints();

  }

};

const clearCandidatesQueue = sessionId => {
  if (candidatesQueue[sessionId]) {
    delete candidatesQueue[sessionId];
  }
};

const stop = sessionId => {
  let host = broadcasterUser[sessionId]; // get broadcast host
  let player = playerStream[sessionId]; // get listener player

  if (host && broadcasters[host] && broadcasters[host].id === sessionId) {
    // host is stopping, send stop to all listeners
    for (var i in listeners[host]) {
      var listener = listeners[host][i];
      if (listener.ws) {
        listener.ws.send(JSON.stringify({
          id: 'stopCommunication'
        }));
      }
    }
    // stop recorder
    log('Stopping recorder for session ' + sessionId);
    broadcasters[host].recorderEndpoint && broadcasters[host].recorderEndpoint.stop();
    // release host broadcast media pipeline
    log('Releasing host media pipeline for session ' + sessionId);
    broadcasters[host].pipeline && broadcasters[host].pipeline.release();
    broadcasters[host] = null;
    delete broadcasters[host];
    listeners[host] = {};

  } else if (host && listeners[host] && listeners[host][sessionId]) {
    // release listener endpoint
    log('Releasing listener endpoint for session' + sessionId);
    listeners[host][sessionId].webRtcEndpoint.release();
    delete listeners[host][sessionId];

  } else if (player) {
    // release player pipeline
    log('Releasing player endpoint for session ' + sessionId);
    player.pipeline && player.pipeline.release();
  }

  clearCandidatesQueue(sessionId);

  // no host because listening to pre-recorded broadcast
  // OR no more broadcater nor listeners, we can close the media pipeline
  if (!host || (Object.keys(listeners[host]).length < 1 && !broadcasters[host])) {
    log('Closing kurento client for session ' + sessionId);
    ktClient[sessionId] && ktClient[sessionId].close();
    ktClient[sessionId] = null;
  }

  // FIXME? we could delete broadcasterUser[sessionId] here or set it to null
  // but sessionIds should not get re-used
};

const onIceCandidate = (sessionId, _candidate) => {
  log('onIceCandidate: session ' + sessionId);
  let host = broadcasterUser[sessionId]; // get broadcaster host

  let candidate = kurentoClient.getComplexType('IceCandidate')(_candidate);

  if (host && broadcasters[host] && broadcasters[host].id === sessionId && broadcasters[host].webRtcEndpoint) {
    info('Sending broadcaster ICE candidate for session ' + sessionId);
    broadcasters[host].webRtcEndpoint.addIceCandidate(candidate);

  } else if (host && listeners[host] && listeners[host][sessionId] && listeners[host][sessionId].webRtcEndpoint) {
    info('Sending listener ICE candidate for session ' + sessionId);
    listeners[host][sessionId].webRtcEndpoint.addIceCandidate(candidate);

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

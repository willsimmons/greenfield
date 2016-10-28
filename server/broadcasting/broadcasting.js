'use strict';

const debug = require('debug');
debug.enable('broadcasting:*');
const log = debug('broadcasting:log');
const info = debug('broadcasting:info');
const error = debug('broadcasting:error');

const fs = require('fs');
const ws = require('ws');
const kurento = require('kurento-client');
const express = require('express');
const https = require('https');
const url = require('url');

const port = process.env.SSL_PORT || 8443; // secure server port
const wsUri = 'ws://127.0.0.1:8888/kurento'; // kurento client websocket

let idCounter = 0;
let candidatesQueue = {};
let kurentoClient = null;

let broadcasters = {}; // hash of broadcasters
let listeners = {}; // listeners[host] is a hash of listeners for host
let broadcasterUser = {}; // hash of broadcast hosts
let listenerUser = {}; // hash of broadcast listeners
let playerStream = {}; // hash of player streams (pre-recorded broadcasts)

const noBroadcasterMessage = 'Not an active broadcaster at this time. Try again later...';

// key/certificate for https server
const options = {
  key: fs.readFileSync(__dirname + '/../keys/server.key'),
  cert: fs.readFileSync(__dirname + '/../keys/server.crt')
};

const app = express();

// secure server setup
const server = https.createServer(options, app).listen(port, () => {
  info('secure server listening on port ' + port);
});

// websocket server setup (for client communications)
const wss = new ws.Server({
  server: server,
  path: '/audio'
});

const nextUniqueId = () => {
  idCounter++;
  return idCounter.toString();
};

// Management of WebSocket messages
wss.on('connection', ws => {
  let sessionId = nextUniqueId();
  log('Connection received with sessionId ' + sessionId);

  ws.on('error', error => {
    log('Connection ' + sessionId + ' error');
    stop(sessionId);
  });

  ws.on('close', () => {
    log('Connection ' + sessionId + ' closed');
    stop(sessionId);
  });

  ws.on('message', _message => {
    let message = JSON.parse(_message);
    log('Connection ' + sessionId + ' received message ', message);

    if (message.id === 'broadcaster') {
      broadcasterUser[sessionId] = message.user; // save broadcaster host
      stream[sessionId] = message.streamId;

      startBroadcaster(sessionId, ws, message.sdpOffer, (error, sdpAnswer) => {
        if (error) {
          return ws.send(JSON.stringify({
            id: 'broadcasterResponse',
            response: 'rejected',
            message: error
          }));
        }

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

// Recover kurentoClient for the first time
const getKurentoClient = callback => {
  if (kurentoClient !== null) {
    return callback(null, kurentoClient);
  }

  kurento(wsUri, (error, _kurentoClient) => {
    if (error) {
      log(`Could not find media server at address ${wsUri}`);
      return callback(`Could not find media server at address ${wsUri}. Exiting with error ${error}`);
    }

    kurentoClient = _kurentoClient;
    callback(null, kurentoClient);
  });
};

const startBroadcaster = (sessionId, ws, sdpOffer, callback) => {
  let host = broadcasterUser[sessionId];

  clearCandidatesQueue(sessionId);

  if (broadcasters[host] !== null) {
    stop(sessionId);
    return callback('You are already acting as broadcaster in another session.');
  }

  broadcasters[host] = {
    id: sessionId,
    pipeline: null,
    webRtcEndpoint: null
  };

  getKurentoClient((error, kurentoClient) => {
    if (error) {
      stop(sessionId);
      return callback(error);
    }

    if (broadcasters[host] === null) {
      stop(sessionId);
      return callback(noBroadcasterMessage);
    }

    kurentoClient.create('MediaPipeline', (error, pipeline) => {
      if (error) {
        stop(sessionId);
        return callback(error);
      }

      if (broadcasters[host] === null) {
        stop(sessionId);
        return callback(noBroadcasterMessage);
      }

      broadcasters[host].pipeline = pipeline;

      let fileUri = stream[sessionId];
      let elements = [
        { type: 'RecorderEndpoint', params: { uri: fileUri } },
        { type: 'WebRtcEndpoint', params: {} }
      ];

      // Add webrtc and recorder endpoints
      pipeline.create(elements, (error, elements) => {
        if (error) {
          stop(sessionId);
          return callback(error);
        }

        let recorderEndpoint = elements[0];
        let webRtcEndpoint = elements[1];

        if (broadcasters[host] === null) {
          stop(sessionId);
          return callback(nobroadcastersMessage);
        }

        broadcasters[host].recorderEndpoint = recorderEndpoint;
        broadcasters[host].webRtcEndpoint = webRtcEndpoint;

        if (candidatesQueue[sessionId]) {
          while (candidatesQueue[sessionId].length) {
            let candidate = candidatesQueue[sessionId].shift();
            webRtcEndpoint.addIceCandidate(candidate);
          }
        }

        webRtcEndpoint.on('OnIceCandidate', event => {
          var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
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

          if (broadcasters[host] === null) {
            stop(sessionId);
            return callback(noBroadcasterMessage);
          }

          callback(null, sdpAnswer);
        });

        webRtcEndpoint.gatherCandidates(error => {
          if (error) {
            stop(sessionId);
            return callback(error);
          }
        });

        pipeline.connect(webRtcEndpoint, webRtcEndpoint, recorderEndpoint, error => {
          if (error) {
            stop(sessionId);
            return callback(error);
          }

          log('Recorder connected for', sessionId);

          recorderEndpoint.record(error => {
            if (error) {
              stop(sessionId);
              return callback(error);
            }

            log('Recording for', sessionId);
          });
        });
      });
    });
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
    listenerErrorMessage = `An error happened while trying to listen to ${fileUri}`;
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

      if (listenerStream === null) {
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
        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
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
        if (listenerStream === null) {
          stop(sessionId);
          return callback(listenerErrorMessage);
        }

        listenerStream.webRtcEndpoint.connect(webRtcEndpoint, error => {
          if (error) {
            stop(sessionId);
            return callback(error);
          }
          if (listenerStream === null) {
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
        let options = { uri: fileUri };
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

              log('Playing', fileUri, 'for', sessionId);
            });
          });
        });
      }

    });
  };

  // pre-recorded broadcast
  if (fileUri) {

    getKurentoClient((error, kurentoClient) => {
      if (error) {
        stop(sessionId);
        return callback(error);
      }

      kurentoClient.create('MediaPipeline', (error, pipeline) => {
        if (error) {
          stop(sessionId);
          return callback(error);
        }

        listenerStream.pipeline = pipeline;
        createEndpoints(fileUri);
      });
    });

  } else {

    if (listenerStream === null) {
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

  if (host && broadcasters[host] !== null && broadcasters[host].id === sessionId) {
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
    broadcasters[host].recorderEndpoint && broadcasters[host].recorderEndpoint.stop();
    // release host broadcast media pipeline
    broadcasters[host].pipeline && broadcasters[host].pipeline.release();
    broadcasters[host] = null;
    delete broadcasters[host];
    listeners[host] = {};

  } else if (host && listeners[host][sessionId]) {
    // release listener endpoint
    listeners[host][sessionId].webRtcEndpoint.release();
    delete listeners[host][sessionId];

  } else if (player) {
    // release player pipeline
    player.pipeline && player.pipeline.release();
  }

  clearCandidatesQueue(sessionId);

  // no host because listening to pre-recorded broadcast
  // OR no more broadcater nor listeners, we can close the media pipeline
  if (!host || (Object.keys(listeners[host]).length < 1 && !broadcasters[host])) {
    log('Closing kurento client');
    kurentoClient.close();
    kurentoClient = null;
  }

  // FIXME? we could delete broadcasterUser[sessionId] here or set it to null
  // but sessionIds should not get re-used
};

const onIceCandidate = (sessionId, _candidate) => {
  let host = broadcasterUser[sessionId]; // get broadcaster host

  let candidate = kurento.getComplexType('IceCandidate')(_candidate);

  if (host && broadcasters[host] && broadcasters[host].id === sessionId && broadcasters[host].webRtcEndpoint) {
    info('Sending broadcaster ICE candidate');
    broadcasters[host].webRtcEndpoint.addIceCandidate(candidate);

  } else if (listeners[host][sessionId] && listeners[host][sessionId].webRtcEndpoint) {
    info('Sending listener ICE candidate');
    listeners[host][sessionId].webRtcEndpoint.addIceCandidate(candidate);

  } else {
    info('Queueing ICE candidate');
    if (!candidatesQueue[host][sessionId]) {
      candidatesQueue[host][sessionId] = [];
    }
    candidatesQueue[host][sessionId].push(candidate);
  }
};

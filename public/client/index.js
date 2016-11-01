// Make sure styles is on top
import styles from 'style';
import React from 'react';
import { render } from 'react-dom';
import { Router, IndexRoute, Route, browserHistory } from 'react-router';
import App from 'App';
import Login from 'Login';
import Register from 'Register';
import Home from 'Home';
import NavBar from 'NavBar';
import Recorder from 'Recorder';
import Player from 'Player';
import $ from 'jquery';

let myDebug = require('debug');
//myDebug.enable('index:*');
const log = myDebug('index:log');
const info = myDebug('index:info');
const error = myDebug('index:error');

// check for authorization
const requireAuth = function(nextState, replace, cb) {
  $.get('/verify')
    .error( (err) => {
      alert('unable to verify login!');
      console.log(err);
    })
    .success(loggedIn => {
      if (!loggedIn) {
        replace({
          pathname: '/login',
          state: { nextPathName: nextState.location.pathname }
        });
      }
      cb();
    });
};

// open websocket
let wsUri = `wss://${location.hostname}:8443/audio`; // secure websocket URI with server
let ws = new WebSocket(wsUri);

render(
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute ws={ws} component={Home}/>
      <Route path="navbar" component={NavBar}/>
      <Route path="login" component={Login}/>
      <Route path="register" component={Register}/>
      <Route path="recorder" ws={ws} component={Recorder} onEnter={requireAuth}/>
      <Route path="player" ws={ws} component={Player} onEnter={requireAuth}>
        <Route path=":username" ws={ws} component={Player} onEnter={requireAuth}/>
			</Route>
    </Route>
  </Router>,
  document.getElementById('app')
);

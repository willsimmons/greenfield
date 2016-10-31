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

// open websocket
let wsUri = 'wss://radradio.stream:8443/audio'; // secure websocket URI with server
let ws = new WebSocket(wsUri);

render(
	<Router history={browserHistory}>
		<Route path="/" component={App}>
			<IndexRoute component={Home}/>
			<Route path="navbar" component={NavBar}/>
			<Route path="login" component={Login}/>
			<Route path="register" component={Register}/>
			<Route path="recorder" ws={ws} component={Recorder}/>
			<Route path="player" ws={ws} component={Player}/>
		</Route>
		<Route path="*" component={App}>
			<IndexRoute component={Player}/>
		</Route>
	</Router>,
	document.getElementById('app')
);

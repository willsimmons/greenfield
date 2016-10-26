// Make sure styles is on top
import styles from 'style';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, IndexRoute, Route, hashHistory } from 'react-router';
import App from 'App';
import NavBar from 'NavBar';
import Recorder from 'Recorder';
import Player from 'Player';

ReactDOM.render((
	<Router history={ hashHistory }>
		<Route path="/" component={ App }>
			<Route path="navbar" component={ NavBar } />
			<Route path="recorder" component={ Recorder } />
			<Route path="player" component={ Player } />
		</Route>
	</Router>
), document.getElementById('app'));

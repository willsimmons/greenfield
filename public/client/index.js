// Make sure styles is on top
import styles from 'style';
import React from 'react';
import { render } from 'react-dom';
import { Router, IndexRoute, Route, browserHistory } from 'react-router';
import App from 'App';
import Home from 'Home';
import NavBar from 'NavBar';
import Recorder from 'Recorder';
import Player from 'Player';

render(
	<Router history={browserHistory}>
		<Route path="/" component={App}>
			<IndexRoute component={Home}/>
			<Route path="navbar" component={NavBar}/>
			<Route path="recorder" component={Recorder}/>
			<Route path="player" component={Player}/>
		</Route>
	</Router>,
	document.getElementById('app')
);

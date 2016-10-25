// Make sure styles is on top (??)
import styles from 'style';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory } from 'react-router';
import App from 'App';
import NavBar from 'NavBar';
import Recorder from 'Recorder';

ReactDOM.render((
	<Router history={ hashHistory }>
		<Route path="/" component={ App }>
			<Route path="navbar" component={ NavBar } />
			<Route path="recorder" component={ Recorder } />
		</Route>
	</Router>

	), document.getElementById('app'));
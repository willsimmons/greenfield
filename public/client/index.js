// Make sure styles is on top (??)
import styles from 'style';
import React from 'react';
import ReactDOM from 'react-dom';
import App from 'App';
import NavBar from 'NavBar';
import Player from 'Player';

ReactDOM.render(<App NavBar={ NavBar } Player={ Player }/>, document.getElementById('app'));
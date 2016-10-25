import React from 'react';
import styles from 'style';
import { Link } from 'react-router';


const NavBar = () => (
	<div className="nav">
		<ul>
			<li><Link to="/recorder">Recorder</Link></li>
			<li><Link to="/player">Player</Link></li>
			<li><a href="#">About</a></li>
			<li><input placeholder="Search..."></input></li>
			<li><a href="#">Login</a></li>
		</ul>
	</div>
);

export default NavBar;
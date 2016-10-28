import styles from 'style';
import React from 'react';
import { Link } from 'react-router';
import $ from 'jquery';

const logout = function(e) {
  e.preventDefault();
  var url = '/logout';
  $.get(url)
    .success(function(data) {
      window.location = data;
    });
}; 

const NavBar = () => (
  <div className="nav">
    <ul>
      <li><Link to="/recorder">Recorder</Link></li>
      <li><Link to="/player">Player</Link></li>
      <li><a href="#">About</a></li>
      <li><input placeholder="Search..."></input></li>
      <li><Link to="/login">Login</Link></li>
      <li><Link to="/register">Register</Link></li>
      <li onClick={logout}><a href="#" target="_self">Logout</a></li>
    </ul>
  </div>  
);

export default NavBar;

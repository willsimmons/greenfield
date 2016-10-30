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

class NavBar extends React.Component {

  // constructor(props) {
  //   super(props);
  //   this.state = {

  //   };
  // }

  render() {
    return (
      <div className="header">
        <Link to="/" className="logo">RADRADIO</Link>
        <div className="nav">
          <ul className="navList">
            <li><Link to="/recorder" className="navItem">Recorder</Link></li>
            <li><Link to="/player" className="navItem">Player</Link></li>
            <li><a href="#" className="navItem">About</a></li>
            <li><input placeholder="Search..." className="navItem"></input></li>
            <li><a href="#" className="navItem">Login</a></li>
            <li><Link to="/register" className="navItem">Register</Link></li>
            <li onClick={logout}><a href="#" target="_self" className="navItem">Logout</a></li>
          </ul>
        </div>
      </div>
    );
  }
}

export default NavBar;

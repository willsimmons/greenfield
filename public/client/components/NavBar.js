import styles from 'style';
import React from 'react';
import { Link } from 'react-router';
import $ from 'jquery';
import auth from '../lib/auth';


const logout = function(e) {
  delete window.localStorage.user;
  e.preventDefault();
  auth.logout();
}; 

class NavBar extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
<<<<<<< 6c8405f22d8ce1d67be848b94788f317542cc0b6
=======
      authenticated: false
>>>>>>> -(auth) complete user authentication and protected routes
    };
  }

  render() {
    return (
      <div className="header">
        <Link to="/" className="logo">RADRADIO</Link>
        <div className="nav">
          <ul className="navList">
<<<<<<< 6c8405f22d8ce1d67be848b94788f317542cc0b6
            <li><Link to="/recorder" className={"navItem " + (this.props.activeTab === 'recorder' ? 'active' : '')}>Recorder</Link></li>
            <li><Link to="/player" className={"navItem " + (this.props.activeTab === 'player' ? 'active' : '')}>Player</Link></li>
            <li><Link to "/login" className={"navItem " + (this.props.activeTab === 'login' ? 'active' : '')}>Login</Link></li>
            <li><Link to="/register" className={"navItem " + (this.props.activeTab === 'register' ? 'active' : '')}>Register</Link></li>
=======
            <li><Link to="/recorder" className="navItem">Recorder</Link></li>
            <li><Link to="/player" className="navItem">Player</Link></li>
            <li><a href="#" className="navItem">About</a></li>
            <li><Link to="/login" className="navItem">Login</Link></li>
            <li><Link to="/register" className="navItem">Register</Link></li>
>>>>>>> -(auth) complete user authentication and protected routes
            <li onClick={logout}><a href="#" target="_self" className="navItem">Logout</a></li>
          </ul>
        </div>
      </div>
    );
  }
}

export default NavBar;

import styles from 'style';
import React from 'react';
import $ from 'jquery';

class Register extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null
    };
  }

  addUser(e) {
    e.preventDefault();
    var url = '/api/register';
    var username = e.target.username.value;
    var password = e.target.password.value;
    var email = e.target.email.value;
    var creds = { username: username, password: password, email: email };
    $.post(url, creds)
      .error(function() {
        alert('POST error!');
      })
      .success(function(data) {
        window.location = data;
      });
  }


  render() {
    return (
      <div>
        <h1>Register</h1>
        <form onSubmit={this.addUser} className="registerForm">
         <div className="registerBox">
            <div className="registerInput">
              <label htmlFor="username">Username</label>
              <input type="text" name="username" value={this.state.username}/>
            </div>
            <div className="registerInput">
              <label htmlFor="password">Password</label>
              <input type="text" name="password" value={this.state.password}/>
            </div>
            <div className="registerInput">
              <label htmlFor="email">E-mail Address</label>
              <input type="text" name="email" value={this.state.email}/>
            </div>
            <div className="registerInput registerButton">
              <input type="submit" value="Register"/>
            </div>
          </div>
          <div className="opacityBG5"></div>
        </form>
      </div>
    );
  }
}

export default Register;

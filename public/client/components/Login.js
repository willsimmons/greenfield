import styles from 'style';
import React from 'react';
import $ from 'jquery';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null
    };
  }

  checkUser(e) {
    e.preventDefault();
    var url = '/api/login';
    var username = e.target.username.value;
    var password = e.target.password.value;
    var creds = { username: username, password: password };
    $.post(url, creds)
      .error(function() {
        alert('login error!');
      })
      .success(function(data) {
        window.location = data;
      });
  }


  render() {
    return (
      <div>
        <h1>Login Page!</h1>
        <form onSubmit={this.checkUser}>
          <div>
            <label for="username">Username</label>
            <input type="text" name="username" value={this.state.username}/>
          </div>
          <div>
            <label for="password">Password</label>
            <input type="text" name="password" value={this.state.password}/>
          </div>
          <div>
            <input type="submit" value="Login"/>
          </div>
        </form>
      </div>
    );
  }
}

export default Login;

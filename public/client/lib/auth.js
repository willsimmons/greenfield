import $ from 'jquery';

module.exports = {
  
  login(username, password, cb) {
    var url = '/api/login';
    var creds = { username: username, password: password };

    $.post(url, creds)
    .error(function() {
      alert('login error!');
    })
    .success(function(data) {
      window.localStorage.user = data.user;
      window.location = data.url;
    });
  }
  
};
import $ from 'jquery';

module.exports = {
  
  login(username, password, cb) {
    var url = '/api/login';
    var creds = { username: username, password: password };

    $.post(url, creds)
      .error( () => 
        alert('login error!'))
      .success( (data) => {
        window.localStorage.user = data.user;
        window.location = data.url;
      });
  },

  logout() {
    $.get('/logout')
      .success( (data) => {
        window.location = data;
      });
    
  }
  
};
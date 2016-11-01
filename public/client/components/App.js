import React from 'react';
import NavBar from 'NavBar';

let myDebug = require('debug');
//myDebug.enable('App:*');
const log = myDebug('App:log');
const info = myDebug('App:info');
const error = myDebug('App:error');

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <NavBar activeTab={ location.pathname.replace(/^\/([^\/]*)/, '$1') }/>
        { this.props.children }
      </div>
    );
  }

}

export default App;

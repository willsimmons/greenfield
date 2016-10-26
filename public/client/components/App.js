import React from 'react';
import NavBar from 'NavBar';
import Recorder from 'Recorder';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <NavBar />
        { this.props.children }
      </div>
    );
  }

}

export default App;

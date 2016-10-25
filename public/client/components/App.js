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
        <div className="centerDiv">
          <Recorder />
        </div>
      </div>
    );
  }
}

export default App;
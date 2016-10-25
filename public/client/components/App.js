import React from 'react';
import NavBar from 'NavBar';
import Player from 'Player';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <NavBar />
        <div className="centerDiv">
          <Player />
        </div>
      </div>
    );
  }
}

export default App;
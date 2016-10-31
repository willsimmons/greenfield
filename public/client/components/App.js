import React from 'react';
import NavBar from 'NavBar';

class App extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <NavBar activeTab={location.pathname.replace(/^\/([^\/]*)/, '$1')}/>
        { this.props.children }
      </div>
    );
  }

}

export default App;

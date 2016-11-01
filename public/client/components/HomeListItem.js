import styles from 'style';
import React from 'react';

let myDebug = require('debug');
//myDebug.enable('HomeListItem:*');
const log = myDebug('HomeListItem:log');
const info = myDebug('HomeListItem:info');
const error = myDebug('HomeListItem:error');

class HomeListItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="userBox" onClick={ () => this.props.handleClick(this.props.user) }>
        <div> <strong>{this.props.user.username}</strong> </div>
        <img src={this.props.user.pic} />
        <div> {this.props.user.description} </div>
      </div>
    );
  }
}

export default HomeListItem;

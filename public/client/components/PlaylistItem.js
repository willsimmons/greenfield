import styles from 'style';
import React from 'react';

class PlaylistItem extends React.Component {
  constructor(props) {
    super(props);
  }

  timerString(timer) {
    return (timer != null) ? new Date(1000 * timer).toISOString().substr(11, 8).replace(/^00:(.*:.*)/, '$1') : '';
  }

  render() {
    let deleteItem = ( <td></td> );
    if (this.props.deleteItem) {
      deleteItem = (
        <td className="deleteItem" onClick={ () => this.props.deleteItem(this.props.item, this.props.index)}><i className="fa fa-minus-circle" aria-hidden="true"></i></td>
      );
    } else {
      deleteItem = ( <td>LIVE</td> );
    }
    let id = ( <td></td> );
    if (this.props.item.id) {
      id = (
        <td onClick={ () => this.props.handleClick(this.props.item)} className="player-item-id"> {this.props.item.id} </td>
      );
    }
    let duration = ( <td></td> );
    if (this.props.item.duration) {
      duration = (
        <td onClick={ () => this.props.handleClick(this.props.item)}> {this.timerString(this.props.item.duration)} </td>
      );
    }

    return (
      <tr className="playlistTableRow">
        {deleteItem}
        <td onClick={ () => this.props.handleClick(this.props.item)} className="player-item-username"> <strong>{this.props.item.username}</strong> </td>
				<td onClick={ () => this.props.handleClick(this.props.item)}> {this.props.item.title} </td>
				<td onClick={ () => this.props.handleClick(this.props.item)}> {this.props.item.description} </td>
        {id}
        {duration}
			</tr>
    );
  }
}

export default PlaylistItem;

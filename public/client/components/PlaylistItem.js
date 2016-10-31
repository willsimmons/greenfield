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

    return (
      <tr className="playlistTableRow">
        <td className="deleteItem" onClick={ () => this.props.deleteItem(this.props.item, this.props.index)}><i className="fa fa-minus-circle" aria-hidden="true"></i></td>
        <td onClick={ () => this.props.handleClick(this.props.item)}> <strong>{this.props.item.username}</strong> </td>
				<td onClick={ () => this.props.handleClick(this.props.item)}> {this.props.item.title} </td>
				<td onClick={ () => this.props.handleClick(this.props.item)}> {this.props.item.description} </td>
        <td onClick={ () => this.props.handleClick(this.props.item)}> {this.props.item.id} </td>
        <td onClick={ () => this.props.handleClick(this.props.item)}> {this.timerString(this.props.item.duration)} </td>
			</tr>
    );
  }
}

export default PlaylistItem;

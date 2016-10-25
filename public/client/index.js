// Make sure styles is on top (??)
import styles from 'style';
import React from 'react';
import ReactDOM from 'react-dom';
import App from 'App';

let docBody = "Webpack is doing its thing, with ES2015!";
document.write(docBody);
ReactDOM.render(<App />, document.getElementById('app'));
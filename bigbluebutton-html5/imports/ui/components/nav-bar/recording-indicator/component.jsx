import React, { Component, PropTypes } from 'react';
import styles from './styles.scss';

export default class RecordingIndicator extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { beingRecorded } = this.props;

    if (!beingRecorded) {
      return null;
    }

    return (<div className={styles.indicator}></div>);
  }
};

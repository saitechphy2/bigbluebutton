import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Application from './component';

// import Service from './service';

class ApplicationContainer extends Component {
  render() {
    return (
      <Application {...this.props}>
        {this.props.children}
      </Application>
    );
  }
}
export default createContainer(() => {
  return {
    fontSizes: [
      '12px',
      '14px',
      '16px',
      '18px',
      '20px',
    ],
  };
}, ApplicationContainer);

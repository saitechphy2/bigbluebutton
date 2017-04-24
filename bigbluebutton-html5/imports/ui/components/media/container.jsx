import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Media from './component';
import MediaService from './service';
import Button from '../button/component';
import PresentationAreaContainer from '../presentation/container';
import VideoDockContainer from '../video-dock/container';
import DeskshareContainer from '../deskshare/container';
import DefaultContent from '../presentation/default-content/component';

const defaultProps = {
  overlay: null, //<VideoDockContainer/>,
  content: <PresentationAreaContainer/>,
  defaultContent: <DefaultContent />,
};

class MediaContainer extends Component {
  constructor(props) {
    super(props);

    const { overlay, content, defaultContent } = this.props;
    this.state = {
      overlay: overlay,
      content: this.props.current_presentation ? content : defaultContent,
    };

    this.handleToggleLayout = this.handleToggleLayout.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.current_presentation != this.props.current_presentation) {
      if (nextProps.current_presentation) {
        this.setState({ content: this.props.content });
      } else {
        this.setState({ content: this.props.defaultContent });
      }
    }
  }

  handleToggleLayout() {
    const { overlay, content } = this.state;
    this.setState({ overlay: content, content: overlay });
  }

  render() {
    return (
      <Media {...this.props}>
        {this.props.children}
      </Media>
    );
  }
}

MediaContainer.defaultProps = defaultProps;

export default createContainer(() => {
  let data = {};
  data.currentPresentation = MediaService.getPresentationInfo();

  data.content = <DefaultContent />;

  if (MediaService.shouldShowWhiteboard()) {
    data.content = <PresentationAreaContainer />;
  }

  if (MediaService.shouldShowDeskshare()) {
    data.content = <DeskshareContainer />;
  }

  if (MediaService.shouldShowOverlay()) {
    data.overlay = <VideoDockContainer />;
  }

  return data;
}, MediaContainer);

import React from 'react';
import ModalBase from '../../modal/base/component';
import styles from './styles.scss';
import JoinAudio from '../join-audio/component';
import AudioSettings from '../audio-settings/component';

export default class Audio extends React.Component {
  constructor(props) {
    super(props);

    this.JOIN_AUDIO = 0;
    this.AUDIO_SETTINGS = 1;

    this.submenus = [];
  }

  componentWillMount() {
    /* activeSubmenu represents the submenu in the submenus array to be displayed to the user,
     * initialized to 0
     */
    this.setState({ activeSubmenu: 0 });
    this.submenus.push({ componentName: JoinAudio, });
    this.submenus.push({ componentName: AudioSettings, });
  }

  changeMenu(i) {
    this.setState({ activeSubmenu: i });
  }

  createMenu() {
    const curr = this.state.activeSubmenu === undefined ? 0 : this.state.activeSubmenu;

    let props = {
      changeMenu: this.changeMenu.bind(this),
      JOIN_AUDIO: this.JOIN_AUDIO,
      AUDIO_SETTINGS: this.AUDIO_SETTINGS,
      LISTEN_ONLY: this.LISTEN_ONLY,
      handleJoinListenOnly: this.props.handleJoinListenOnly,
    };

    const Submenu = this.submenus[curr].componentName;
    return <Submenu {...props}/>;
  }

  render() {
    return (
      <ModalBase
        isTransparent={true}
        isOpen={true}
        onHide={null}
        onShow={null}
        className={styles.inner}>
        <div>
          {this.createMenu()}
        </div>
      </ModalBase>
    );
  }
};

import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { clearModal } from '/imports/ui/components/app/service';
import { exitAudio } from '../audio/service'
import Modal from '/imports/ui/components/modal/component';

const intlMessages = defineMessages({
  title: {
    id: 'app.breakoutJoinConfirmation.title',
    description: 'Join breakout room title',
  },
  message: {
    id: 'app.breakoutJoinConfirmation.message',
    description: 'Join breakout confim message',
  },
  confirmLabel: {
    id: 'app.breakoutJoinConfirmation.confirmLabel',
    description: 'Join confirmation button label',
  },
  confirmDesc: {
    id: 'app.breakoutJoinConfirmation.confirmDesc',
    description: 'adds context to confirm option',
  },
  dismissLabel: {
    id: 'app.breakoutJoinConfirmation.dismissLabel',
    description: 'Cancel button label',
  },
  dismissDesc: {
    id: 'app.breakoutJoinConfirmation.dismissDesc',
    description: 'adds context to dismiss option',
  },
});

class BreakoutJoinConfirmation extends Component {
  constructor(props) {
    super(props);

    this.handleJoinBreakoutConfirmation = this.handleJoinBreakoutConfirmation.bind(this);
  }

  handleJoinBreakoutConfirmation() {
    const { breakoutURL } = this.props;

    // leave main room's audio when joining a breakout room
    exitAudio();

    window.open(breakoutURL);
    clearModal();
  }

  render() {
    const { intl, breakoutName } = this.props;
    return (
      <Modal
        title={intl.formatMessage(intlMessages.title)}
        confirm={{
          callback: this.handleJoinBreakoutConfirmation,
          label: intl.formatMessage(intlMessages.confirmLabel),
          description: intl.formatMessage(intlMessages.confirmDesc),
        }}
        dismiss={{
          label: intl.formatMessage(intlMessages.dismissLabel),
          description: intl.formatMessage(intlMessages.dismissDesc),
        }}>
        {`${intl.formatMessage(intlMessages.message)} ${breakoutName}?`}
      </Modal>
    );
  }
};

export default injectIntl(BreakoutJoinConfirmation);

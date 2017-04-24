import BaseAudioBridge from './base';

import { callServer } from '/imports/ui/services/api';

const APP_CONFIG = Meteor.settings.public.app;
const MEDIA_CONFIG = Meteor.settings.public.media;

let triedHangup = false;

export default class SIPBridge extends BaseAudioBridge {
  constructor(userData) {
    super();
    this.userData = userData;
  }

  joinListenOnly() {
    callServer('listenOnlyToggle', true);
    this._joinVoiceCallSIP({ isListenOnly: true });
  }

  joinMicrophone() {
    this._joinVoiceCallSIP({ isListenOnly: false });
  }

  // Periodically check the status of the WebRTC call, when a call has been established attempt to
  // hangup, retry if a call is in progress, send the leave voice conference message to BBB
  exitAudio(afterExitCall = () => {}) {
    // To be called when the hangup is initiated
    const hangupCallback = function () {
      console.log('Exiting Voice Conference');
    };

    // Checks periodically until a call is established so we can successfully end the call
    // clean state
    triedHangup = false;

    // function to initiate call
    const checkToHangupCall = ((context, afterExitCall = () => {}) => {

      // if an attempt to hang up the call is made when the current session is not yet finished,
      // the request has no effect
      // keep track in the session if we haven't tried a hangup
      if (window.getCallStatus() != null && !triedHangup) {
        console.log('Attempting to hangup on WebRTC call');

        // notify BBB-apps we are leaving the call call if we are listen only
        if (this.userData.listenOnly) {
          callServer('listenOnlyToggle', false);
        }

        window.webrtc_hangup(hangupCallback);

        // we have hung up, prevent retries
        triedHangup = true;

        if (afterExitCall) {
          afterExitCall(this, APP_CONFIG.listenOnly);
        }
      } else {
        console.log('RETRYING hangup on WebRTC call in ' +
          `${MEDIA_CONFIG.WebRTCHangupRetryInterval} ms`);

        // try again periodically
        setTimeout(checkToHangupCall, MEDIA_CONFIG.WebRTCHangupRetryInterval);
      }
    })

    // automatically run function
    (this, afterExitCall);

    return false;
  }

  // join the conference. If listen only send the request to the server
  _joinVoiceCallSIP(options) {
    const extension = this.userData.voiceBridge;
    console.log(options);

    // create voice call params
    const joinCallback = function (message) {
      console.log('Beginning WebRTC Conference Call');
    };

    const {
      userId,
      username,
    } = this.userData;

    window.BBB = {};
    window.BBB.getMyUserInfo = function (callback) {
      const result = {
        myUserID: userId,
        myUsername: username,
        myInternalUserID: userId,
        myAvatarURL: null,
        myRole: 'getMyRole',
        amIPresenter: 'false',
        voiceBridge: extension,
        dialNumber: null,
      };
      return callback(result);
    };

    const stunsAndTurns = {
      stun: this.userData.stuns,
      turn: this.userData.turns,
    };

    callIntoConference(extension, function (audio) {
      switch (audio.status) {
        case 'failed':
          let audioFailed = new CustomEvent('bbb.webrtc.failed', {
            status: 'Failed', });
          window.dispatchEvent(audioFailed);
          break;
        case 'mediafail':
          let mediaFailed = new CustomEvent('bbb.webrtc.mediaFailed', {
            status: 'MediaFailed', });
          window.dispatchEvent(mediaFailed);
          break;
        case 'mediasuccess':
        case 'started':
          let connected = new CustomEvent('bbb.webrtc.connected', {
            status: 'started', });
          window.dispatchEvent(connected);
          break;
      }
    }, options.isListenOnly, stunsAndTurns);
  }
}

import Deskshare from '/imports/api/deskshare';
import Meetings from '/imports/api/meetings';
import modifyDeskshareStatus from '../modifiers/modifyDeskshareStatus';
import { check } from 'meteor/check';

export default function incomingDeskshareEvent({ payload }) {
  check(payload, Object);
  check(payload.meeting_id, String);
  check(payload.broadcasting, Boolean);
  check(payload.vh, Number);
  check(payload.vw, Number);

  const meetingId = payload.meeting_id;
  const voiceBridge = Meetings.findOne({ meetingId }).voiceConf;

  const deskShareInfo = {
    vw: payload.vw,
    vh: payload.vh,
    voiceBridge: voiceBridge, // payload.voice_bridge
    broadcasting: payload.broadcasting,
  };
  modifyDeskshareStatus(meetingId, deskShareInfo);
}


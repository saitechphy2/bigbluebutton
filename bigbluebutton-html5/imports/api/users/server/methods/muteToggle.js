import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import RedisPubSub from '/imports/startup/server/redis';
import Logger from '/imports/startup/server/logger';
import { isAllowedTo } from '/imports/startup/server/userPermissions';

export default function muteToggle(credentials, userId, isMuted = true) {
  const REDIS_CONFIG = Meteor.settings.redis;
  const CHANNEL = REDIS_CONFIG.channels.toBBBApps.users;
  const EVENT_NAME = 'mute_user_request_message';

  const { meetingId, requesterUserId } = credentials;

  check(meetingId, String);
  check(requesterUserId, String);
  check(userId, String);

  let action = userId === requesterUserId ? 'muteSelf' : 'muteOther';

  if (!isMuted) {
    action = `un${action}`;
  }

  if (!isAllowedTo(action, credentials)) {
    throw new Meteor.Error('not-allowed', `You are not allowed to ${action}`);
  }

  let payload = {
    user_id: userId,
    meeting_id: meetingId,
    mute: isMuted,
    requester_id: requesterUserId,
  };

  Logger.verbose(`User '${userId}' was ${!isMuted ? 'un' : ''}muted by '${requesterUserId}' from meeting '${meetingId}'`);

  return RedisPubSub.publish(CHANNEL, EVENT_NAME, payload);
};

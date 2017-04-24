import Captions from '/imports/api/captions';
import Logger from '/imports/startup/server/logger';
import { check } from 'meteor/check';
import addCaption from '../modifiers/addCaption';

export default function handleCaptionUpdate({ payload }) {
  const SERVER_CONFIG = Meteor.settings.app;
  const CAPTION_CHUNK_LENGTH = SERVER_CONFIG.captionsChunkLength || 1000;

  const meetingId = payload.meeting_id;
  const locale = payload.locale;

  check(meetingId, String);
  check(locale, String);

  let captionsObjects = Captions.find({
    meetingId,
    locale,
  }, {
    sort: {
      locale: 1,
      'captionHistory.index': 1,
    },
  }).fetch();

  let objectsToUpdate = [];
  if (captionsObjects != null) {
    let startIndex;
    let endIndex;
    let length = 0;
    let current = captionsObjects[0];

    //looking for a start index and end index
    //(end index only for the case when they are in the same block)
    while (current != null) {
      length += current.captionHistory.captions.length;

      //if length is bigger than start index - we found our start index
      if (length >= payload.start_index && startIndex == undefined) {
        //check if it's a new character somewhere in the middle of captions text
        if (length - 1 >= payload.start_index) {
          startIndex = payload.start_index - (length - current.captionHistory.captions.length);

          //check to see if the end_index is in the same object as start_index
          if (length - 1 >= payload.end_index) {
            endIndex = payload.end_index - (length - current.captionHistory.captions.length);
            let _captions = current.captionHistory.captions;
            current.captionHistory.captions = _captions.slice(0, startIndex) +
                                              payload.text +
                                              _captions.slice(endIndex);
            objectsToUpdate.push(current);
            break;

          //end index is not in the same object as start_index, we will find it later
          } else {
            current.captionHistory.captions = current.captionHistory.captions.slice(0, startIndex) +
                                              payload.text;
            objectsToUpdate.push(current);
            break;
          }

        //separate case for appending new characters to the very end of the string
        } else if (current.captionHistory.next == null &&
                  length == payload.start_index &&
                  length == payload.start_index) {

          startIndex = 1;
          endIndex = 1;
          current.captionHistory.captions += payload.text;
          objectsToUpdate.push(current);
        }
      }

      current = captionsObjects[current.captionHistory.next];
    }

    //looking for end index here if it wasn't in the same object as start index
    if (startIndex != undefined && endIndex == undefined) {
      current = captionsObjects[current.captionHistory.next];
      while (current != null) {
        length += current.captionHistory.captions.length;

        //check to see if the end_index is in the current object
        if (length - 1 >= payload.end_index) {

          endIndex = payload.end_index - (length - current.captionHistory.captions.length);
          current.captionHistory.captions = current.captionHistory.captions.slice(endIndex);
          objectsToUpdate.push(current);

          break;

        //if end_index wasn't in the current object, that means this whole object was deleted
        //initializing string to ''
        } else {
          current.captionHistory.captions = '';
          objectsToUpdate.push(current);
        }

        current = captionsObjects[current.captionHistory.next];
      }
    }

    //looking for the strings which exceed the limit and split them into multiple objects
    let maxIndex = captionsObjects.length - 1;
    for (i = 0; i < objectsToUpdate.length; i++) {
      if (objectsToUpdate[i].captionHistory.captions.length > CAPTION_CHUNK_LENGTH) {
        //string is too large. Check if the next object exists and if it can
        //accomodate the part of the string that exceeds the limits
        let _nextIndex = objectsToUpdate[i].captionHistory.next;
        if (_nextIndex != null &&
            captionsObjects[_nextIndex].captionHistory.captions.length < CAPTION_CHUNK_LENGTH) {

          let extraString = objectsToUpdate[i].captionHistory.captions.slice(CAPTION_CHUNK_LENGTH);

          //could assign it directly, but our linter complained
          let _captions = objectsToUpdate[i].captionHistory.captions;
          _captions = _captions.slice(0, CAPTION_CHUNK_LENGTH);
          objectsToUpdate[i].captionHistory.captions = _captions;

          //check to see if the next object was added to objectsToUpdate array
          if (objectsToUpdate[i + 1] != null &&
            objectsToUpdate[i].captionHistory.next == objectsToUpdate[i + 1].captionHistory.index) {
            objectsToUpdate[i + 1].captionHistory.captions = extraString +
                                                    objectsToUpdate[i + 1].captionHistory.captions;

          //next object wasn't added to objectsToUpdate array, adding it from captionsObjects array.
          } else {
            let nextObj = captionsObjects[objectsToUpdate[i].captionHistory.next];
            nextObj.captionHistory.captions = extraString + nextObj.captionHistory.captions;
            objectsToUpdate.push(nextObj);
          }

        //next object was full already, so we create another and insert it in between them
        } else {
          //need to take a current object out of the objectsToUpdate and add it back after
          //every other object, so that Captions collection could be updated in a proper order
          let tempObj = objectsToUpdate.splice(i, 1);
          let extraString = tempObj[0].captionHistory.captions.slice(CAPTION_CHUNK_LENGTH);
          tempObj[0].captionHistory.captions = tempObj[0].captionHistory.captions.slice(0, CAPTION_CHUNK_LENGTH);

          maxIndex += 1;
          let tempIndex = tempObj[0].captionHistory.next;
          tempObj[0].captionHistory.next = maxIndex;

          while (extraString.length != 0) {
            let entry = {
              meetingId: meetingId,
              locale: locale,
              captionHistory: {
                locale: locale,
                ownerId: tempObj[0].captionHistory.ownerId,
                captions: extraString.slice(0, CAPTION_CHUNK_LENGTH),
                index: maxIndex,
                next: null,
              },
            };
            maxIndex += 1;
            extraString = extraString.slice(CAPTION_CHUNK_LENGTH);
            if (extraString.length > 0) {
              entry.captionHistory.next = maxIndex;
            } else {
              entry.captionHistory.next = tempIndex;
            }

            objectsToUpdate.push(entry);
          }

          objectsToUpdate.push(tempObj[0]);
        }
      }
    }
  }

  let captionsAdded = [];
  objectsToUpdate.forEach(entry => {
    const { _id, meetingId, locale, captionHistory } = entry;
    captionsAdded.push(addCaption(meetingId, locale, captionHistory, _id));
  });

  return captionsAdded;
};

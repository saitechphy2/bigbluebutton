import Captions from '/imports/api/captions';
import Auth from '/imports/ui/services/auth';
import Settings from '/imports/ui/services/settings';

let getCCData = () => {
  const meetingID = Auth.meetingID;

  const ccSettings = Settings.cc;

  let CCEnabled = ccSettings.enabled;

  //associative array that keeps locales with arrays of string objects related to those locales
  let captions = [];

  //list of unique locales in the Captions Collection
  if (CCEnabled) {
    let locales = _.uniq(Captions.find({}, {
      sort: { locale: 1 },
      fields: { locale: true },
    }).fetch().map(function (obj) {
      return obj.locale;
    }), true);

    locales.forEach((locale) => {
      let captionObjects = Captions.find({
        meetingId: meetingID,
        locale: locale,
      }, {
        sort: {
          locale: 1,
          'captionHistory.index': 1,
        },
      }).fetch();

      let current = captionObjects[0];
      captions[current.locale] = {
        ownerId: current.captionHistory.ownerId ? current.captionHistory.ownerId : null,
        captions: [],
      };
      while (current != null) {
        captions[current.locale].captions.push({
          captions: current.captionHistory.captions,
          index: current.captionHistory.index,
        });
        current = captionObjects[current.captionHistory.next];
      }
    });
  }

  //fetching settings for the captions
  let selectedLocale = ccSettings.locale;
  let ccFontFamily = ccSettings.fontFamily ? ccSettings.fontFamily : 'Arial';
  let ccFontSize = ccSettings.fontSize ? ccSettings.fontSize : 18;
  let ccBackgroundColor = ccSettings.backgroundColor ? ccSettings.backgroundColor : '#f3f6f9';
  let ccFontColor = ccSettings.fontColor ? ccSettings.fontColor : '#000000';
  return {
    locale: selectedLocale,
    fontFamily: ccFontFamily,
    fontSize: ccFontSize,
    fontColor: ccFontColor,
    backgroundColor: ccBackgroundColor,
    captions: captions,
  };
};

export default {
  getCCData,
};

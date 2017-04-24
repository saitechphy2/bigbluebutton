/**
* BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
* 
* Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
*
* This program is free software; you can redistribute it and/or modify it under the
* terms of the GNU Lesser General Public License as published by the Free Software
* Foundation; either version 3.0 of the License, or (at your option) any later
* version.
* 
* BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
* WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
* PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License along
* with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.
*
*/

package org.bigbluebutton.presentation;

import java.util.HashMap;
import java.util.Map;

import org.bigbluebutton.api.messaging.MessagingConstants;
import org.bigbluebutton.api.messaging.MessagingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;

public class OfficeToPdfConversionSuccessFilter {
  private static Logger log = LoggerFactory
      .getLogger(OfficeToPdfConversionSuccessFilter.class);

  private final MessagingService messagingService;

  private static Map<String, String> conversionMessagesMap;

  public OfficeToPdfConversionSuccessFilter(MessagingService m) {
    messagingService = m;
    conversionMessagesMap = new HashMap<String, String>();
    conversionMessagesMap.put(
        ConversionMessageConstants.OFFICE_DOC_CONVERSION_SUCCESS_KEY,
        "Office document successfully converted.");
    conversionMessagesMap.put(
        ConversionMessageConstants.OFFICE_DOC_CONVERSION_FAILED_KEY,
        "Failed to convert Office document.");
    conversionMessagesMap.put(
        ConversionMessageConstants.OFFICE_DOC_CONVERSION_INVALID_KEY,
        "Invalid Office document detected, it will not be converted.");
  }

  public boolean didConversionSucceed(UploadedPresentation pres) {
    notifyProgressListener(pres);
    return pres
        .getConversionStatus() == ConversionMessageConstants.OFFICE_DOC_CONVERSION_SUCCESS_KEY;
  }

  private void notifyProgressListener(UploadedPresentation pres) {
    Map<String, Object> msg = new HashMap<String, Object>();
    msg.put("conference", pres.getMeetingId());
    msg.put("room", pres.getMeetingId());
    msg.put("returnCode", "CONVERT");
    msg.put("presentationId", pres.getId());
    msg.put("presentationName", pres.getId());
    msg.put("filename", pres.getName());
    msg.put("message", conversionMessagesMap.get(pres.getConversionStatus()));
    msg.put("messageKey", pres.getConversionStatus());

    log.info("Notifying of " + pres.getConversionStatus() + " for "
        + pres.getUploadedFile().getAbsolutePath());
    sendNotification(msg);
  }

  private void sendNotification(Map<String, Object> msg) {
    if (messagingService != null) {
      Gson gson = new Gson();
      String updateMsg = gson.toJson(msg);
      log.debug("sending: " + updateMsg);
      messagingService.send(MessagingConstants.TO_PRESENTATION_CHANNEL,
          updateMsg);
    } else {
      log.warn("MessagingService has not been set!.");
    }
  }
}

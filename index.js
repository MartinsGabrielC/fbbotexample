const
  bodyParser = require('body-parser'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({verify: verifyRequestSignature}));
app.set('port', process.env.PORT || 9091);
app.listen(app.get('port'), function(){
  console.log('Node app is runing on port', app.get('port'));
});

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = process.env.MESSENGER_APP_SECRET;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN);

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN);

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL);

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

//Server Frontpage
app.get('/',function(req, res){
  res.status(200).send('This is TestBot Server');
});

//Facebook Webhook is sent as GET
app.get('/webhook', function(req, res){
  if(req.query['hub.mode'] === "subscribe" && req.query['hub.verify_token'] === VALIDATION_TOKEN){
    res.status(200).send(req.query['hub.challenge']);
  }else{
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

//Handling receiving messages
app.post('/webhook', function (req, res) {
  var data = req.body;
  //Verify if is a page subscription
  if(data.object == 'page'){
    //Iterate over each entry
    data.entry.forEach(function(pageEntry){
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      //Iterate over each messsaging event
      pageEntry.messaging.forEach(function(messagingEvent){
        if (messagingEvent.message){
          receivedMessage(messagingEvent);
        }else if(messagingEvent.postback){
          receivedPostback(messagingEvent);
        }else if(messagingEvent.delivery){
          receivedDeliveryConfirmation(messagingEvent);
        }else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });
  }
  res.sendStatus(200);
});

function receivedDeliveryConfirmation(event){
  var messageIDs = event.delivery.mids;
  var watermark = event.delivery.watermark;
  if(messageIDs){
    messageIDs.forEach(function(messageID){
      console.log("Received delivery confirmation for message: %s", messageID);
    });
  }
  console.log("All message before %d were delivered.", watermark);

}

function sendAPI(messageData){
  request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: messageData
    }, function(error, response, body) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
}

//Generic message sending function
function sendTextMessage(recipientId, message) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: message
    }
  };

  sendAPI(messageData);
}

function sendImageMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "like.png",
          is_reusable: true
        }
      }
    }
  };

  sendAPI(messageData);
}

function sendGifMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "instagram_logo.gif",
          is_reusable: true
        }
      }
    }
  };

  sendAPI(messageData);
}

function sendAudioMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "sample.mp3",
          is_reusable: true
        }
      }
    }
  };

  sendAPI(messageData);
}

function sendVideoMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "allofus480.mov",
          is_reusable: true
        }
      }
    }
  };

  sendAPI(messageData);
}

function sendFileMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment:{
        type: "file",
        payload: {
          url: SERVER_URL + "test.txt",
          is_reusable: true
        }
      }
    }
  };
  sendAPI(messageData);
}

function sendButtonMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "What to do next?",
          buttons: [
            {
              type: "web_url",
              url: "https://github.com/MartinsGabrielC/fbbotexample",
              title: "Github Link"
            },
            {
              type: "postback",
              title: "Postback: Let's chat!",
              payload: "LETS_CHAT"
            }
          ]
        }
      }
    }
  };
  sendAPI(messageData);
}

function sendGenericMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Oculus Rift",
            subtitle: "The Oculus Rift is a virtual reality system that completely immerses you inside virtual worlds. Oculus Rift is available now.",
            item_url: "https://www3.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www3.oculus.com/en-us/rift/",
              title: "Go to website"
            },
            {
              type: "postback",
              title: "Call Postback",
              payload: "PAYLOAD_RIFT"
            }],
          },
          {
            title: "Oculus Touch",
            subtitle: "Oculus Touch is a pair of tracked controllers that give you hand presence—the feeling that your virtual hands are actually your own.",
            item_url: "https://www3.oculus.com/en-us/rift/",
            image_url: SERVER_URL + "touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www3.oculus.com/en-us/rift/",
              title: "Go to website"
            },
            {
              type: "postback",
              title: "Call postback",
              payload: "PAYLOAD_TOUCH"
            }]
          }]
        }
      }
    }
  };
  sendAPI(messageData);
}

function sendListMessage(recipientID){
  //List supports at least 2 elements and at most 4
  //Adding a button to each element is optional. You may only have up to 1 button per element
  //You may have up to 1 global button
  var messageData = {
    recipient: {
      id: recipientID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          top_element_style: "compact",
          elements:[
              {
                title: "Oculus Rift",
                image_url: SERVER_URL + "rift.png",
                subtitle: "The Oculus Rift is a virtual reality system that completely immerses you inside virtual worlds. Oculus Rift is available now.",
                default_action: {
                  type: "web_url",
                  url: "https://www3.oculus.com/en-us/rift/",
                  messenger_extensions: "true",
                  webview_height_ratio: "tall",
                  fallback_url: "https://www3.oculus.com"
                },
                buttons: [
                  {
                    title: "View",
                    type: "web_url",
                    url: "https://www3.oculus.com/en-us/rift/",
                    messenger_extensions: "true",
                    webview_height_ratio: "tall",
                    fallback_url: "https://www3.oculus.com"
                  }
                ]
              },
              {
                title: "Oculus Touch",
                image_url: SERVER_URL + "touch.png",
                subtitle: "Oculus Touch is a pair of tracked controllers that give you hand presence—the feeling that your virtual hands are actually your own.",
                buttons: [
                  {
                    title: "View",
                    type: "web_url",
                    url: "https://www3.oculus.com/en-us/rift/",
                    messenger_extensions: "true",
                    webview_height_ratio: "tall",
                    fallback_url: "https://www3.oculus.com"
                  }
                ]
              }
          ],
          buttons: [
            {
              title: "View More",
              type: "postback",
              payload: "PAYLOAD_LIST"
            }
          ]
        }
      }
    }
  };
  sendAPI(messageData);
}

function receivedMessage(event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var messageText = message.text;

  console.log("Received message from user %d for page %d at %d with message: %s", senderID,recipientID,timeOfMessage,messageText);


  var messageAttachments = message.attachments;
  if(messageText){
    switch (messageText) {
      case 'img':
        sendImageMessage(senderID);
        break;
      case 'gif':
        sendGifMessage(senderID);
        break;
      case 'audio':
        sendAudioMessage(senderID);
        break;
      case 'video':
        sendVideoMessage(senderID);
        break;
      case 'file':
        sendFileMessage(senderID);
        break;
      case 'button':
        sendButtonMessage(senderID);
        break;
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'list':
        sendListMessage(senderID);
        break;
      default:
        sendTextMessage(senderID,messageText);
    }
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  if (payload === "GET_STARTED"){
    var tutorial = "Welcome to the bot example. Let's get started!\n"
    +"Message: \n"
    + "\"img\" to receive an image message\n"
    +"\"gif\" to receive a gif message\n"
    +"\"audio\" to receive an audio message\n"
    +"\"video\" to receive a video message\n"
    +"\"file\" to receive a file\n"
    +"\"button\" to receive a button template\n"
    +"\"generic\" to receive a generic template\n"
    +"\"list\" to receive a list template\n"
    +"anything else will be echo\'ed"
    sendTextMessage(senderID,tutorial);
  }else if (payload === "LETS_CHAT"){
    sendTextMessage(senderID,"Sure, what do you want to do next?");
  }else if(payload === "PAYLOAD_RIFT"){
    sendTextMessage(senderID,"Well, you just sent me the Rift payload");
  }else if(payload === "PAYLOAD_TOUCH"){
    sendTextMessage(senderID,"Well, you just sent me the Touch payload");
  }else if(payload === "PAYLOAD_LIST"){
    sendTextMessage(senderID, "If you want to know more check their website: \nhttps://www3.oculus.com")
  }
}

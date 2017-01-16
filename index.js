const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

//Server Frontpage
app.get('/',function(req, res){
  res.send('This is TestBot Server');
});

//Facebook Webhook
app.get('/webhook', function(req, res){
  if(req.query['hub.verify_token'] === VALIDATION_TOKEN){
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
        }else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });
  }
  res.sendStatus(200);
});

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
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/media/a.png"
        }
      }
    }
  };

  sendAPI(messageData);
}

function sendGifMessage(recipientID){
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/media/instagram_logo.gif"
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
  var message = envent.message;

  console.log("Received message from user %d for page %d at %d with message: ", senderID,recipientID,timeOfMessage);
  console.log(JSON.stringify(message));

  var messageText = message.text;
  var messageAttachments = message.attachments;
  if(messageText){
    switch (messageText) {
      case 'img':
        sendImageMessage(senderID);
        break;
      case 'gif':
        sendGifMessage(senderID);
        break;
      default:
        sendTextMessage(senderID,message);
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
    sendTextMessage(senderID,"Welcome to the bot example. Let's get started!");
    sendTextMessage(senderID,"Message: \n\"img\" to receive a image message\n\"gif\" to receiva a gif message");
  }
}

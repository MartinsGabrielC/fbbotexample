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

//Server Frontpage
app.get('/',function(req, res){
  res.send('This is TestBot Server');
});

//Facebook Webhook
app.get('/webhook', function(req, res){
  if(req.query['hub.verify_token'] === 'testbot_verify_token'){
    res.send(req.query['hub.challenge']);
  }else{
    res.send('Invalid verify token');
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
          sendMessage(messagingEvent.sender.id, {text: "echo: " + messagingEvent.message.text});
        }else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });
  }
  // var events = req.body.entry[0].messaging;
  // for (i = 0; i < events.length; i++) {
  //     var event = events[i];
  //     if (event.message && event.message.text) {
  //         sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
  //     }
  // }
  res.sendStatus(200);
});

//Generic message sending function
function sendMessage(recipientId, message) {
  request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
          recipient: {id: recipientId},
          message: message,
      }
    }, function(error, response, body) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
};

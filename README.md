# Facebook Menssenger Bot Example

This is a simple Facebook Menssenger Bot, just demonstrate basic procedures and templates.  
You will need Node.js installed.  
If you don't have it, [get it here.](https://nodejs.org/en/) (*npm comes with it*)  
And to host the App we will use Heroku, and use [AWS S3][amazonWebServices] to store the media files (It has an free account for up to %Gb). 
  
##Install
```
git clone https://github.com/MartinsGabrielC/fbbotexample.git
cd fbbotexample
npm install
```
  
##Tutorial
###1.Create a Facebook Page  
First [create a page][createFbPage] as an App Page and choose it's name.  
Just click a bunch of skip's.  
  
###2.Create an App  
[Click this link][createFbApp] to create a Facebook App.  
Select "Skip and create App ID" on the top left corner.  
  
![Create Facebook App](http://image.prntscr.com/image/0a8971aa2cf940e7ab367a90f9a43105.png)  
  
Fill the form, select **Category as "Apps for Menssenger"**(It will add the Messenger Product automaticaly)  
  
![Facebook App Form](http://image.prntscr.com/image/af8866c46a2f42fcb5e329656a35d78f.png)  
  
Head to the App Dashboard.  
Select "Messenger" under "Products"  
In the Token Generator tab, select the page you just created. It will generate a Page Access Token.(Save it somewhere, we will use it later)  
  
![Page Access Token](http://image.prntscr.com/image/8614be8b57694207890e82d9dd91fa50.png)  
  
###3.Setup Heroku
You can either:
- Download [their toolbelt][herokuToolbelt]
	- Login to it with your Heroku account and create a new app

				$ heroku login
				$ heroku create
				Creating app... done, stack is cedar-14  
				https://intense-temple-XXXXX.herokuapp.com/ | https://git.heroku.com/intense-temple-XXXXX.git  
				$ git push heroku master
				https://intense-temple-XXXXX.herokuapp.com/ deployed to Heroku

	- It creates our app under the given URL and deploys it to the server after sucessful `git push`  
  
  	
![Sucessful Server Deploy](http://image.prntscr.com/image/bb71d63d9fea44d3be74888ccfd4c093.png)
- Go to their [Dashboard][heroku] and create a new App and link it to your github repository.  
	- In the app Dashboard select the Deploy tab
	- Deployment Method select Github
	- Connect your account and select your repository (You can select so every time you push to the repository it will automaticaly deploy)  
  
####Set Config Variables  
Go to you app's Settings and set Config Variable `MESSENGER_PAGE_ACCESS_TOKEN` to the value generated previously.  
Set `MESSENGER_VALIDATION_TOKEN` as an value you will use to validate the app subscription  
	-Hint: use `$openssl rand -base64 36` to generate a random string in your command line  
Set `SERVER_URL` as the URL to your S3 bucket.  
Set `MESSENGER_APP_SECRET` as the value that can be got on your App Dashboard  
  
![Messenger Secret](http://image.prntscr.com/image/c38cdcc9efbb4fb98b3e23bcaf9abbbe.png)  
  
##4.Setup Your App Webhook  
  
Back to the Messenger Tab on your Facebook App select "Setup Webhooks"  

![Setup Webhooks](http://image.prntscr.com/image/05ce051317864501a58c0ccc27363dfa.png)  
  
On *"Callback URL"* you put your Heroku App link and add "/webhook" to the end, and on *"Verify Token"* you need to put the value you generated (**MESSENGER_VALIDATION_TOKEN**).
  
On "subscription Fields" select:  
- messages  
- messaging_postback  
- messaging_optins  
- message_deliveries 
- message_reads  
- message_echoes  
  
Should look something like this:    
  
![Webhook Setup](http://image.prntscr.com/image/1fcd0252266a4d318b17ab9ddf01fcc4.png)  





[createFbPage]: https://www.facebook.com/pages/create
[createFbApp]: https://developers.facebook.com/quickstarts/?platform=web
[heroku]: https://dashboard.heroku.com/apps/
[herokuToolbelt]: https://devcenter.heroku.com/articles/heroku-cli
[amazonWebServices]: https://aws.amazon.com/pt/

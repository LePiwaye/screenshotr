#Screenshotr

Tool for autoscreenshoting and answering tweetline.
This app is not properly coded and is very clunky/has lots of messy code, but it gets the job done.
Currently used for #MEMOQPUC, but can handle any hashtag feed.

## Prerequisites

To run this app, you'll need :
* A twitter dev account with a verified application (the application account will be used to post the screenshoted answer)
* A running environment with node.js, ruby and gem installed


## Installing dependencies

Besides the node packages, this application requires several machine-level dependencies :
* twurl
* phantomjs

### twurl

I admit you have Ruby and Gem installed on your running environment
```
//Install twurl
gem install twurl

//Authorize the Twitter App to post 
twurl authorize --consumer-key <Consumer key provided by twitter> --consumer-secret <Consumer secret provided by Twitter>

//The app will provide you an URL that you should open in your browser. This URL will give you a code to write down in the terminal input to actually authorize the Twitter<>twurl binding. 
```

### phantomjs

#### GUI install
```
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
tar jxf phantomjs-2.1.1-linux-x86_64.tar.bz2
mv phantomjs-2.1.1-linux-x86_64.tar.bz2 phantomjs-local
sudo mv phantomjs-local /usr/local/share
sudo ln -sf /usr/local/share/phantomjs-local/bin/phantomjs /usr/local/bin

//Check the installation with `phantomjs --version` 
```

### node.js dependencies

Just run `npm install` in the project directory

## Configuration

The app has a `conf.json` file that contains all useful variables :

```json

{
  "bot_user_name" : "<Bot username, wont screenshot this account posts>",
  "bot_user_id" : "<Bot user ID, found in a twitter API Call answer>",
  "bot_user_id_str" : "<Bot user ID string, found in a twitter API Call answer>",
  "keyword" : "<Monitored hashtag>",
  "consumer_key" : "<Consumer key provided by twitter>",
  "consumer_secret" : "<Consumer secret provided by twitter>",
  "access_token_key" : "<Access token provided by twitter>",
  "access_secret" : "<Access secret provided by twitter>"
}


```

## Running

It is suggested to run this app in a terminal multiplexor, such as screen, since leaving the SSH session would cut the process 
`node screenshotr.js >> /var/log/screenshotr.log`

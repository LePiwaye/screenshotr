let path = require('path');
let https = require("https");
let childProcess = require('child_process');
let phantomjs = require('phantomjs-prebuilt');
let schedule = require('node-schedule');
let util = require("util");
let fs = require("fs");
let crypto = require("crypto");
let qs = require("querystring");

let binPath = phantomjs.path;

/* Setting useful constants and reading conf*/
enhanceLog("log","Initialisation de l'application");

let confContent = fs.readFileSync("conf.json");
let jsonConf = JSON.parse(confContent);

let botUserName = jsonConf.bot_user_name;
let botUserID = jsonConf.bot_user_id;
let botUserIdStr = jsonConf.bot_user_id_str;

let keyword = jsonConf.keyword;

let consumerKey = jsonConf.consumer_key;

let Twitter = require('twitter');
let TwitterOA = require('twitter-js-client').Twitter;

let client = new Twitter({
    consumer_key: consumerKey,
    consumer_secret: jsonConf.consumer_secret,
    access_token_key: jsonConf.access_token_key,
    access_token_secret: jsonConf.access_secret
});

let params = {screen_name: 'nodejs'};

/* Sending launch signal */
let launchable = schedule.scheduleJob('*/10 * * * * *', function(){
    playLogic(client, params);
});

function playLogic(client, params){
    enhanceLog("log","Polling data");

    client.get('search/tweets.json?q=' + keyword + '&result_type=recent&include_entities=false&since_id=' + getLastPolledId(), params, function(error, tweets, response) {
        if (!error) {
            let str = tweets.statuses;
            let tweetsArray = [];

            enhanceLog("log","Data polled, " + str.length + " elements found");

            str.forEach(function(twe){
                if(twe.id > getLastPolledId()){
                    enhanceLog("log", "Ajout du tweet de " + twe.user.screen_name + " (ID " + twe.id + ") à la file d'attente.");
                    let url = "https://twitter.com/" + twe.user.screen_name + "/status/" + twe.id_str;

                    let arr = {
                        "id": twe.id,
                        "url": url,
                        "user": twe.user.screen_name,
                        "userID" : twe.user.id,
                        "idstr": twe.id_str
                    };
                    tweetsArray.push(arr);
                }
            });

            let uniqueTweets = Array.from(new Set(tweetsArray));

            uniqueTweets.forEach(function(tweet){
                if(Number(tweet.id) > Number(getLastPolledId())){
                    setLastPolledId(Number(tweet.id));
                }
                if(tweet.user !== botUserName){
                    takePicOfTweet(tweet);
                }
            });
        }
        else{
            enhanceLog("error","Echec de connexion a l'API Twitter");
            clearInterval();
        }
    });
}

function takePicOfTweet(tweet){
    enhanceLog("log", "Capture du tweet de " + tweet.user + " (ID " + tweet.id + ") débutée.");

    let childArgs = [
        path.join(__dirname, 'getImage.js'),
        tweet.url,
        path.join(__dirname, '/pics/' + tweet.id.toString() + '.png')
    ];

    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        if(err === null){
            enhanceLog("log", "Capture du tweet " + tweet.id + " terminée. Envoi à l'upload imminent.");
            postTweet(tweet);
        }
        else {
            enhanceLog("error", "Capture du tweet " + tweet.id + " échouée.");
            enhanceLog("error", stderr.toString());
        }
    });
}

function postTweet(tweet){
    //Upload du media
    enhanceLog("log", "Upload du media pour le tweet " + tweet.id + ".");

    //Collecte de la taille du fichier
    let fileStats = fs.statSync(__dirname + "/pics/" + tweet.id + ".png");
    let fileSize = fileStats.size;
    let mediaType = "image/png";
    let additionalOwner = botUserID;

    //Demande de chunk media
    enhanceLog("log", "Demande de chunk media pour le tweet " + tweet.id + ".");

    let imgpath = __dirname + "/pics/" + tweet.id + ".png";

    childProcess.exec("twurl -H upload.twitter.com \"/1.1/media/upload.json\" -f " + imgpath + " -F media -X POST", (err, stdout, stderr) => {
        if(err === null){
            let response = JSON.parse(stdout.toString());
            enhanceLog("log", "Media uploadé pour le tweet " + tweet.id + ".");
            postAnswer(tweet, response.media_id_string);
        }
    });
}

function postAnswer(tweet, mediaID){
    enhanceLog("log", "Envoi de la réponse au tweet " + tweet.id + ".");

    let sendStr = "twurl \"/1.1/statuses/update.json\" -d \"media_ids=" + mediaID
        + "&in_reply_to_status_id=" + tweet.idstr
	+ "&auto_populate_reply_metadata=true"
        + "&status=@" + tweet.user
        + " Screenshot effectué ! #MEMOQPUC \""
        + " -X POST";

    childProcess.exec(sendStr, (err, stdout, stderr) => {
        if(err === null){
	    //console.log(stdout);
	    let RTJson = JSON.parse(stdout);
            enhanceLog("log", "Réponse confirmée pour le tweet " + tweet.id + ". Identifiant du nouveau tweet : " + RTJson.id + " / " + RTJson.id_str);
            //deleteFile(tweet.idstr);
        }
        else{
            enhanceLog("error", "Erreur de post de la réponse pour le tweet " + tweet.id + " : " + err);
        }

        //deleteFile(tweet.id);
    });
}

function deleteFile(id){
    fs.unlinkSync(__dirname + "/pics/" + id + ".png", (err) => {
        if (err) throw err;
        else enhanceLog("log", "Le screenshot du tweet " + id + " a été supprimé.");
    });
}

function getDateTime() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    return "[" + day + "/" + month + "/" + year + " - " + hour + ":" + min + ":" + sec + "] ";

}

function enhanceLog(type,data){
    if(type === "log"){
        console.log(getDateTime() + " [LOG] " + data);
    }
    if(type === "error"){
        console.error(getDateTime() + " [ERROR] " + data);
    }
}

function getLastPolledId(){
    let id = fs.readFileSync('lastTag.dat', 'utf-8');
    return id.toString();
}

function setLastPolledId(newID){
    fs.writeFileSync('lastTag.dat',(Number(newID)+1).toString());
}

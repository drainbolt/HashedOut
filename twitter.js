/*
 * Andrew Berger
 * Josh Herman
 * Team Groot
 * Dr. Henley
 * COSC 340
 * twitter.js
 * 
 * This file contains two classes for ease of Twitter access:
 *  twitterRequest
 *  tweet
 */
let $ = require('jquery')
// config has the api keys
let config = require('./config.js')

const remote = require('electron').remote

// #global var tweets: an array of the current tweet objects
// #global var streamLimit: an int to limit the number of streams to
var streamLimit = 100
var tweets = [];

class twitterRequest
{
  constructor()
  {
    var Twitter = require('twitter')
    // Set up the twitter api
    this.client = new Twitter(config.twitterAPIKey);
    // Keep track of the number of read tweets in the current stream
    this.count = 0
    // this.stream will be mutated to this.client.stream
    this.stream = ""
    // this.result will we the mutated to the request result
  }

  /**
   * hashtagSearch
   * @brief   a function to search for a given hashtag
   * @param   completion - a callback function to execute on success
   * @param   t - the search string to be found in the tweets array
   * @param   c - the max count of tweets to be returned
   * @param   l - the language to limit tweets to
   */
  
  hashtagSearch = (t, completion=(event)=>{printResult(event)}, c = streamLimit, l = 'en') => 
  {
      // go ahead and add the '#' if it isn't there 
      if (t[0] != '#'){
        t = '#' + t
      } 

      tweets = []
      //---------------search function code-------------------------------
      // perform the search, and build tweet objects from the results
      this.client.get('search/tweets', {q: t, language: l, count: c}, function(error, t, response){
        // construct a tweet object
        for(var i = 0; i < t.statuses.length; i++){
          /* Data currently being pulled out from the tweet  (more can be added):
              The text of the tweet itself
              The number of favorites that the tweet has
              The retweet count of the tweet
              The unique ID number of the tweet
              The screen_name of the user that tweeted said tweet
          */
          parseTweet(t.statuses[i])
        }       

        // check to see if the search found anything, if not, alert an error
        if (tweets.length == 0){
            const dialogOptions = {
              type: 'error',
              buttons: ['Ok'],
              title: 'Nothing Found',
              message: "The search yielded 0 results. Please check your search and try again.",
            }
            remote.dialog.showMessageBox(dialogOptions)
            return
        }

        completion(tweets)         
      });

  }
  /**
   * hashtagStream
   * @brief   a function to start a stream for a given hashtag
   * @param   completion - a callback function to execute on success
   * @param   t - the search string to start a stream for
   * @param   l - the desired language code
   * This function may or may not be used. It is a useful function either way tho.
   */
  hashtagStream = (t, completion=(event)=>{printResult(event)}, l = 'en') =>
  {
    // go ahead and add the '#' if it isn't there 
    if (t[0] != '#'){
      t = '#' + t
    } 

    tweets = []
    // Access a pipe to subscribe to a stream of tweets
    this.stream = this.client.stream('statuses/filter', {track: '#'+t, language:l});
    this.stream.on('data', function(event) {
      // Just calls the parse tweet function. Here we would have something similar to the search function to store said data
      parseTweet(event)  
      completion(tweets)
    });
    // Handle errors here
    this.stream.on('error', function(error) {
      throw error;
    });
  }
 
}

// this function just prints the results out to the index.html window
const printResult = (result) =>
{
  $("#currentTweet").html("")
  result.forEach(r => {
    $("#currentTweet").append('<p>'+r.text+
        '<br>' + "Favorite Count: " + r.favorited +
        '<br>' + "Retweet Count: " + r.retweets +
        '<br>' + "Screen Name: " + r.screenName +
        '<br>' + "Tweet ID Number: " + r.id + '</p>'
    );
  });
}

 // parseTweet: this function will parse all of the data from the tweet
 const parseTweet = (data) =>
 {
    var count = 0;
   util = require('util');
   //console.log(util.inspect(data));
   //console.log('\n\n');
   let newTweet = new tweet(data.text, data.favorite_count, data.retweet_count, data.id, data.user.screen_name, data.created_at.split(" "))
   tweets.push(newTweet)
   
   count++;
   if (this.stream !== undefined && count == streamLimit)
   {
     this.stream.destroy();
     process.exit();
   }
   
 }

class tweet
{
  constructor(text, favorited = 0, retweets = 0, id = 0, userScreenName = '', date_created = '')
  {
    this.text = text;
    this.favorited = favorited;
    this.retweets = retweets;
    this.id = id;
    this.screenName = userScreenName
    this.creation_date = date_created[0].concat("-",date_created[1],"-", date_created[2])
  }
}
module.exports.twitterRequest = twitterRequest
module.exports.tweet = tweet
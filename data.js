/*
 * Andrew Berger
 * Team Groot
 * Dr. Henley
 * COSC 340
 * data.js
 * 
 * This file will contain objects and methods for saving and loading hashtag data
 */

let $ = require('jquery')

let RETWEET_PRECEDENCE    = 1  // Retweet rates will be multiplied by 1
let LIKES_PRECEDENCE      = 20  // Likes are more rare on Twitter (x20)
let MENTIONS_PRECEDENCE   = 1  // Mentions don't tell us anything atm
let D2_PRECEDENCE         = 10 // Second derivatives say a lot about virality

/**
 * class - hashtag
 * @param name             the name of the hashtag, #name
 * @param recentTweets     an array of tweet objects that mention #name
 * @param retweets         integer, total retweets for the tag
 * @param likes            integer, total likes for the tag
 * @param name             integer, total mentions for the tag
 *
 * The following parameters store the IROC of retweets, 
 * likes, and mentions--calculated using the difference quotient :
 * 
 * f(x + h) - f(x)
 * ---------------   
 *        h
 * 
 * @param drdm             float, the rate that retweets increase wrt mentions
 * @param d2rd2m           float, the rate that drdm increase wrt mentions
 * @param dldm             float, the rate that likes increase wrt mentions
 * @param d2ld2m           float, the rate that d2ld2m increase wrt mentions
 * @param dmdt             float, the rate that mentions increase wrt time (streams only)
 * @param d2md2t           float, the rate that dmdt increase wrt time (streams only)
 */
class hashtag
{
    // Save all tweets and rates of change in popularity to an object
    constructor(name, recentTweets=[], retweets = 0, likes = 0, mentions = 0,
                drdm = 0.0, d2rd2m = 0.0, dldm = 0.0, d2ld2m = 0.0,
                dmdt = 0.0, d2md2t = 0.0)
    {
        this.name = name
        this.recentTweets = recentTweets
        this.retweets = retweets
        this.likes = likes
        this.mentions = mentions
        this.drdm = drdm
        this.d2rd2m = d2rd2m
        this.dldm = dldm
        this.d2ld2m = d2ld2m
        this.dmdt = dmdt
        this.d2md2t = d2md2t
        let d = new Date()
        this.date = d.getTime()
        this.elapsedTime = 0
        // cov stands for coefficient of virality
        this.cov = 1.0
        this.searches = 1
    }
}

/**
  * method: prettyPrintTime
  * @brief prints a formatted time from a unix timestamp
  * @param unixTimestamp - a unix time in milliseconds
  * @return a time formatted like: 18:06:31
  */
let prettyPrintTime = (unixTimestamp) =>
{
        /*
         * The following was pasted from:
         * https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
         */
        // Create a new JavaScript Date object based on the timestamp
        var date = new Date(unixTimestamp);
        // Hours part from the timestamp
        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();
        // Will display time in 10:30:23 format
        /* my edit - make it AM/PM instead of 24 hour */
        let isPM = hours / 12
        return (hours > 12 ? hours % 12 : hours) + ':' + minutes.substr(-2) + ':' 
                + seconds.substr(-2) + (isPM ? " PM" : " AM");
}

 /**
  * method: saveHashtag
  * @brief saves a hashtag class instance to the "hashedOut" cookie
  * @param hashtag - the hashtag to be saved
  * @param completion - a function to call after the API call is complete
  * @param exDays - the number of days the data will last for in the cookie
  */

 let saveHashtag = (hashtag, completion=(success)=>{alert(success ? "The hashtag was saved successfully." : "error");}, exdays = 1) => 
 {
     // Analyze the data for the recent tweets: current hashtag
    if(!calculateRatesForHashtag(hashtag))
    {
        console.log("Cannot calculate the rates for the hashtag. Check to see if it is undefined.")
        return false
    }

    if(hashtag.mentions < 10)
    {
        console.log("The hashtag had less than 10 mentions")
        completion(false)
        return false
    }
    var session = require('electron').remote.session
    var ses = session.fromPartition('persist:name')
    ses.cookies.remove("http://hashedout.com",hashtag.name)
    //ses.cookies.remove("http://hashedout.com","hoData")
    
    // hoData is an array of hashtag names like ["cats","dogs","saltlife",...]
    // each name will subsequently be loaded from the cookies
    var hoData = []
    // if the array hoData is empty or not set, build an empty array with the ht name
    var value = 
    {
        name: "hoData" // the request must have this format to search the cookie.
    }
    ses.cookies.get(value, function(error, cookies) 
    {   
        // Parse the data from the hoData cookie                 
        if(error === null && cookies[0] !== undefined)
        {
            // The parse was successful
            hoData = JSON.parse(cookies[0].value)
            // if the hashtag name is not already in hoData, add the name
            if($.inArray(hashtag.name,hoData) == -1)
            {
                hoData.push(hashtag.name);
                // save the new array
                ses.cookies.set({ 
                    name: "hoData",
                    expirationDate: expiration.getTime(), 
                    value: JSON.stringify(hoData),
                    url:"http://hashedout.com"
                })
            }
            else // the hashtag has been searched before
            {
                // calculate the elapsed time since last search
                let d = new Date()
                hashtag.elapsedTime = d.getTime() - hashtag.date
            }  
        }
        else
        {
            // save the new array
            hoData.push(hashtag.name)
            ses.cookies.set({ 
                name: "hoData",
                expirationDate: expiration.getTime(), 
                value: JSON.stringify(hoData),
                url:"http://hashedout.com"
              })
        }
    })

    var expiration = new Date()
    var hour = expiration.getHours();
    hour = hour + 24 * exdays
    
    let hData = JSON.stringify(
    {
        retweets : hashtag.retweets,
        likes : hashtag.likes,
        mentions : hashtag.mentions,
        drdm : hashtag.drdm,
        d2rd2m : hashtag.d2rd2m,
        dldm : hashtag.dldm,
        d2ld2m : hashtag.d2ld2m,
        dmdt : hashtag.dmdt,
        d2md2t : hashtag.d2md2t,
        createdDate: hashtag.date,
        cov: hashtag.cov,
        searches: hashtag.searches
    })

    expiration.setHours(hour)
    ses.cookies.set({ 
                      name: hashtag.name,
                      expirationDate: expiration.getTime(), 
                      value: hData,
                      url:"http://hashedout.com"
                    }).then(()=>{
                       completion(hoData)
                    }).catch((error)=>
                    {
                        console.error("Error setting cookie: " + error)
                        completion(false)
                    })
}

/**
 * 
 * method: calculateCOV
 * @param h - a hashtag to calculate the cov value for
 * @brief  calculates the coefficient of virality and sets it in the new hashtag 
 */
let calculateCOV = (h) =>
{
    h.cov += LIKES_PRECEDENCE * h.dldm + RETWEET_PRECEDENCE * h.drdm
    h.cov += MENTIONS_PRECEDENCE * h.dmdt + D2_PRECEDENCE * (h.d2rd2m + h.d2md2t + h.d2ld2m)
}

/**
 * method: calculateRatesForHashtag
 * @param h - a hashtag to calculate dydx and d2yd2x values for
 * @return a hashtag full of newly calculated data on success
 *         false if the hashtag is undefined 
 * @brief  calculate the derivatives and values for a hashtag (call only once per search!)
 */
let calculateRatesForHashtag = (h)=>
{
    // reset the coefficient of virality

    if(h === undefined)
        return false
    
    // The hashtag was valid
    h.searches++
    h.cov = 1.0
    // Calculate the diference in mentions, retweets, and likes
    let m = 0.0, r = 0.0, l = 0.0
    // The hashtag has to have at least 10 mentions to reach this code
    h.recentTweets.forEach(tweet => 
    {
        // Get the number of recent mentions and add it on
        m += 1.0
        // Add the number of retweets for each tweet
        r += tweet.retweets
        // Add the number of likes for each tweet
        l += tweet.favorited
    })
    // set dl to be the change in likes
    dl = l - h.likes * 1.0 / h.searches
    dm = m - h.mentions * 1.0 / h.searches
    dr = r - h.retweets * 1.0 / h.searches
    h.mentions += m
    h.retweets += r
    h.likes += l
    // Calculate the IROC for retweets and likes wrt mentions
    let currentDrDm = (dr / dm)
    let currentDlDm = (dl / dm)

    // see how much the ROC changed (IROC(IROC))
    // Calculate dldm (the IROC for likes)
    let dldm = dm != 0.0 ? (currentDlDm - h.dldm) / dm : 0.0
    // Calculate drdm (the IROC for retweets)
    let drdm = dm != 0.0 ? (currentDrDm - h.drdm) / dm : 0.0
    // Calculate d2rd2m (the IROC for drdm)
    h.d2rd2m = dm != 0.0 ? (drdm - h.drdm) / dm : 0.0
    // Calculate d2ld2m (the IROC for dldm)
    h.d2ld2m = dm != 0.0 ? (dldm - h.dldm) / dm : 0.0
    h.dldm = dldm
    h.drdm = drdm
    let currentDmdt = (dm / h.elapsedTime)
    // Calculate dmdt (the IROC for mentions)
    let dmdt = h.elapsedTime != 0 ? (currentDmdt - h.dmdt) / h.elapsedTime : 0.0
    // Calculate d2md2t (the IROC for dmdt)
    h.d2md2t = h.elapsedTime != 0 ? (dmdt - h.dmdt) : 0.0
    h.dmdt = dmdt
    calculateCOV(h)

        return h // with the newly calculated values
}

/**
  * method: loadHashtag
  * @brief loads a hashtag class instance from the "hashedOut" cookie
  * @param hashtagName - the name of the hashtag to be loaded
  */
 let loadHashtag = (hashtagName) => 
 {
    var session = require('electron').remote.session;
    var ses = session.fromPartition('persist:name');
        var value = 
        {
            name: hashtagName // the request must have this format to search the cookie.
        }
        return ses.cookies.get(value, function(error, cookies) 
        {
            // Parse the data from the cookie 
            // the return value is handled where loadHashtag was called
               
            if(error !== null || cookies[0] === undefined)
            {
                return false 
            }
        })
  }

/**
  * method: loadAllHashtags
  * @brief loads all hashtags from the hashedOut cookie and calls completion
  */
let loadAllHashtags = (completion) => 
{
    var session = require('electron').remote.session;
    var ses = session.fromPartition('persist:name');
    var hoData = []
    // if the array hoData is empty or not set, build an empty array with the ht name
    var value = 
    {
        name: "hoData" // the request must have this format to search the cookie.
    }
    ses.cookies.get(value, function(error, cookies) 
    {   
        // Parse the data from the hoData cookie                 
        if(error === null && cookies[0] !== undefined)
        {
            // The parse was successful
            hoData = JSON.parse(cookies[0].value)
            // delete each cookie in hoData
            let all_hashtags = []
            hoData.forEach(hashtagName => 
            {
                loadHashtag(hashtagName).then((v)=>
                {
                    if(v[0]!==undefined)
                    {
                        let hashtagData = JSON.parse(v[0].value)

                        let newHashtag = new hashtag(hashtagName,[], hashtagData.retweets, 
                            hashtagData.likes, hashtagData.mentions, hashtagData.drdm, hashtagData.d2rd2m, hashtagData.dldm, 
                            hashtagData.d2ld2m,hashtagData.dmdt, hashtagData.d2md2t)

                        hashtag.date = hashtagData.createdDate
                        hashtag.cov = hashtagData.cov
                        hashtag.searches = hashtagData.searches
                            
                        all_hashtags.push( newHashtag )

                        completion(all_hashtags)
                    }
                }).catch((e)=>
                {
                    //console.error(e)
                    completion(false)
                    return false
                })
            })
        }
        else
        {
            completion(false)
            return false
        }
    })
}

  module.exports.hashtag = hashtag
  module.exports.saveHashtag = saveHashtag
  module.exports.loadHashtag = loadHashtag
  module.exports.prettyPrintTime = prettyPrintTime
  module.exports.loadAllHashtags = loadAllHashtags
  module.exports.calculateRatesForHashtag = calculateRatesForHashtag
  module.exports.calculateCOV = calculateCOV


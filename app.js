var fs = require('fs')

let $ = require('jquery')

let twitter = require("./twitter.js")

let comp_funcs = require("./tweet_compare.js")

let dataController = require("./data.js")
  
var twitterAccess = new twitter.twitterRequest()

const remote = require('electron').remote

var all_tweets = []

var currentHashtag

var previousHashtag

var all_hashtags = []

var searches = []

$(document).ready(function()
{
    // check and make sure that the servers are up or that the user has an internet connection. If not, alert the user and close the program
    $.ajax({
        url: "https://twitter.com",
        type: "GET",
        success: check_ping_result => {
            // twitter servers are accessable 
        },
        error: error_check =>{
            console.error(error_check)
            // this will be kept as a JS alert and not an electron one. This is because the electron one does not wait to close the window
            alert("Twitter servers could not be reached. Please check your internet connection and try again!")
            window.close(); 
        }
    })
    // load graph data into the viral and trending tabs
    let graphHotness = require("./graphSauce")
    // Look at this graph: https://www.youtube.com/watch?v=sIlNIVXpIns
    let noChad = new dataController.hashtag("Nickelback Sucks")
    // Let Nickelback Sucks be the sentinel value
    $("#viralContent").html( graphHotness.viral( noChad, noChad ) )

    dataController.loadAllHashtags((success) => 
    {
        if(success)
        {
            all_hashtags = success
            fill_hashtags_table()
            // load the trending graph into the trending tab
            $("#trendingContent").html(graphHotness.trending(success));
        }
    })
    // add an event handler to search based on clicking of the search button
    $("#searchButton").click(function() {
        let searchText = document.getElementById('searchBar').value
        // now perform the search
        searches.push(searchText)
        search_hashtag(searchText)
    })

    $("#export_button").click(function(){
        export_to_csv();
    })

    // add an event listener for the searchBar for an enter press
    $("#searchBar").keydown(function(event) {
        // check to see if the user pressed enter
        if (event.keyCode === 13){
            searches.push(this.value)
            search_hashtag(this.value)
        }
    })

    /* Button Click Handlers */
    $("#clearHistoryButton").click(clearHistory)

}) // end document loaded

/**
 * @brief - this function exports the table to a CSV file/location of the user's choosing
 */
function export_to_csv(){
    // check to make sure they've searched something before
    if(all_tweets.length == 0){
        const dialogOptions = {
            type: 'error',
            buttons: ['Ok'],
            title: 'No hashtags',
            message: 'Please search for a hashtag before exporting!',
        }
        remote.dialog.showMessageBox(dialogOptions)
        return
    }
    
    // get the table
    var $table = $("#tweet_table")
    var table2csv = require('table2csv')

    // translate the table data to a CSV file
    var csv = $table.table2csv({
        delivery: 'value',
    })

    // get the data of everything
    var data = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csv)

    // go ahead and set the data, and download it all.
    $("#link_id").href = data
    $("#link_id").style = "display:none"
    $("#link_id").download = "table.csv"
}

/**
 * @brief - this function performs a twitter search. It also stores the data in a cookie
 * @param {*} searchText  - the text to search for 
 */
function search_hashtag(searchText){
    // check to make sure a value was actually input
    if(searchText.length === 0){
        const dialogOptions = {
            type: 'error',
            buttons: ['Ok'],
            title: 'No empty searches allowed',
            message: 'No empty searches allowed',
        }
        remote.dialog.showMessageBox(dialogOptions)
        return
    }

    // make sure the user does not put in any
    if(searchText.includes(' ')){
        const dialogOptions = {
            type: 'error',
            buttons: ['Ok'],
            title: 'No whitespace allowed',
            message: 'No whitespace is allowed in your searches. Please search again',
        }
        remote.dialog.showMessageBox(dialogOptions)
        return
    }
    let graphHotness = require("./graphSauce");
    twitterAccess.hashtagSearch(searchText,(t)=>
        {
            all_tweets = t
            fill_tweet_table(t)
            // Perform a search, upon completion save the hashtag data
            // upon the hashtag save's completion, load all hashtags into all_hashtags
            // load what the user is searching for into the currentHashtag
            previousHashtag = currentHashtag;
            currentHashtag = new dataController.hashtag(searchText)
            currentHashtag.recentTweets=t
            dataController.saveHashtag(currentHashtag,(success)=>
            {
                if(success !== false)
                {
                    // success is now an array of saved hashtag names
                    // loadHashtag will return the loaded hashtag
                    // push the loaded hashtag onto all_hashtags
                    var indexOfHashtag = 0
                    // delete the old hashtag data from all_hashtags but save the date
                    var oldHashtagDate

                    for(; indexOfHashtag < all_hashtags.length; indexOfHashtag++)
                    {
                        if ( all_hashtags[indexOfHashtag] !=undefined && all_hashtags[indexOfHashtag].name == currentHashtag.name )
                        {
                            oldHashtagDate = all_hashtags[indexOfHashtag].date
                            delete all_hashtags[indexOfHashtag]
                            currentHashtag.date = oldHashtagDate
                            // calculate the elapsed time since last search
                            let d = new Date()
                            currentHashtag.elapsedTime = d.getTime() - currentHashtag.date
                            break;
                        }
                    }
                    all_hashtags.push(currentHashtag)

                    success.forEach((htName)=>
                    {
                        // load the hashtag, examine the promise. if it is successful,
                        // add the hashtag to the all_hashtags array
                        dataController.loadHashtag(htName).then((v)=>
                        {
                            if(v[0]!==undefined)
                            {
                                let hashtagData = JSON.parse(v[0].value)
                                let hashtag = new dataController.hashtag(htName,[], hashtagData.retweets, 
                                    hashtagData.likes, hashtagData.mentions, hashtagData.drdm, hashtagData.d2rd2m, hashtagData.dldm, 
                                    hashtagData.d2ld2m,hashtagData.dmdt, hashtagData.d2md2t)
                                
                                hashtag.date = hashtagData.createdDate
                                hashtag.cov = hashtagData.cov
                                hashtag.searches = hashtagData.searches
                                indexOfHashtag = 0
                                // delete the old hashtag, but store the date
                                for(; indexOfHashtag < all_hashtags.length; indexOfHashtag++)
                                {
                                    if ( all_hashtags[indexOfHashtag] !=undefined && all_hashtags[indexOfHashtag].name == hashtag.name )
                                    {
                                        oldHashtagDate = all_hashtags[indexOfHashtag].date
                                        delete all_hashtags[indexOfHashtag]
                                        hashtag.date = oldHashtagDate
                                        // calculate the elapsed time since last search
                                        let d = new Date()
                                        hashtag.elapsedTime = d.getTime() - hashtag.date
                                        break;
                                    }
                                }
                                all_hashtags.push( hashtag )
                            }
                        }).catch((e)=>{console.error(e)})
                    })

                    // all_hashtags is now loaded
                    // load the trending and viral graphs
                    $("#trendingContent").html(graphHotness.trending(all_hashtags))

                    let s

                    if( previousHashtag === undefined )
                        s = currentHashtag
                    else
                    {
                        s = previousHashtag
                        dataController.calculateRatesForHashtag(s)
                    }

                    dataController.calculateRatesForHashtag(currentHashtag)

                    $("#viralContent").html(graphHotness.viral( currentHashtag, s))

                    fill_hashtags_table()
                }
                else
                    console.log("The hashtag \"" + currentHashtag.name + "\" could not be loaded")
            }) // end save hashtag
        }) // end hashtag search
}
/**
 * @brief a function that will update the table data
 * @param tweets_array: an array of tweets to display to the table 
 * @param table_id: the ID of the table to be accessed in the HTML file
 * @param th_class: this parameter is used for give the headers of the table a class name. Used for sorting/css purposes. Default value is 'header-class'
 */
function fill_tweet_table(tweets_array, table_id = "tweet_table"){

    var row_index = 1;
    // clear the table
    $('#' + table_id).html("");

    // re-add the header rows
    $('#' + table_id).append(
        '<tr>' +
        '<th id="row_col"></th>' + 
        '<th id="text_col">Text</th>' +
        '<th id="screen_col">Screen Name</th>' + 
        '<th id="likes_col"><a style="text-decoration:none;">Likes</a></th>' +
        '<th id="retweets_col"><a style="text-decoration:none;">Retweets</a></th>' +
        '<th id="date_col">Date</th>' + 
        '</tr>'
    );
    
    // connect the sorting to the table headers, although only sort if they click on likes or retweets
    $('#' + table_id + ' th').click(function() {
        // sort based on likes (stored as favorited in our class, because Twitter does it that way)
        if(this.innerText === 'Likes'){
            sort_tweet_array(all_tweets, 'favorites')
            //sort_tweet_array(tweets_array, sort_style, table_name = "tweet_table", th_class = "header-class"){
        }
        // sort based on retweets
        if(this.innerText === 'Retweets'){
            sort_tweet_array(all_tweets, 'retweets')
        }
    })

    // now go through and append tweet data for each tweet.
    tweets_array.forEach(r => {
        $('#' + table_id).append(
            '<tr>' +
            '<td class="row_col">' + row_index + '</td>' + 
            '<td class="text_col">' + r.text + '</td>' + 
            '<td class="screen_col">' + r.screenName + '</td>' +
            '<td class="likes_col">' + r.favorited + '</td>' + 
            '<td class="retweets_col">' + r.retweets + '</td>' + 
            '<td class="date_col">' + r.creation_date + '</td>' +
            '</tr>'
        );
        row_index++;
    });
}

/**
 * @brief a function that will update the table data
 * @param hashtags_array: an array of tweets to display to the table 
 * @param table_id: the ID of the table to be accessed in the HTML file
 */
function fill_hashtags_table(hashtags_array = all_hashtags, table_id = "hashtags_table")
{
    // clear the table
    $('#' + table_id).html("");

    // re-add the header rows
    $('#' + table_id).append(
        '<tr><th>Hashtag Name</th><th>Likes</th><th>Retweets</th><th>Mentions</th><th>Date</th></tr>'
    );
    
    // now go through and append tweet data for each tweet.
    hashtags_array.forEach(h => {
        let d = new Date(h.date)
        let formattedDate = d.toDateString() + "<br><br>" + dataController.prettyPrintTime( h.date )
        $('#' + table_id).append(
            '<tr>' +
            '<td>' + h.name + '</td>' + 
            '<td>' + h.likes + '</td>' + 
            '<td>' + h.retweets + '</td>' +
            '<td>' + h.mentions + '</td>' + 
            '<td>' + formattedDate + '</td>' +
            '</tr><tr><td colspan="5" id="htRates">'+
            '<div style="float:left; padding-left:5%;">dl/dm (change in likes/mentions) : ' + h.dldm.toFixed(3) + '<br>' +
            'd2l/d2m (change in dl/dm) : ' + h.d2ld2m.toFixed(3) + '</div>' +
            '<div style="float:right; padding-right:5%;">dr/dm (change in retweets/mentions) : ' + h.drdm.toFixed(3) + '<br>' +
            'd2r/d2m (change in dr/dm) : ' + h.d2rd2m.toFixed(3) + '</div>' +
            '</td></tr>'
        );
    });
}

/**
 * @brief - this function will sort the array of tweets given, and then update the table given as well.
 * @param {*} tweets_array - the array of tweets to sort - Pre-condition: Make sure that the tweets_array actually has data in it
 * @param {*} sort_style - How to sort by. Currently either favorites(likes) or retweets
 * @param {*} table_name - the table that will be updated with the sorted tweets
 * @param th_class: this parameter is used for give the headers of the table a class name. Used for sorting/css purposes. Default value is 'header-class'
 */
function sort_tweet_array(tweets_array, sort_style, table_name = "tweet_table"){
    // sort by favorites
    if (sort_style === "favorites"){
        // update how to compare the tweets
        if(comp_funcs.comp_mod.favorites_descend === false){
            comp_funcs.comp_mod.favorites_descend = true;
        } else {
            comp_funcs.comp_mod.favorites_descend = false;
        }

        tweets_array.sort(comp_funcs.favorite_comp)
    }

    // sort by retweets
    else if (sort_style === "retweets"){
        // update how to compare the tweets
        if(comp_funcs.comp_mod.retweets_descend === false){
            comp_funcs.comp_mod.retweets_descend = true
        } else {
            comp_funcs.comp_mod.retweets_descend = false
        }
        tweets_array.sort(comp_funcs.retweet_comp)
    }

    fill_tweet_table(tweets_array, table_name = table_name)
}

/**
 * clearHistory
 * @brief - clear all_hashtags, remove cookies, clear the ht table
 */

 let clearHistory = () =>
 {
    var session = require('electron').remote.session
    var ses = session.fromPartition('persist:name')
    var hoData = []
    // if the array hoData is empty or not set, build an empty array with the ht name
    var value = 
    {
        name: "hoData" // the request must have this format to search the cookie.
    }
    ses.cookies.get(value, function(error, cookies) 
    {   
        if(error === null && cookies[0] !== undefined)
        {
            // The parse was successful
            hoData = JSON.parse(cookies[0].value)
            // delete each cookie in hoData
            hoData.forEach(hashtagName => 
            {
                ses.cookies.remove("http://hashedout.com",hashtagName)
            })
        }
        else
        {
            return false
        }
    })
    $("#hashtags_table").html("")
    ses.cookies.remove("http://hashedout.com","hoData")
    all_hashtags = []
 }

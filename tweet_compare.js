/* This file is just compararion functions to be used for sorting tweet arrays
*/

// variables to allow the user to decide which order to sort everything by
compare_module = {
  retweets_descend: true,
  favorites_descend: true
}

  /**
   * 
   * @brief - this functioned is used in the sorting function of an array of tweets. It compares the two tweet by retweets. It returns whether the first one is larger or not. 
   * @param t1 - a tweet object 
   * @param t2 - a tweet object 
   */
  function compare_tweets_retweets(t1, t2){
    if (compare_module.retweets_descend === false){
      return (t2.retweets - t1.retweets);
    } else {
      return (t1.retweets - t2.retweets);
    }
    
}

/**
 * 
 * @brief - this functioned is used in the sorting function of an array of tweets. It compares the two tweet by favorites. It returns whether the first one is larger or not. 
 * @param t1 - a tweet object 
 * @param t2 - a tweet object 
 */
function compare_tweets_favorites(t1, t2){
    if (compare_module.favorites_descend === false){
      return (t2.favorited - t1.favorited);
    } else {
      return (t1.favorited - t2.favorited);
    }
    
}

module.exports.favorite_comp = compare_tweets_favorites
module.exports.retweet_comp = compare_tweets_retweets
module.exports.comp_mod = compare_module
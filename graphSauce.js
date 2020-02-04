/*
 * Andrew Berger
 * Team Groot
 * Dr. Henley
 * COSC 340
 * graphSauce.js
 * 
 * This file provide simple methods for loading bootstrap 
 * graph data into tabs (viral and trending) 
 * 
 */
let $ = require('jquery')

let dataController = require("./data")
/**
 * name:    generateViralData
 * @brief   generates the data and label array for the viral graph
 * @returns an array of data depending on datatype
 * @see     viral
 * @param {data.hashtag} h - a hashtag struct to analyze
 * @param {string} dataType - "likes", "retweets" if data is desired, "labels" for x-axis labels
 * @param {int} xLabelCount - Delta X, units to divide the x axis by
 */
let generateViralData = ( h, dataType = "retweets", xLabelCount = 10 ) =>
{
    let data = []
    // copy the hashtag to avoid changing the original
    switch(dataType)
    {
        case "covScore":
            data[0] = h.retweets / 1000.0
            for(var i = 1; i <= (xLabelCount*10); i++)
            {
                if(i % xLabelCount == 0)
                    data[i/xLabelCount] = (h.retweets + h.retweets * h.cov)/1000.0
                
            dataController.calculateCOV(h)
            }
            break
        case "likes":
            data[0] = h.likes
            for(var i = 1; i <= (xLabelCount*10); i++)
            {
                if(i % xLabelCount == 0)
                    data[i/xLabelCount] = h.likes + h.likes * h.dldm
                
                h.dldm += h.d2ld2m * h.dldm
            }
            break
        case "retweets":
            data[0] = h.retweets

            for(var i = 1; i <= (xLabelCount); i++)
            {
                //if(i % xLabelCount == 0)
                data[i] = (h.retweets + h.retweets * (h.cov / 50.0))
                dataController.calculateCOV(h)

            }
            break
        case "labels": // Generate labels to 
            let currentTime = new Date()
            data[0] = dataController.prettyPrintTime(currentTime)
            for(var i = 1; i <= (xLabelCount*10); i++)
            {
                currentTime.setTime(currentTime.getTime() + h.elapsedTime)
                if(i % xLabelCount == 0)
                    data[i/xLabelCount] = dataController.prettyPrintTime(currentTime)
            }

            if( i > 1 && data[0] == data[1] )
            {
                i = 0;
                data.forEach((time)=>
                {
                    data[i] = "N/A"
                    i++;
                })
            }

            break

    }
    
        return data
        
}
/**
 * name:    generateTrendingData
 * @brief   generates the data and label array for the trending graph
 * @returns an array of data depending on datatype
 * @see     trending
 * @param {[data.hashtag]} hashtags - a hashtag struct to analyze
 * @param {string} dataType - "retweets" retweets data is desired, "likes" for likes data
 */
let generateTrendingData = (hashtags, dataType) =>
{
    let result = []

    hashtags.forEach(hashtag => 
    {
        // store the values in an array to be graphed
        result.push((dataType == "retweets" ? (hashtag.retweets/100) : dataType == "likes" ? hashtag.likes : hashtag.name))
    })

        return result
}

/**
 * name:    viral
 * @param   {data.hashtag} hashtag1 - a hashtag to analyze
 * @param   {data.hashtag} hashtag2 - another hashtag to analyze with hashtag1
 * @brief   sets the viralContent element with graph content
 * @see     generateViralData the data controller for viral(hashtag)
 */

let viral = ( hashtag1, hashtag2 ) =>
{
    if( hashtag1.name == "Nickelback Sucks" || hashtag1.name == hashtag2.name ) // initial state sentinel value
    {
        $("#viralContent").html( `<h3>Projected Retweets</h3>
                                  <br>
                                  <div class="viralBox" id="enterTwo" >
                                    <p>Enter two different hashtags into the search bar to see their projected retweets over time!</p>
                                  </div>
                                 `)
        
        // The comparison won't be able to work
        if( hashtag1.name == hashtag2.name && hashtag1.name != "Nickelback Sucks" )
        {
            $("#viralContent").html
            (   
                `<h3>Projected Retweets</h3>
                 <br>
                 <div class="viralBox" id="oneTagWarning" >
                     <p>You entered: ` + hashtag1.name + `</p>
                     <p>Please enter another hashtag to compare it to.</p>
                 </div>
                `
            )
        }
           return // Don't show the graph
    }
    else
        $("#viralContent").html( '<h3>Projected Retweets of '+ hashtag1.name +' vs. ' + hashtag2.name + '</h3>' )
    
    $("#viralContent").append( '<canvas class="my-4 w-100" id="viralLineGraph" width="900" height="380"></canvas>')
    let ht1Color = "rgba(255, 20, 220, .2)"
    let ht1BorderColor = "rgba(220, 20, 0, .7)"
    let ht2Color = "rgba(24, 114, 223, .2)"
    let ht2BorderColor = "rgba(24, 114, 223, .7)"

    
    $("#viralContent").append( `<h4 style="margin-top:30px;">Performing consecutive searches will allow for a longer projection on the time axis.</h4>
                                <h5>N/A means that more searches need to be done for the current hashtag to accurately project retweets at a given time.</h5>
                                ` );
                                
    let labels = generateViralData(hashtag1, "labels")
    var ctxL = document.getElementById("viralLineGraph").getContext('2d');

    var myChart = new Chart(ctxL, 
    {
        type: 'line',
        data: 
        {
            labels: labels,
            datasets: 
            [{
                label: "Projected Retweets mentioning " + hashtag1.name,
                data: generateViralData(hashtag1),
                backgroundColor: [ht1Color,],
                borderColor: [ht1BorderColor,],
                borderWidth: 1,
                hoverBackgroundColor: [ht1Color, ]
            },
            {
                label: "Projected Retweets mentioning " + hashtag2.name,
                data: generateViralData(hashtag2),
                backgroundColor: ht2Color,
                borderColor: [ht2BorderColor,],
                borderWidth: 1,
                hoverBackgroundColor: [ht2Color,]
            }]
        },
        options: 
        {
            responsive: true,
            scales: {
                xAxes: [{
                    barPercentage: 0.8,
                    categoryPercentage: 0.8
                }],
                yAxes: [{
                    ticks: {
                    beginAtZero: false
                    }
                }]
            },
            legend: 
            {
                display: true,
                labels: {
                    color: 'rgb(255, 99, 132)'
                }
            }
        }
        
    })
    $("#viralLineGraph").show()
    
}
let randomRGBA = (type, index) =>
{
    // possible colors for retweets
    retweets_colors = [
        "rgba(222,43,43,0.3)",
        "rgba(43,43,222,0.3)",
        "rgba(43,162,222,0.3)",
        "rgba(43,222,162,0.3)",
        "rgba(43,222,43,0.3)",
        "rgba(222,162,43,0.3)",
    ]
    // possible colors for likes
    likes_colors = [
        "rgba(168,92,92,0.3)",
        "rgba(143,92,168,0.3)",
        "rgba(92,92,168,0.3)",
        "rgba(92,168,143,0.3)",
        "rgba(92,168,92,0.3)",
        "rgba(143,168,92,0.3)",
    ]

    // return the right one
    if (type === 'retweets'){
        return retweets_colors[index]
    } else {
        return likes_colors[index]
    }
}
let trending = hashtags =>
{
    colors = []
    hashtags.forEach(hashtag => 
    {
        // get a color for retweets, choose a random number between 0 and 5
        colors.push(randomRGBA('retweets', Math.floor((Math.random() * 6))))    
    });
    colors2 = []
    hashtags.forEach(hashtag => 
    {
        // get a color for likes, choose a random number between 0 and 5
        colors2.push(randomRGBA('likes', Math.floor((Math.random() * 6))))
    });
    let names = generateTrendingData(hashtags,"names")
    // Graphs
    // eslint-disable-next-line no-unused-vars
    $("#trendingContent").html( '<h3>Trends in Recently Searched Hashtags</h3>' )
    $("#trendingContent").append( '<canvas class="my-4 w-100" id="trendingBarGraph" width="900" height="380"></canvas>')
    generateTrendingData(hashtags)
    var myChart = new Chart($("#trendingBarGraph"), 
    {
        type: 'bar',
        data: 
        {
            labels: generateTrendingData(hashtags, "names"),
            datasets: 
            [{
                label: "Retweets (by 100)",
                data: generateTrendingData(hashtags, "retweets"),
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
                hoverBackgroundColor: "lightgrey"
                
            },
            {
                label: "Likes",
                data: generateTrendingData(hashtags, "likes"),
                backgroundColor: colors2,
                borderColor: colors2,
                borderWidth: 1,
                hoverBackgroundColor: "lightgrey"
            }]
        },
        options: 
        {
            scales: 
            {
                yAxes:
                [{
                    ticks: 
                    {
                        beginAtZero: true
                    }
                }]
            },
            legend: 
            {
                display: true,
                labels: {
                    color: 'rgb(255, 99, 132)'
                }
            }
        }
    })
    $("#trendingBarGraph").show()
    
}
module.exports.viral = viral
module.exports.trending = trending
module.exports.randomRGBA = randomRGBA
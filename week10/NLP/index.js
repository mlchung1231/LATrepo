'use strict';
const line = require('@line/bot-sdk'),
      express = require('express'),
      axios = require('axios'),
      configGet = require('config');
const {TextAnalyticsClient, AzureKeyCredential} = require("@azure/ai-text-analytics");

//Line config
const configLine = {
  channelAccessToken:configGet.get("CHANNEL_ACCESS_TOKEN"),
  channelSecret:configGet.get("CHANNEL_SECRET")
};

//Azure Text Sentiment
const endpoint = configGet.get("ENDPOINT");
const apiKey = configGet.get("TEXT_ANALYTICS_API_KEY");

const client = new line.Client(configLine);
const app = express();

const port = process.env.PORT || process.env.port || 3001;

app.listen(port, ()=>{
  console.log(`listening on ${port}`);
   
});

async function MS_TextSentimentAnalysis(thisEvent){
    console.log("[MS_TextSentimentAnalysis] in");
    const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
    let documents = [];
    documents.push(thisEvent.message.text);
    // documents.push("我覺得櫃檯人員很親切");
    // documents.push("熱水都不熱，爛死了，很生氣！");
    // documents.push("房間陳設一般般");
    const results = await analyticsClient.analyzeSentiment(documents,'zh-Hant',{
      includeOpinionMining:true
    });
    console.log("[results] ", JSON.stringify(results));
    //Save to JSON Server
    let newData = {
      "sentiment": results[0].sentiment,
      "confidenceScore": results[0].confidenceScores[results[0].sentiment],
      "opinionText":""
    };

    if(results[0].sentences[0].opinions.length!=0){
      newData.opinionText = results[0].sentences[0].opinions[0].target.text;
    }

    let axios_add_data = {
      method:"post",
      url:"https://202305100416tryewrsadtry.azurewebsites.net/reviews",
      headers:{
        "content-type":"application/json"
      },
      data:newData
    };

    axios(axios_add_data)
    .then(function(response){
      console.log(JSON.stringify(response.data));
    })
    .catch(function(){
      console.log("Error!!");
    });

    //-----------更改區域-----------
    //宣告變數
    var sentiment = results[0].sentiment
    var score = results[0].confidenceScores[results[0].sentiment]
    var object = newData.opinionText
    var text1,text2
    //判斷主詞
    if(object==''){
      object = '整體'
    }
    
    //判斷正向 負向 中立
    if (results[0].sentiment=='positive'){
      text1 = '很高興'
      sentiment = '正向'
      text2 = '繼續保持'
      
    }
    else if(results[0].sentiment=='negative'){
      text1 = '很抱歉'
      sentiment = '負向'
      text2 = '立即改善'
    }
    else{
      text1 = '不好意思'
      sentiment = '中立'
      text2 = '持續改善'
    }

    const echo = {
      type: 'text',
      text: '感謝您提供寶貴的意見，'+text1+'讓您對'+object+'給出'+sentiment+'指數為'+score+'的評價，我們會'+text2+'，歡迎您再度光臨'
    };
    //-------------------------------
    return client.replyMessage(thisEvent.replyToken, echo);

}

app.post('/callback', line.middleware(configLine),(req, res)=>{
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result)=>res.json(result))
    .catch((err)=>{
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event){
  if(event.type !== 'message' || event.message.type !== 'text'){
    return Promise.resolve(null);
  }

  MS_TextSentimentAnalysis(event)
    .catch((err) => {
      console.error("Error:", err);
    }); 
}

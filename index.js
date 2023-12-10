import { OpenAI } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import deck from "./deck.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({
  organization: process.env.OPEN_AI_ORG,
    apiKey: process.env.OPEN_AI_KEY
});

function formatCardName(name) {
    let periodIdx = name.indexOf('.');
    if (periodIdx < 0) {
        return name;
    }

    return name.substr(periodIdx + 2);
}

function validRequest(request){
    let req = request.body;

    if (!Array.isArray(req)){
        return false;
    }
    if (req.length != 3){
        return false;
    }
    
    for (let card of req){
        
        let name = card.name;
        let foundName = false;
        for (let c of deck){
            
            if (c.name === name){
                foundName = true;
                break;
            }
        }
        if (!foundName){
          return false;
        }
    }
    return true;
}
  

app.post("/", async (request, response) => {
    
    if (!validRequest(request)){
        response.json({
            output: "Request improperly formatted"
        });
        return;
    }
    
    let cards = request.body;
    let promptString = "Create a tarot reading in verse from the following spread: Past=" + formatCardName(cards[0].name) + (cards[0].inverted ? " inverted" : "")
                    + "; Present=" + formatCardName(cards[1].name) + (cards[1].inverted ? " inverted" : "")
                    + "; Future=" + formatCardName(cards[2].name) + (cards[2].inverted ? " inverted" : "");

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
          role: "user",
          content: promptString 
      }
    ],
  });

  response.json({
    output: result.choices[0].message,
  });

});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/correct", async (req, res) => {

    const userText = req.body.text;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional writing assistant. Correct grammar, improve clarity, and make text more natural."
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({
            result: response.data.choices[0].message.content
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "AI request failed" });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenAI {
    roles = {
        ASSISTANT: "assistant",
        USER: "user",
        SYSTEM: "system",
    };
    // constructor(apiKey) {
    //     const configuration = new Configuration({
    //         apiKey: process.env.OPENAI_API_KEY,
    //     });
    //     this.openai = new OpenAIApi(configuration);
    // }
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }
    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                // Массив от одной message
                // Каждое сообщение содержит 3 параметра (роль (enum, прнимающий в себя 3 значения - system (то, что не попадает в чат, но задает контекст, в котором должен вести себя бот), user (пользователь, который нам пишет), assistant (ответ gpt-чата)), контент(текст), имя(если это multy-user chat))
                messages,
            });
            // В данном объекте хранится итоговое сообщение, которое нам нужно
            return response.data.choices[0].message;
        } catch (e) {
            console.log(`Error while gpt chat`, e.message);
        }
    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(
                createReadStream(filepath),
                "whisper-1"
            );
            return response.data.text;
        } catch (e) {
            console.log(`Error while transcription`, e.message);
        }
    }
}

export const openai = new OpenAI(config.get("OPENAI_API_KEY"));

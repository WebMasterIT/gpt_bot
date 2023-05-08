// зависимости:
// npm init -y
// npm i -D nodemon cross env
// npm i telegraf config
// npm i axios fluent-ffmpeg @ffmpeg-installer/ffmpeg

// npm i openai

import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { code } from "telegraf/format";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

console.log(config.get("TEST_ENV"));

const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

// Без сессии контекст не сохраняется и создается заного, т.е каждое сообщение к боту как новый чат. Чтобы контекст запоминался импортируем session из Telegraf.

// Использование сессии
bot.use(session());

// Команда позволяющая создавать новый контекст (беседу). В случае если она не выбрана ведется прежний диалог.
bot.command("new", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("Жду вашего голосового или текстового сообщения");
});

bot.command("start", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("Жду вашего голосового или текстового сообщения");
});

// Общение с ботом через голосовые сообщения
bot.on(message("voice"), async (ctx) => {
    // В случае если сессия не определилась, задаем значение INITIAL_SESSION. Оператор применится, если session будет undefined или null
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("Сообщение принял. Жду ответ от сервера... "));
        // с помощью getFileLink получаем ссылку на голосовую запись, перейдя по которой она автоматически скачивается файл в формате ogg
        // На самом деле link это объект url, одним из свойств которого является href (ссылка на файл) - link.href
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        // Id человека взаимодействующего с ботом. Так как с ботом будет взаимодействовать не один человек, нужно будет как-то различать файлы (по id пользователя)
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openai.transcription(mp3Path);

        await ctx.reply(code(`Ваш запрос: ${text}`));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: text,
        });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(response.content);
    } catch (e) {
        console.log(`Error while voice message`, e.message);
    }
});

bot.on(message("text"), async (ctx) => {
    // В случае если сессия не определилась, задаем значение INITIAL_SESSION. Оператор применится, если session будет undefined или null
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("Сообщение принял. Жду ответ от сервера... "));

        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text,
        });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content,
        });

        await ctx.reply(response.content);
    } catch (e) {
        console.log(`Error while voice message`, e.message);
    }
});

bot.launch();

// Алгоритм
// Когда отправляем голосовое сообщение, то получаем в ответ набор данных: количество секунд, формат, id, размер файла.
// {
//     "duration": 2,
//     "mime_type": "audio/ogg",
//     "file_id": "AwACAgIAAxkBAAMWZE40zBM3KrM5lFPq3KbFoImkt0wAAoIpAAKs9XBKDF9EjGEestcvBA",
//     "file_unique_id": "AgADgikAAqz1cEo",
//     "file_size": 6789
//   }

// Для того, чтобы общаться голосом с gpt необходимо голосовое сообщение перевести в текст. Этот функционал есть у OpenAI. Но у него есть ограничения - файл должен быть размером не более 25Мб, а также не поддерживается формат ogg, в котором как раз сохраняются голосовые сообщения в телеграмм. Поэтому необходимо конвектировать mp3 в ogg, а затем уже отправить в алгоритм "speech to text".
// Для того, чтобы сформировать ogg

// Остановка бота
process.once("SIGINT", () => bot.stop("SIGINT"));
// Справка -SIGINT (от англ. signal и interrupt — прервать) — сигнал, применяемый в POSIX-системах для остановки процесса пользователем с терминала.
process.once("SIGTERM", () => bot.stop("SIGTERM"));
// SIGTERM (от англ. signal и terminate — завершить) — сигнал, применяемый в POSIX-системах для запроса завершения процесса.

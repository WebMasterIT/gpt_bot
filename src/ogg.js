import axios from "axios";
import { createWriteStream } from "fs";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { removeFile } from "./utils.js";

// текущая папка в которой находится файл
// это нужно для того, чтобы в методе create получить oggPath
const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    // input - oggpath, output - название выходного файла
    toMp3(input, output) {
        try {
            // получаем путь до папки voices
            const outputPath = resolve(dirname(input), `${output}.mp3`);
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption("-t 30")
                    .output(outputPath)
                    .on("end", () => {
                        removeFile(input);
                        resolve(outputPath);
                    })
                    .on("error", (err) => reject(err.message))
                    .run();
            });
        } catch (e) {
            console.log(`Error while creating mp3`, e.message);
        }
    }

    // в качестве параметров передаем ссылкуи и название файла, в который все нужно будет сохранить
    async create(url, filename) {
        try {
            const oggPath = resolve(__dirname, "../voices/", `${filename}.ogg`);
            // responseType: "stream" значит, что файл скачивается как стрим (поток) и попадает в response
            const response = await axios({
                method: "get",
                url,
                responseType: "stream",
            });
            return new Promise((resolve) => {
                const stream = createWriteStream(oggPath);
                response.data.pipe(stream);
                stream.on("finish", () => resolve(oggPath));
            });
        } catch (e) {
            console.log(`Error while creating ogg`, e.message);
        }
    }
}

export const ogg = new OggConverter();

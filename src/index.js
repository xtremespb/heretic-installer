import axios from "axios";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import commandLineArgs from "command-line-args";
import unzipParse from "./unzip/parser-stream";
import Color from "./color";

const zipBall = "http://github.com/xtremespb/heretic/zipball/master/";
const color = new Color();
let useColor = true;

const getOptions = () => {
    let options;
    try {
        options = commandLineArgs([{
            name: "dir",
            type: String,
        }, {
            name: "no-color",
            type: Boolean,
        }]);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e.message);
        process.exit(1);
    }
    return options;
};

const extractArchive = async (data, dirPath) => new Promise((resolve, reject) => {
    data.pipe(unzipParse())
        .on("entry", (entry) => {
            const {
                type,
                path: entryPath,
            } = entry;
            const entryPathParsed = entryPath.replace(/xtremespb-heretic-[a-z0-9]+\//, "");
            if (type === "Directory") {
                fs.ensureDirSync(path.join(dirPath, entryPathParsed));
                entry.autodrain();
            } else {
                const entryDirName = path.dirname(entryPathParsed);
                fs.ensureDirSync(path.join(dirPath, entryDirName));
                const entryFileName = path.basename(entryPathParsed);
                entry.pipe(fs.createWriteStream(path.join(dirPath, entryDirName, entryFileName)));
            }
        })
        .on("close", () => resolve())
        .on("reject", e => reject(e));
});

const printLogo = () => {
    if (useColor) {
        // eslint-disable-next-line no-console
        console.log(`${color.get("                 ", ["bgGreen"])}\n${color.get("  H E R E T I C  ", ["bgGreen", "whiteBright"])}\n${color.get("                 ", ["bgGreen"])}\n`);
    } else {
        // eslint-disable-next-line no-console
        console.log("╔═════════════════╗\n║                 ║\n║  H E R E T I C  ║\n║                 ║\n╚═════════════════╝\n");
    }
};

const log = (message, colorData) => {
    if (useColor) {
        // eslint-disable-next-line no-console
        console.log(color.get(message, colorData ? [colorData] : []));
    } else {
        // eslint-disable-next-line no-console
        console.log(message);
    }
};

(async () => {
    const options = getOptions();
    if (options["no-color"]) {
        useColor = false;
    }
    printLogo();
    const spinner = ora();
    const messageDownloading = "Downloading archive headers...";
    if (useColor) {
        spinner.text = messageDownloading;
        spinner.start();
    } else {
        log(messageDownloading);
    }
    const dirPath = options.dir ? path.resolve(options.dir) : path.resolve(__dirname);
    await fs.ensureDir(dirPath);
    try {
        const {
            data,
        } = await axios({
            method: "get",
            url: zipBall,
            responseType: "stream",
        });
        const messageExtracting = "Downloading and extracting Heretic...";
        if (useColor) {
            spinner.text = messageExtracting;
        } else {
            log(messageExtracting);
        }
        await extractArchive(data, dirPath);
        if (useColor) {
            spinner.stop();
        }
        log("All done.", "greenBright");
        process.exit(0);
    } catch (e) {
        if (useColor) {
            spinner.stop();
        }
        log(e.message, "redBright");
        process.exit(1);
    }
})();

const fs = require("fs-extra");
const winston = require("winston");
const { format, transports } = require("winston");
const ProgressBar = require("progress");
const ora = require("ora");

const logger = winston.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf((info) => `|${info.timestamp}| ${info.level} [${info.label}]: ${info.message}`)
      ),
    }),
  ],
});

let reportData = {};
let index;

const milToSec = (t) => t / 1000;
const convertBytes = (bytes) => bytes / (1000 ^ index);
const getTotalBundleSize = () => reportData.srcInfo.size + reportData.modulesInfo.size;
const lerp = (a, b) => a + (b - a) * 0.1;

async function getAllFiles(dirPath, allFiles = []) {
  files = await fs.readdir(dirPath);

  files.forEach((filename) => {
    isDirectory = await fs.stat(dirPath + "/" + filename).isDirectory();
    if (isDirectory) allFiles = getAllFiles(dirPath + "/" + filename, allFiles);
    else allFiles.push(path.join(__dirname, dirPath, filename));
  });

  return allFiles;
}

async function getDirInfo(dirPath) {
  files = await getAllFiles(dirPath);
  let totalSize = 0;
  files.forEach((filePath) => (totalSize += await fs.stat(filePath).size));
  return { fileCount: files.length, size: totalSize };
}

function update(data, bar) {
  bar.tick(data.currentSize, {
    progress: data.progress,
    rem: data.remainingSecs,
    _rate: data.writeRate,
  });
}

//Based on: https://gist.github.com/mrchantey/1c99d909836c65e8ac438d2bae2f09d2
async function report(cb) {
  //calculate sizes
  const currentSize = (await getDirInfo(reportData.output)).size;
  const bytesWritten = currentSize - reportData.lastSize;
  if (bytesWritten === 0) return;
  reportData.lastSize = currentSize;
  const progress = currentSize / getTotalBundleSize();

  //calculate times
  const currentTime = milToSec(Date.now());
  const deltaT = currentTime - reportData.lastTime;
  reportData.lastTime = currentTime;

  //calculate rates
  const writeRate = convertBytes(bytesWritten) / deltaT; //How much data was written / how long it took = rate
  reportData.writeRate = lerp(reportData.writeRate, writeRate);
  const remainingSecs = (1 / reportData.speed) * convertBytes(getTotalBundleSize() - currentSize); //How long it takes to write * how much is left

  cb({
    currentSize,
    progress,
    writeRate,
    remainingSecs,
  });
}

module.exports = async function (options) {
  try {
    const { output, src, modules, tick, fast } = options;
    const srcLoc = `${output}/${src.split("/").pop()}`;
    const modulesLoc = `${output}/${modules.split("/").pop()}`;
    const spinner = ora("Preparing...");

    try {
      await fs.stat(output);
      logger.info("Output folder found.");
      fs.remove(output);
    } catch (error) {
      logger.warn(`Output location: '${output}' not found.`);
      logger.info(`Creating:\n${output}\n${srcLoc}\n${modulesLoc}`);
      fs.mkdir(output);
      fs.mkdir(srcLoc);
      fs.mkdir(modulesLoc);
      logger.info("Created output location.");
    }

    spinner.stop();

    let intervalID;
    if (!fast) {
      spinner.start("Counting...");
      reportData.output = output;
      reportData.srcInfo = await getDirInfo(src);
      reportData.modulesInfo = await getDirInfo(modules);
      reportData.startTime = milToSec(Date.now());
      reportData.lastSize = 0;
      reportData.lastTime = startTime;
      reportData.speed = 0;
      index = Math.floor(bytes.toString().length / 3);
      spinner.stop();
      logger.info("Count complete.");
    }

    logger.info("Preperation complete.");
    spinner.start("Bundling...");

    if (!fast) {
      let unit;
      switch (index) {
        case 0:
          unit = "B";
          break;
        case 1:
          unit = "kB";
          break;
        case 2:
          unit = "MB";
          break;
        default:
          unit = "GB";
      }

      const bar = new ProgressBar(`[:bar] :progress% @:_rate${unit}/s :rems remaining    `, {
        total: getTotalBundleSize(),
        head: "||",
        incomplete: "_",
      });

      intervalID = setInterval(() => report(() => update(bar)), 1000 / tick);
    }

    await fs.copy(src, srcLoc, { overwrite: true });
    await fs.copy(modules, modulesLoc, { overwrite: true });

    if (!fast) {
      clearInterval(intervalID);
    }

    spinner.stop();
    logger.info("Bundle Complete.");
  } catch (error) {
    logger.error(error);
  }
};

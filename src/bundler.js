const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { format, transports } = require("winston");
const ProgressBar = require("progress");
const ora = require("ora");
const cpy = require("cpy");

const logger = winston.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.label({ label: "js-bundler" }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.colorize(),
        format.printf((info) => `[${info.label}] |${info.timestamp}| ${info.level}: ${info.message}`)
      ),
    }),
  ],
});

let reportData = {};
let index;

const milToSec = (t) => t / 1000;
const convertBytes = (bytes) => bytes / (1000 ^ index);
const getTotalBundleSize = () => reportData.srcInfo.size + reportData.modulesInfo.size;
const lerp = (a, b) => a + (b - a) * 0.01; //0.01 is smoothing

async function getAllFiles(dirPath, allFiles = []) {
  let currentFiles = await fs.readdir(dirPath);

  for (let i = 0; i < currentFiles.length; i++) {
    const currentPath = path.join(dirPath, currentFiles[i]);
    isDirectory = (await fs.stat(currentPath)).isDirectory();
    if (isDirectory) allFiles = await getAllFiles(currentPath, allFiles);
    else allFiles.push(currentPath);
  }

  return allFiles;
}

async function getDirInfo(dirPath) {
  files = await getAllFiles(dirPath);
  let totalSize = 0;
  files.forEach((filePath) => (totalSize += fs.statSync(filePath).size));
  return { fileCount: files.length, size: totalSize };
}

//Based on: https://gist.github.com/mrchantey/1c99d909836c65e8ac438d2bae2f09d2
async function report(bar) {
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
  const remainingSecs = (1 / reportData.writeRate) * convertBytes(getTotalBundleSize() - currentSize); //How long it takes to write * how much is left

  bar.tick(bytesWritten, {
    progress: Math.round(progress * 100),
    //rem: Math.round(remainingSecs),
    //_rate: Math.round(writeRate),
  });
}

async function report2(progress, bar) {
  const bytesWritten = progress.completedSize - reportData.currentSize;
  reportData.currentSize = progress.completedSize;
  bar.tick(bytesWritten, {
    progress: Math.round(progress.percent * 100),
    //rem: Math.round(remainingSecs),
    //_rate: Math.round(writeRate),
  });
}

module.exports = async function (options) {
  try {
    const { output, src, modules, fast } = options;
    const srcLoc = `${output}/${src.split("/").pop()}`;
    const modulesLoc = `${output}/${modules.split("/").pop()}`;
    const spinner = ora("Preparing...");

    try {
      await fs.stat(output);
      logger.info("Output folder found.");
      await fs.remove(output);
      fs.mkdir(output);
      fs.mkdir(srcLoc);
      fs.mkdir(modulesLoc);
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
      reportData.startTime = reportData.lastTime = milToSec(Date.now());
      reportData.lastSize = 0;
      reportData.writeRate = 0;
      index = Math.floor(getTotalBundleSize().toString().length / 3);
      spinner.stop();
      logger.info("Count complete.");

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

      logger.info("Bundling...");
      const bar = new ProgressBar(`[:bar] :progress% @:rate${unit}/s :etas remaining    `, {
        total: getTotalBundleSize(),
        head: "||",
        incomplete: "_",
      });

      reportData.currentSize = 0;

      await cpy(src, srcLoc).on("progress", (progress) => report2(progress, bar));
      await cpy(modules, modulesLoc).on("progress", (progress) => report2(progress, bar));
    } else logger.info("Bundling...");

    //await fs.copy(src, srcLoc, { overwrite: true });
    //await fs.copy(modules, modulesLoc, { overwrite: true });

    if (!fast) {
      clearInterval(intervalID);
      //sumary
    }

    logger.info("Bundle Complete.");
  } catch (error) {
    logger.error(error);
    return;
  }
};

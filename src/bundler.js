const fs = require("fs-extra");
const winston = require("winston");
const { format, transports } = require("winston");

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

const milToSec = (t) => t / 1000;
const getTotalBundleSize = () => reportData.srcInfo.size + reportData.modulesInfo.size;
const lerp = (a, b) => a + (b - a) * 0.1;

function convertBytes(bytes) {
  index = Math.floor(bytes.toString().length / 3);
  index = Math.max(1, index);
  return bytes / (1000 ^ index);
}

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

    logger.info("Preparing...");

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

    let intervalID;
    if (!fast) {
      logger.info("Counting files");
      reportData.output = output;
      reportData.srcInfo = await getDirInfo(src);
      reportData.modulesInfo = await getDirInfo(modules);
      reportData.startTime = milToSec(Date.now());
      reportData.lastSize = 0;
      reportData.lastTime = startTime;
      reportData.speed = 0;
      intervalID = setInterval(() => report(update), 1000 / tick);
    }

    logger.info("Preperation complete.");
    logger.info("Bundling...");

    await fs.copy(src, srcLoc, { overwrite: true });
    await fs.copy(modules, modulesLoc, { overwrite: true });
    if (intervalID) clearInterval(intervalID);

    logger.info("Bundle Complete.");
  } catch (error) {
    logger.error(error);
  }
};

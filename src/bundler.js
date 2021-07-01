const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { format, transports } = require("winston");
const { Bar } = require("cli-progress");
const ora = require("ora");
const cpy = require("cpy");
const chalk = require("chalk");
const { summarise } = require("./prompt");

const label = "js-bundler";
const units = ["B", "kB", "MB", "GB"];

const round1DP = (number) => Math.round(number * 10) / 10;
const convertSize = (size) => round1DP(size / 1000 ** module.index);

function getLogger(silent, logPath) {
  const logger = winston.createLogger();

  logger.add(
    new transports.Console({
      format: format.combine(
        format.label({ label: label }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.colorize(),
        format.printf((info) => `[${info.label}] |${info.timestamp}| ${info.level}: ${info.message}`)
      ),
      silent: silent,
    })
  );

  if (logPath)
    logger.add(
      new transports.File({
        filename: logPath,
        format: format.combine(
          format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          format.metadata({
            fillExcept: ["message", "level", "timestamp", "label"],
          })
        ),
      })
    );

  return logger;
}

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

async function prepare(output, src, modules) {
  const srcLoc = `${output}/${src.split("/").pop()}`;
  const modulesLoc = `${output}/${modules.split("/").pop()}`;

  try {
    console.log();
    module.logger.info("Peparing bundle output location.");
    await fs.stat(output);
    module.logger.info("Output folder found.");
    await fs.remove(output);
    fs.mkdir(output);
    fs.mkdir(srcLoc);
    fs.mkdir(modulesLoc);
  } catch (error) {
    module.logger.warn(`Output location: '${output}' not found.`);
    module.logger.info(`Creating:\n${output}\n${srcLoc}\n${modulesLoc}`);
    fs.mkdir(output);
    fs.mkdir(srcLoc);
    await fs.mkdir(modulesLoc);
    module.logger.info("Created output location.");
  }
}

async function precaulcate(src, modules) {
  module.start = Date.now();
  module.srcInfo = await getDirInfo(src);
  module.modulesInfo = await getDirInfo(modules);
  module.totalFiles = module.srcInfo.fileCount + module.modulesInfo.fileCount;
  module.totalSize = module.srcInfo.size + module.modulesInfo.size;
  module.index = Math.floor(module.totalSize.toString().length / 3);
  module.unit = units[module.index];
  module.logger.info("Calculations complete.");
}

async function copySilent(output, src, modules) {
  await cpy([src, modules], output, { parents: true });
  module.logger.info("Bundle Complete.");
  module.logger.info("Summary", {
    success: true,
    messages: `[${label}]:: Bundled to '${output}'`,
    timeTaken: Date.now() - module.start,
    fileCount: module.totalFiles,
    sizeCount: convertSize(module.totalSize),
    sizeUnits: module.unit,
  });
}

async function copyVerbose(output, src, modules) {
  console.log();
  const bar = new Bar({
    format: `Bundle Progress | ${chalk.cyan("{bar}")} | {percentage}% || @{speed} || ETA: {eta}s`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });
  bar.start(module.totalSize, 0, {
    speed: "N/A",
  });

  const start = Date.now();
  await cpy([src, modules], output, { parents: true }).on("progress", (progress) => {
    const bytesWritten = progress.completedSize - (module.currentSize || 0);
    module.currentSize = progress.completedSize;

    const speed = round1DP(convertSize(module.currentSize) / ((Date.now() - start) / 1000));
    bar.increment(bytesWritten, {
      speed: `${speed} ${module.unit}/s`,
    });
  });

  bar.update(module.totalSize);
  bar.stop();
  summarise(
    true,
    `[${label}]:: Bundled to '${output}'`,
    Date.now() - module.start,
    module.totalFiles,
    convertSize(module.totalSize),
    module.unit
  );
}

function fail(error, silent, fast) {
  const time = module.start ? Date.now() - module.start : "NA";
  const totalFiles = module.totalFiles || "NA";
  const totalSize = module.totalSize || "NA";
  const unit = module.unit || "NA";
  if (silent)
    module.logger.info("Summary", {
      success: false,
      messages: `[${label}]:: ${error}`,
      timeTaken: time,
      fileCount: totalFiles,
      sizeCount: totalSize,
      sizeUnits: unit,
    });
  else if (!fast) {
    summarise(false, `[${label}]:: ${error}`, time, totalFiles, totalSize, unit);
    module.logger.error("Closing...");
  }
}

module.exports = async function (options) {
  const { output, src, modules, fast, silent, log } = options;

  try {
    module.logger = getLogger(silent, log);
    await prepare(output, src, modules);
    const spinner = ora();

    //Bundling
    if (!fast) {
      spinner.start("Preparing...");
      await precaulcate(src, modules);
      spinner.stop();
      module.logger.info("Bundling...");

      if (silent) await copySilent(output, src, modules);
      else await copyVerbose(output, src, modules);
    } else {
      //Fast Copy
      spinner.start("Bundling...");
      await cpy([src, modules], output, { parents: true });
      spinner.stop();
      module.logger.info("Bundle Complete.");
    }
  } catch (error) {
    fail(error, silent, fast);
  }
};

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

const units = ["B", "kB", "MB", "GB"];

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

async function report(progress, bar) {
  const { completedSize: totalWritten } = progress;
  const bytesWritten = totalWritten - (module.currentSize || 0);
  module.currentSize = totalWritten;
  bar.tick(bytesWritten);
}

module.exports = async function (options) {
  try {
    const { output, src, modules, fast } = options;
    const srcLoc = `${output}/${src.split("/").pop()}`;
    const modulesLoc = `${output}/${modules.split("/").pop()}`;

    //Setup output folder(s)
    try {
      logger.info("Peparing bundle output location.");
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

    let start;
    let totalSize;
    let totalFiles;

    //Progress bar
    if (!fast) {
      const spinner = ora("Preparing...");
      let srcInfo = await getDirInfo(src);
      let modulesInfo = await getDirInfo(modules);
      totalSize = srcInfo.size + modulesInfo.size;
      totalFiles = srcInfo.fileCount + modulesInfo.fileCount;
      start = Date.now();
      let index = Math.floor(totalSize.toString().length / 3);
      spinner.stop();
      logger.info("Count complete.");

      let unit = units[index];

      logger.info("Bundling...");
      const bar = new ProgressBar(`[:bar] :percent @:rate${unit}/s :etas remaining    `, {
        total: totalSize,
        head: "||",
        incomplete: "_",
      });

      await cpy([src, modules], output, { parents: true }).on("progress", (progress) => report(progress, bar));
      end = Date.now();
      bar.update(1);
    } else logger.info("Bundling...");

    await cpy([src, modules], output, { parents: true });
    if (!fast) {
      //summary
    }
    logger.info("Bundle Complete.");
  } catch (error) {
    logger.error(error);
  }
};

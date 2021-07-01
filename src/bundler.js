const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { format, transports } = require("winston");
const ProgressBar = require("progress");
const ora = require("ora");
const cpy = require("cpy");
const { summarise } = require("./prompt");

const label = "js-bundler";

const logger = winston.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.label({ label: label }),
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
  const { output, src, modules, fast } = options;

  try {
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

    const spinner = ora();

    //Progress bar
    if (!fast) {
      spinner.text = "Preparing...";
      var start = Date.now();
      let srcInfo = await getDirInfo(src);
      let modulesInfo = await getDirInfo(modules);
      var totalFiles = srcInfo.fileCount + modulesInfo.fileCount;
      var totalSize = srcInfo.size + modulesInfo.size;
      let index = Math.floor(totalSize.toString().length / 3);
      spinner.stop();
      logger.info("Count complete.");

      var unit = units[index];

      logger.info("Bundling...");
      const bar = new ProgressBar(`[:bar] :percent @:rate${unit}/s :etas remaining    `, {
        total: totalSize,
        head: "||",
        incomplete: "_",
      });

      await cpy([src, modules], output, { parents: true }).on("progress", (progress) => report(progress, bar));
      bar.update(1);
      summarise(true, `[${label}]:: Bundled to '${output}'`, Date.now() - start, totalFiles, totalSize, unit);
    } else {
      spinner.text = "Bundling...";
      await cpy([src, modules], output, { parents: true });
      logger.info("Bundle Complete.");
    }
  } catch (error) {
    if (!fast) summarise(false, `[${label}]:: ${error}`, Date.now() - start, totalFiles, totalSize, unit);
    logger.error("Bundle FAILED. Closing...");
  }
};

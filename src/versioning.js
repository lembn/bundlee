const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const AutoGitUpdate = require("auto-git-update");
const ora = require("ora");
const { alertUpdate } = require("./prompt");

module.exports = async function () {
  const spinner = ora();
  spinner.start("Comparing versions...");

  const tempLocation = await fs.mkdtemp(path.join(os.tmpdir(), "bundlee-"));
  const updater = new AutoGitUpdate({
    repository: "https://github.com/lembn/bundlee",
    tempLocation,
    executeOnComplete: process.argv0,
  });
  updater.setLogConfig({ logGeneral: false });
  const versions = await updater.compareVersions();
  await updater.autoUpdate();
  spinner.stop();
  alertUpdate(versions.upToDate, versions.upToDate ? versions.currentVersion : versions.remoteVersion);

  try {
    await fs.rm(tempLocation, { recursive: true });
  } catch (e) {
    console.log(`An error has occurred while removing the temp folder at ${tempLocation}. Please remove it manually. Error: ${e}`);
  }
};

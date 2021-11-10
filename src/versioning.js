const AutoGitUpdate = require("auto-git-update");
const { alertUpdate } = require("./prompt");

module.exports = async function () {
  const updater = new AutoGitUpdate({
    repository: "https://github.com/lembn/jsbundler",
    tempLocation: "./jsbundler-tmp/",
    executeOnComplete: process.argv0,
  });
  const updated = await updater.autoUpdate();
  alertUpdate(updated);
};

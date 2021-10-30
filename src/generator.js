const fs = require("fs-extra");
const { BUNDLEIGNORE, IGNORESTRUCTURE } = require("./common");

module.exports = async function () {
  //create content
  const ignore = IGNORESTRUCTURE;
  ignore.files = ["README.md", "package.json", "package.lock.json", ".gitignore", "*.log"];
  ignore.folders = [".bundle", "log", ".log"];
  console.log(`CREATED:\n${JSON.stringify(ignore, null, 2)}`);

  //write content to file
  fs.writeJSON(BUNDLEIGNORE, ignore);
};

# js-bundler

A CLI to bundle source code and node modules into a distribution folder

`js-bunlder` was made to make projects with local dependencies easier to deploy. Developing code with local imports usually requires using relative paths to load modules. A devloper could get around this by publishing their local packages to the npm registry. This means that whenever the support packages can be installed into the main package, and added to the `package.json` so that when the main package is intalled the support packages come along with it. However this can be alot of work for a package that is still in development, private, or changing often. This devloper might avoid publishing the package and use `npm install --save [path]` to bring the local support package into the main packages, `node_modules` folder, but this is also a hassle - especially if the support package in in development, since every time the support package is changed the main package needs to update itself. While this can be automated with file watchers and some scripting, it doesn't change the fact that the support package is still local, so will not be accessible to a remote deployment. `js-bundler` aims to solve all these problems, by automatically collecting and updating these local packages, and bundling them with the main source code and other node packages into a single folder, which can be deployed without needing to publish the local packages or copy them into the main package.

`js-bunlder` requires all the package's source code to be in one folder. Likewise, all installed node modules should be contained within a single folder. The contents of these folders are copied into the `dist` folder with their internal structure preserved. Any local libraries used in the module should be packaged into a node package (with `npm init`) and installed as a local dependency so they will be contained within the main package's node modules.

> _NOTE: `js-bundler` updates the local packages in bundle's `node_modules` **NOT** the main `node_modules` folder. This is why it is recommended to run from bundle when using `js-bundler`_

# TODO

- fix progress bar rate (its currently always in bytes)

  - maybe do this by calling tick with the MB value rather than the byte value?
  - maybe use [this](https://www.npmjs.com/package/cli-progress) progress bar instead?

- test summary on fail
- do we even need async? eliminate where possible
- test fast/slow interactive/non
- remove tick option

- add silent mode

- make sure paths are folders and not files
- make sure ctrl C quit is safe
  - test with(out) npm scripts
- quit on fail

- Add automatic local dependency update
- [hashing](https://www.npmjs.com/package/folder-hash)
- update local dependencies after bundle has been copied
- break module.exports function into smaller functions if dependency update adds alot of code
- add option to log to file
- publish

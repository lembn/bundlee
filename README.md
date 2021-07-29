# js-bundler

A CLI to bundle source code and node modules into a distribution folder

`js-bunlder` was created to make projects with local dependencies easier to deploy. Developing code with local dependencies usually requires using relative paths to load modules. A devloper could get around this by publishing their local packages to the npm registry. This means that whenever the support packages can be installed into the main package, and added to the `package.json` so that when the main package is intalled the support packages come along with it. However this can be alot of work for a package that is still in development, private, or changing often. This devloper might avoid publishing the package and use `npm install [local-package]` to bring the local support package into the main packages, `node_modules` folder, but this is also a hassle - especially if the support package in in development, since every time the support package is changed the main package needs to update itself. While this can be automated with file watchers and some scripting, it doesn't change the fact that the support package is still local, so will not be accessible to a remote deployment, likewise `link`ing to local packages can also be a pain since sybmbolic links can cause issue in some packages. `js-bundler` aims to solve all these problems, by automatically collecting and updating these local packages, and bundling them with the main source code and other node packages into a single folder, which can be deployed without needing to publish the local packages or copy them into the main package.

`js-bunlder` requires all the package's source code to be in one folder. Likewise, all installed node modules should be contained within a single folder. The contents of these folders are copied into the `dist` folder with their internal structure preserved. Any local libraries used in the module should be packaged into a node package (with `npm init`) and installed as a local dependency so they will be contained within the main package's node modules.

> _NOTE: files/folders to be ingored need to be prefixed with the appropriate `src/` or `node_modules` appropriately in the `ignore.json`_

# TODO

- test updater
- test ignore files for local packages

- remove ignore files from dist folder

- genIgnore functionality. generates a generic bundle.ignore (README.md, .bundle\*, package.json, package-lock.json, .gitignore, \*.log, log(s)/) (implement into new js file, `generator.js`)
- autoupdate (implement into index)

- check which awaits can be removed to allow more concurrency
- maybe use promise.all for loops instead of async await
- replace for...in with for...of
- review usage of cpy where fs-extra.copy can be used
- replace {} objects with class objects?

- publish

- when `parents` is set to false in `src/bundler.js`'s `copyOptions`, the `cpy` function copies all the files from the source folders _flatly_ into the destination folder without maintaining any of the original folder structure. Does this form of the code still run? If yes consider adding it to fast mode because it really cuts down on bundle time and if no, what would it take to make it work?

- code parser: parses source code to find relative `require()`s, takes the path and copies it into `package.json`, then changes the `require()` to a normal dependency one (replace the path the the package name, but leave any slashes after). It doesnt need to actualy install the package because as long as it is run first, the new package will be picked up by the updater afterwards. This means `npm install [local-package]` never has to be used, the user can just write relative imports in their code and the parser will do the rest.
- _keep in mind_ should the parser convert all the code or just the dist code, leaving the original source code alone?

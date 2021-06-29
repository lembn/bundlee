# js-bundler

A CLI to bundle source code and node modules into a distribution folder

# TODO

- Add progress bar
- Add colours (winston?)
- Add automatic local dependency update
- publish

# Notes

`js-bunlder` was made to make projects with local dependencies easier to deploy. Developing code with local imports usually requires using relative paths to load modules. A devloper could get around this by publishing their local packages to the npm registry. This means that whenever the support packages can be installed into the main package, and added to the `package.json` so that when the main package is intalled the support packages come along with it. However this can be alot of work for a package that is still in development, private, or changing often. This devloper might avoid publishing the package and use `npm install --save [path]` to bring the local support package into the main packages, `node_modules` folder, but this is also a hassle - especially if the support package in in development, since every time the support package is changed the main package needs to update itself. While this can be automated with file watchers and some scripting, it doesn't change the fact that the support package is still local, so will not be accessible to a remote deployment. `js-bundler` aims to solve all these problems, by automatically collecting and updating these local packages, and bundling them with the main source code and other node packages into a single folder, which can be deployed without needing to publish the local packages or copy them into the main package.

`js-bunlder` requires all the package's source code to be in one folder. Likewise, all installed node modules should be contained within a single folder. The contents of these folders are copied into the `dist` folder with their internal structure preserved. Any local libraries used in the module should be packaged into a node package (with `npm init`) and installed as a local dependency so they will be contained within the main package's node modules.

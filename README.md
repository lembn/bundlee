# js-bundler

A CLI to bundle source code and node modules into a distribution folder

`js-bunlder` was made to make projects with local dependencies easier to deploy. Developing code with local imports usually requires using relative paths to load modules. A devloper could get around this by publishing their local packages to the npm registry. This means that whenever the support packages can be installed into the main package, and added to the `package.json` so that when the main package is intalled the support packages come along with it. However this can be alot of work for a package that is still in development, private, or changing often. This devloper might avoid publishing the package and use `npm install --save [path]` to bring the local support package into the main packages, `node_modules` folder, but this is also a hassle - especially if the support package in in development, since every time the support package is changed the main package needs to update itself. While this can be automated with file watchers and some scripting, it doesn't change the fact that the support package is still local, so will not be accessible to a remote deployment. `js-bundler` aims to solve all these problems, by automatically collecting and updating these local packages, and bundling them with the main source code and other node packages into a single folder, which can be deployed without needing to publish the local packages or copy them into the main package.

`js-bunlder` requires all the package's source code to be in one folder. Likewise, all installed node modules should be contained within a single folder. The contents of these folders are copied into the `dist` folder with their internal structure preserved. Any local libraries used in the module should be packaged into a node package (with `npm init`) and installed as a local dependency so they will be contained within the main package's node modules.

> _NOTE: `js-bundler` updates the local packages in bundle's `node_modules` **NOT** the main `node_modules` folder. This is why it is recommended to run from bundle when using `js-bundler`_

# TODO

- test

- add bundle.ignore functionality. bundle.ignore specifies files and folders that should be completely ignored by the bundler. if they specify files or folders in the root package, those files or folders will not be added to the bundle. there should also be syntax to ignore local dependency packages completely, or just disable auto-update for them, but still bundle them.
- for bundler.ignore files found in local dependecy packages, the bundler should ignore the files and folders that the ignore file points to (relative to the package)

- genIgnore functionality. generates a generic bundle.ignore (README.md, bundle.ignore, package.json, package-lock.json, .gitignore, \*.log, log(s)/)

- default/recommended files names should be .bundlecache, .bundleignore, .bundlelog so that in gitignore you can just say `.bundle\*`

- publish

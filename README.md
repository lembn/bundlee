# js-bundler

Bundle source code and npm modules into a distribution folder

# TODO

- Convert from args to inquire and add a -Y mode for defualts
- Add automatic local dependency update
- Add progress bar
- Add colours
- publish

# Notes

`js-bunlder` requires all the package's source code to be in one folder. Likewise, all installed node modules should be contained within a single folder. The contents of these folders are copied into the `dist` folder with their internal structure preserved. Any local libraries used in the module should be packaged into a node package (with `npm init`) and installed as a local dependency so they will be contained within the main package's node modules.

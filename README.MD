# Fontello Wrapper

A fine-tuning of [Fontello](https://github.com/fontello/fontello) to match my needs.  
Main purpose of this all is to have one-click button to render everything exactly like you want it.  

Disclaimer: I do not develop Fontello, and have no connections to the developers of Fontello.  

## Install

1. Make sure your NodeJS is version 14 or higher  
Fontello implicitly requires this version of Node by using some relatively new JS syntax.  
2. `npm install -g ttfautohint`  
Fontello implies that there will be executable `ttfautohint` available to shell. Easiest way to achieve this is by installing this package globally.  
3. `git clone https://github.com/fontello/fontello` somewhere  
Location does not matter much, as we will configure it later.  
4. `npm install` inside Fontello directory  
Because those packages won't install themselves.  
5. `npm install -g @nartallax/fontello-wrapper`  
It is implied that the wrapper will be installed globally. It's not really required to do so; it's just does not makes sense to me to install this as dependency for any particular project.  
6. Put a path to `server.js` of Fontello in file `FONTELLO_PATH.TXT` near `fontello-wrapper.js`  
If you isn't sure where exactly you should put it, just launch the `fontello-wrapper` and the wrapper will tell you.  

Note: most (all) of globally installed things here (like specific version of NodeJS, or ttfautohint) can be installed locally and mimic global behavior through manipulation of PATH environment variable, but this approach makes install and launch process even more complicated, so let's go without it.  

## Configure

Next step is to tell wrapper what to do on save.  
This settings are related to the project you build your font for, and stored in JSON file.  
I won't repeat myself here about exact syntax of the file; go look on it [in type definitions](ts/config.ts).  

## Launch

If you installed the wrapper globally, as I suggested earlier, you now should be able to just launch `fontello-wrapper ./my_project/my_config.json` in command line.  
After launch wrapper will open Fontello web interface in your default browser after the Fontello is launched. Don't use default web interface address, as this won't work as expected. "Export font" button will save the font as you configured.  

## Troubleshooting

[Fontello saves changes with delay](https://github.com/fontello/fontello/issues/750). That is, if you added/removed icon, actually changes will take effect in a few seconds. Don't be too hasty clicking that "Export font" button, as it may lose your changes.  

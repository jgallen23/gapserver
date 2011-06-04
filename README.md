# GapServer

A utility to let you use modern web technologies when building your PhoneGap apps.

## Supports

- [Jade](https://github.com/visionmedia/jade/)
- [CoffeeScript](http://jashkenas.github.com/coffee-script/) (optional)
- [Stylus](http://learnboost.github.com/stylus/) (optional)
- More coming soon (requests?)

## Install

``` npm install gapserver -g ```

## Setup 

1. Create a new PhoneGap project in XCode
2. Add your www folder to your XCode project (if XCode 4)
3. Navigate to your www directory in terminal
4. Run: ``` gapserver --startapp ```
5. Run: ``` gapserver ``` and go to http://localhost:3000 in your browser
6. Code away...
7. When you are ready to deploy to your device.  Run: ``` gapserver --generate ```
8. Build in XCode

## CoffeeScript

CoffeScript support comes out of the box.  Just place your .coffee files anywhere within your www folder and then reference the files with the same path, but with a .js extension.

Example:
Coffee: www/scripts/app.coffee
Jade: ``` script(src="scripts/app.js") ```

## Stylus

Stylus support is very similar to coffeescript support.  Place your styl files anywhere inside your www folder and refrence them with a .css extension.

## Jade

templates/index.jade is where your primary app template code should live.  You can also use partials to split up your template code.  See the example folder for how to accomplish that.


## Auto Generate in on XCode Build
Coming Soon



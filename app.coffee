express = require "express"
args = require("argsparser").parse()
app = express.createServer()
path = require "path"

cwd = process.cwd()
if path.existsSync("#{ cwd }/config")
  config = require "#{ cwd }/config"
else
  config = require "#{ __dirname }/config"
###
Masher = require("./ext/node-mash/mash")

for lib in config.ui.scriptLibs
  config.ui['common']['js'].splice 0, 0, "lib/#{ lib }-min.js"

for lib in config.ui.styleLibs
  config.ui['common']['css'].splice 0, 0, "lib/#{ lib }.css"

masher = new Masher config.ui
###
if args["--build"]
  fs = require "fs"
  jade = require "jade"
  path = require "path"
  #if path.existsSync "lib"
    #TODO: fix rm 
    #fs.unlinkSync "lib/*"
    #fs.rmdirSync "lib"
  #fs.linkSync "#{ __dirname }/lib", "lib"
  locals =
    #masher: masher
    debug: false
    phonegap: true
  jade.renderFile "templates/index.jade", { locals: locals }, (err, html) ->
    fs.writeFile "index.html", html, (err) ->
      console.log err
else if args["--startapp"]
  source = "#{ __dirname }/structure/"
  destination = "#{ cwd }/"
  require('child_process').spawn('cp', ['-r', source, destination])
else
  app.configure () ->
    app.use express.methodOverride()
    app.use express.bodyParser()
    app.use app.router

    app.set "views", "#{ cwd }/templates"
    app.set "view engine", config.templateEngine
    app.set "view options", { layout: false, open: "{{", close: "}}" }

    compiledDir = "#{ cwd }/compiled"
    app.use "/compiled", express.compiler src: "#{ cwd }/app", dest: compiledDir, enable: ['less', 'coffeescript']
    app.use "/compiled", express.static compiledDir
    app.use "/ui", express.static "#{ cwd }/ui"

    app.use express.errorHandler { dumpExceptions: true, showStack: true }
   

  app.get "/", (req, res) ->
    #res.local "masher", masher
    res.local "debug", false
    res.local "phonegap", false

    res.render "index"

  app.get "/build", (req, res) ->
    fs.readFile "index.html", (err, data) ->
      res.end data

  console.log "Server started on port 3000"
  app.listen 3000

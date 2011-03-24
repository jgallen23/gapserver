express = require "express"
ejs = require "ejs"
app = express.createServer()

cwd = process.cwd()

config = require "#{ cwd }/config"

for lib in config.ui.scriptLibs
	config.ui['common']['js'].splice 0, 0, "lib/#{ lib }-min.js"

for lib in config.ui.styleLibs
	config.ui['common']['css'].splice 0, 0, "lib/#{ lib }.css"

mash = (profile, type, debug = false) ->
	if !debug
		files = config.ui[profile][type]
		html = for file in files
			if type is "css"
				"<link href='#{ file }' type='text/css' rel='stylesheet'>"
			else if type is "js"
				"<script src='#{ file }'></script>"
		html.join ''


app.configure () ->
	app.use express.methodOverride()
	app.use express.bodyParser()
	app.use app.router

	app.set "views", "#{ cwd }/templates"
	app.set "view engine", config.ui.templateEngine
	app.set "view options", { layout: false, open: "{{", close: "}}" }

	coffeeDir = "#{ cwd }/coffee"
	staticDir = "#{ cwd }/ui"
	app.use express.compiler src: coffeeDir, dest: staticDir, enable: ['coffeescript']
	app.use express.static staticDir
	app.use "/ui", express.static staticDir
	app.use "/lib", express.static "#{ __dirname }/lib"
	app.use express.errorHandler { dumpExceptions: true, showStack: true }
 

app.get "/", (req, res) ->
	res.local "mash", mash
	res.local "debug", false

	res.render "index", test: 'woot'

app.listen 3000

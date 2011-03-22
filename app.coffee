express = require "express"
ejs = require "ejs"
app = express.createServer()

cwd = process.cwd()

config = require "#{ cwd }/config"

mash = (profile, type, debug = false) ->
	if !debug
		files = config.ui[profile][type]
		html = for file in files
			if type is "css"
				"<link href='#{ file }' type='text/css'>"
			else if type is "js"
				"<script src='#{ file }'></script>"
		html.join ''


app.configure () ->
	app.use express.methodOverride()
	app.use express.bodyParser()
	app.use app.router

	app.register ".html", require "ejs"
	app.set "views", "#{ cwd }/www/templates"
	app.set "view engine", "ejs"
	app.set "view options", { layout: false, open: "{{", close: "}}" }

	coffeeDir = "#{ cwd }/www/coffee"
	staticDir = "#{ cwd }/www/static"
	app.use express.compiler src: coffeeDir, dest: staticDir, enable: ['coffeescript']
	app.use express.static staticDir
	app.use express.errorHandler { dumpExceptions: true, showStack: true }
 

app.get "/", (req, res) ->
	res.local "mash", mash
	res.local "debug", false

	res.render "index.html", test: 'woot'

app.listen 3000

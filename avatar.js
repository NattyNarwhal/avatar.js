// Gravatar-compatible server. Requires express.

var	fs = require('fs'),
	path = require('path'),
	express = require('express');

// paths
var defaultimg = "./res/default.jpg";
var avatarpath = "./avatars/";

// init
var server  = express();
server.use(express.static('res'));

server.get('/avatar/:hash', function(req, res) {
		var id = req.params.hash;
		// the size is needed and gravatar uses 80 default
		var size = req.query.s ? req.query.s : 80;
		// if force default, just use that
		if (req.query.f == "y") {
			// TODO
		}
		// check if even a valid hash (no dir traverse)
		if (!/^[a-f0-9]+$/.test(id)) {
			res.sendStatus(400).end(); return;
		}
		if (!fs.existsSync(path.join(avatarpath, id))) {
			res.sendStatus(404).end(); return;
		}
		// i guess it's fine
		res.sendFile(path.join(avatarpath, id));
	}
);

server.listen(3000);

// Gravatar-compatible server. Requires express.

var	fs = require("fs"),
	path = require("path"),
	express = require("express"),
	parsers = require("body-parser");
	gm = require("gm"),
	crypto = require("crypto"),
	redis = require("redis"),
	bcrypt = require("bcrypt"),
	multer = require('multer');

// regularize email
function hashableEmail(e) {
	return e.trim().toLowerCase();
}

// paths
var defaultimg = "./res/default.jpg";
var avatarpath = "./avatars/";

// init

var dbclient = redis.createClient();

dbclient.on('error', function (err) {
  console.log('Error ' + err);
});

var server  = express();
server.use(express.static("res"));

server.get("/avatar/:hash", function(req, res) {
		// aliasing var
		var id = req.params.hash;
		var p = path.join(avatarpath, id);
		// check if even a valid hash (no dir traverse)
		if (!/^[a-f0-9]+$/.test(id)) {
			res.sendStatus(400).end(); return;
		}
		// the size is needed and gravatar uses 80 default
		var size = req.query.s ? req.query.s : 80;
		// if force default OR non-existent, just use default
		if (req.query.f == "y" || !fs.existsSync(p)) {
			gm(defaultimg).resize(size,size).noProfile().toBuffer(
	                        function (err, buffer) {
                                	if (err) {
                        	                console.log("couldn't resize " + id + " to " + size);
                	                        res.sendStatus(500).end(); return;
        	                        }
	                                res.set("Content-Type", "image/jpg");
                                	res.send(buffer).end();
                        	}
                	);
			return;
		}
		// i guess it's fine
		gm(p).resize(size,size).noProfile().toBuffer(
			function (err, buffer) {
				if (err) {
					console.log("couldn't resize " + id + " to " + size);
					res.sendStatus(500).end(); return;
				}
				res.set("Content-Type", "image/jpg");
				res.send(buffer).end();
			}
		);
	}
);

// client API

var ueparser = parsers.urlencoded({extended: false});
var muparser = multer({inMemory: true, limits: {fileSize: 512000}});

server.post('/api/register', ueparser, function(req, res) {
		// check if the username exists
		var exists = dbclient.exists(hashableEmail(req.body.email), function(err, exist) {
			if (err) throw err;
			if (!req.body || exist) {
				res.sendStatus(400).end();
				return;
			}
			bcrypt.hash(req.body.password, 10, function(err, hash) {
				if (err) throw err;
				dbclient.set(hashableEmail(req.body.email), hash, redis.print);
				res.sendStatus(200).end();
			});
		});
	}
);

server.post("/api/delete", ueparser, function(req, res) {
		var exists = dbclient.exists(hashableEmail(req.body.email), function(err, exist) {
			if (err) throw err;
			if (!req.body || !exist) {
				res.sendStatus(400).end();
				return;
			}
			// hash and compare PWs from request and db
			var dbpw = null;
			dbclient.get(hashableEmail(req.body.email), function (err, dbres) {
				dbpw = dbres;
				bcrypt.compare(req.body.password, dbpw, function(err, bres) {
					if (err) throw err;
					if (bres) {
						var md5sum = crypto.createHash("md5");
						md5sum.update(hashableEmail(req.body.email));
						var id = md5sum.digest("hex");
						var p = path.join(avatarpath, id);
						if (fs.existsSync(p)) {
							fs.unlinkSync(p);
						}
						res.sendStatus(200).end();
					} else {
						res.sendStatus(400).end();
					}
				});
			});
		});
	}
);

server.post("/api/upload", muparser, function(req, res) {
		var dbpw = null;
		// Upload files.
		var exists = dbclient.exists(hashableEmail(req.body.email), function(err, exist) {
			if (err) throw err;
			if (!req.body || !exist) {
				res.sendStatus(400).end();
				return;
			}
		});
		// hash and compare PWs from request and db
		dbclient.get(hashableEmail(req.body.email), function (err, dbres) {
			dbpw = dbres;
			bcrypt.compare(req.body.password, dbpw, function(err, bres) {
				if (err) throw err;
				if (bres) {
					var md5sum = crypto.createHash("md5").update(hashableEmail(req.body.email)).digest("hex");
					var p = path.join(avatarpath, md5sum);
					gm(req.files.image.buffer, req.files.image.originalname).noProfile().write("JPG:" + p, function (err) {
						if (err) {
							console.log("couldn't write " + p);
							res.sendStatus(500).end(); return;
						} else {
							res.sendStatus(200).end(); return;
						}
					});
				} else {
					res.sendStatus(400).end();
				}
			});
		});
	}
);

server.listen(3000);

var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
mongoose.connect('mongodb://psamora:test@kahana.mongohq.com:10026/app29528023');
var bodyParser = require('body-parser');
var router = express.Router();
var accountSid = 'ACd882ca7c1db91ca067d5072ac3f0a5b8';
var authToken = 'c64507802fc8ffd839ca321db09a827b';
var url = require('url');

var client = require('twilio')(accountSid, authToken);
var app = express();
app.use(bodyParser.json());
app.set('view engine', 'jade')
var usersSchema = mongoose.Schema({
  	phone: String,
  	id: String
})

var User = mongoose.model('user', usersSchema);

app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

app.get('/login', function(req, res) {

  var newPhone = req.param("phone")
  var newUser = req.param("user")
  if (typeof newPhone != 'undefined') {
  	var salt = crypto.randomBytes(128).toString('base64');
    var hash = crypto.createHmac('sha1', salt).update(newPhone).digest('hex')
  	var url = "tr://" + hash
  	console.log("login from " + newPhone + " hash: " + hash);
	// client.messages.create({
	// 	body: "Hey, thanks for using Tranquility! Click to confirm your login: " + url,
	// 	to: newPhone,
	// 	from: "+12673231393"
	// 	}, function(err, message) {
	// 	process.stdout.write(message.sid);
	// })
  }
  else if (typeof newUser != 'undefined') {
    var user = new User({id: hash});
    user.save(function (err, user) {
		  if (err) return console.error(err);
	});
  }
  else {
  	console.log("invalid login page access");
  }
});

app.post('/meal', function(req, res) {
	console.log("isjson " + req.is('json'))
	console.log("req " + req)
	console.log(req.body)
	console.log(req.body.Body)
	var message = req.body.param("Body")
	console.log(message)
	var datetime = new Date()
	console.log(datetime)
	res.send('a')
});

app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

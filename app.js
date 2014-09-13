var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
mongoose.connect('mongodb://psamora:test@kahana.mongohq.com:10026/app29528023');
var bodyParser = require('body-parser');
var router = express.Router();

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
  var key = Math.ceil(parseInt(req.param("phone")) / 9999);
  console.log(key);
  res.status(key).end();
});

app.get('/confirm', function(req, res) {
  var key = req.param("key");
  var newPhone = req.param("phone");
  if (key == Math.ceil(parseInt(newPhone) / 9999)) {
	  var db = mongoose.connection;
	  var hash = crypto.createHmac('sha1', "12345").update(newPhone).digest('hex');
	  console.log(hash);
	  var user = new User({phone: newPhone, id: hash});
	  console.log(user.id);
	  db.on('error', console.error.bind(console, 'connection error:'));
	  db.once('open', function callback () {
	  // yay!
	  })

	  user.save(function (err, user) {
		  if (err) return console.error(err);
	  });
	res.status(user.id).end();
  }
  else {
  	res.status("invalidkey").end();
  }
    });

app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

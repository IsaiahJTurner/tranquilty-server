var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
mongoose.connect('mongodb://psamora:test@kahana.mongohq.com:10026/app29528023');
var bodyParser = require('body-parser');
var router = express.Router();
var accountSid = 'ACd882ca7c1db91ca067d5072ac3f0a5b8';
var authToken = 'c64507802fc8ffd839ca321db09a827b';

var needle = require('needle');
var client = require('twilio')(accountSid, authToken);
var app = express();
app.use(bodyParser.json());
app.set('view engine', 'jade')
var usersSchema = mongoose.Schema({
  	id: String
})
var User = mongoose.model('user', usersSchema);
var mealSchema = mongoose.Schema({
  	id: String,
  	date: String,
  	food: String,
  	group: String,
  	specs: String
})
var Meal = mongoose.model('meal', mealSchema);
var salt = crypto.randomBytes(128).toString('base64');


app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

app.get('/login', function(req, res) {

  var newPhone = req.param("phone")
  var newUser = req.param("user")
  if (typeof newPhone != 'undefined') {
  	
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

app.get('/meal', function(req, res) {
	var phone = req.param("From")
	var hash = crypto.createHmac('sha1', salt).update(phone).digest('hex')
	var meal = req.param("Body")
	console.log(hash)
	var cal = parse(meal)
	console.log(cal)
	// console.log("isjson " + req.is('json'))
	// console.log("req " + req)
	// console.log(req.body)
	// console.log(req.body.Body)
	var date = new Date()
	var meal = new Meal({id: hash, date: date, food: foodItem, group: 'empty', specs: cal});
	console.log(meal)
	meal.save(function (err, user) {
		  if (err) return console.error(err);
	});
	console.log(datetime)
	res.send('a')
});

app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

//parsing stuff, separate later


var apiId = "48bb4311";
var apiKey = "7f49df0097a6aead808d9c25e0dd3544";
var keywords = "ate had drank and with an a";

var sms = "tell tranquility I ate a pizza for breakfast";
var foodItem = "";

//parse(sms);

function parse(sms) {
		var message = sms.split(" ");
		for (i = 0; i < message.length; i++) {
				if (keywords.indexOf(message[i]) > -1) {
						if (keywords.indexOf(message[i+1]) > -1) {
								foodItem = message[i+2];
								console.log(foodItem);
								apiCall(url(foodItem));
								if (keywords.indexOf(message[i+3]) > -1) {
										foodItem = message[i+4];
										console.log(foodItem);
										apiCall(url(foodItem));
								}
								break;
						}
						foodItem = message[i+1];
						console.log(foodItem);
						apiCall(url(foodItem));
				}
		}
}

function apiCall(url) {
		needle.get(url, function(error, response) {
		  	if (!error && response.statusCode == 200)
		  			var response = response.body;
		  	var title = response['hits'][0]['fields']['nf_calories'];
		  	console.log(title);
		});
}

function url(foodItem) {
		return "https://api.nutritionix.com/v1_1/search/"+foodItem+"?results=0%3A1&cal_min=0&cal_max=50000&fields=nf_calories&appId="+apiId+"&appKey="+apiKey;
}
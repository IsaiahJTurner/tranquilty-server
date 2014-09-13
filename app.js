var express = require('express');
var crypto = require('crypto');

var bodyParser = require('body-parser');
var router = express.Router();
var accountSid = 'ACd882ca7c1db91ca067d5072ac3f0a5b8';
var authToken = 'c64507802fc8ffd839ca321db09a827b';

var needle = require('needle');
var client = require('twilio')(accountSid, authToken);
var app = express();
app.use(bodyParser.json());
app.set('view engine', 'jade')

/*
 * Mongoose and mongo connections
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://psamora:test@kahana.mongohq.com:10026/app29528023');
var db = mongoose.connection;
db.on('error', console.error);
var usersSchema = mongoose.Schema({
		phone: String,
  		id: String
	})
var mealSchema = mongoose.Schema({
	  	id: String,
	  	date: String,
	  	food: String,
	  	group: String,
	  	specs: String
	})
var User = mongoose.model('user', usersSchema);
var Meal = mongoose.model('meal', mealSchema);





app.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

app.get('/login', function(req, res) {
  console.log(client)
  var salt = crypto.randomBytes(128).toString('base64');
  var newPhone = req.param("phone")
  var user = req.param("user")
  if (typeof newPhone != 'undefined') {
    var hash = crypto.createHmac('sha1', salt).update(newPhone).digest('hex')
  	var url = "tr://" + hash
  	console.log("login from " + newPhone + " hash: " + hash);
  	var user = new User({phone: newPhone, id: hash, confirmed: false});
  	User.update({phone: newPhone}, {phone: newPhone, id: hash}, {upsert: true}, function (err, user) {
		if (err) return console.error(err);
	})
	client.messages.create({
		body: "Hey, thanks for using Tranquility! To confirm your login, access: " + url,
		to: newPhone,
		from: "+12673231393"
		}, function(err, message) {
		if (err) return console.error(err);
		process.stdout.write(message.sid);
	})
	res.json({success: true})
  }
  else {
  	console.log("invalid login page access");
  	res.json({success: false})
  }
});

app.get('/meal', function(req, res) {
	console.log("----------Meal incoming-----------")
	var phone = req.param("From")
	console.log(phone)
	var sms = req.param("Body")
	var date = new Date()
	parse(sms, phone.id, date)
	res.send('OK')
});

app.get('/data', function(req, res) {
	var id = req.param("id")
	Meal.find({ id: id }, function(err, meal) {
	  if (err) return console.error(err);
	  console.dir(meal);
	  res.send(meal);
	});
	res.json({success: false})
});

app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

//parsing stuff, separate later


var apiId = "48bb4311";
var apiKey = "7f49df0097a6aead808d9c25e0dd3544";
var keywords = "ate had drank and with an a";

var sms = "tell tranquility I ate a pizza for breakfast";
var foodItem = "";

function parse(sms, id, date) {
		var message = sms.split(" ");
		for (i = 0; i < message.length; i++) {
				if (isKeyword(message[i])) {
						if (isKeyword(message[i+1])) {
								foodItem = message[i+2];
								getData(foodItem, id, date);
								if (isKeyword(message[i+3])) {
										foodItem = message[i+4];
										getData(foodItem, id, date);
								}
								break;
						}
						foodItem = message[i+1];
						getData(foodItem, id, date);
				}
		}
}

function isKeyword(word) {
	return keywords.indexOf(word) > -1;
}

function getData(foodItem, id, date) {
	apiCall(url(foodItem), foodItem, id, date);
}

function apiCall(url, foodItem, id, date) {
		needle.get(url, function(error, response) {
		  	if (!error && response.statusCode == 200)
		  			var response = response.body;
		  	specs = response['hits'][0]['fields']['nf_calories'];
		  	var meal = new Meal({id: id, date: date, food: foodItem, group: 'empty', specs: specs});
				console.log(meal)
				meal.save(function (err, user) {
					  if (err) return console.error(err);
				});
		});
}

function url(foodItem) {
		return "https://api.nutritionix.com/v1_1/search/"+foodItem+"?results=0%3A1&cal_min=0&cal_max=50000&fields=nf_calories&appId="+apiId+"&appKey="+apiKey;
}
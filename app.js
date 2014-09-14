var express = require('express');
var crypto = require('crypto');
var request = require('request');
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
  newPhone = '+' + newPhone.substr(1,newPhone.length);
  console.log(newPhone)
  var user = req.param("user")
  if (typeof newPhone != 'undefined') {
    var hash = crypto.createHmac('sha1', salt).update(newPhone).digest('hex')
  	var url = "tranquility://" + hash
  	console.log("login from " + newPhone + " hash: " + hash);
  	var user = new User({phone: newPhone, id: hash, confirmed: false});
  	console.log(newPhone)
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
	res.json({success: true, phone: '+12673231393'});
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
	User.findOne({phone: phone}, function(err, phone) {
		if (err) return console.error(err);
		console.log(phone);
		console.log(phone.id);
		parse(sms, phone.id, date)
		res.send('OK')
	});
	
});

app.get('/data', function(req, res) {
	var id = req.param("id")
	Meal.find({ id: id }, function(err, meal) {
	  if (err) {
	  	res.json({success: false})
	  	return console.error(err);
	  }
	  console.dir(meal);
	  res.send(meal);
	});
	
});
//a
app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

//parsing stuff, separate later


var apiId = "48bb4311";
var apiKey = "7f49df0097a6aead808d9c25e0dd3544";
var keywords = "ate had drank and with I i an a for lunch dinner breakfast at in on";
var foodItem = "";

function parse(sms, id, date) {
		var message = sms.split(" ");
		console.log(id)
		console.log(date)
		for (i = 0; i < message.length; i++) {
			if(!isKeyword(message[i]))
				request({
						hash: id,
						date: date,
						name: message[i],
					    url: urlFood(message[i]),
					    headers: {
					        'X-Access-Token': 'at7ppmp352pkxjvgcrwb6wxk'
					    }}, callback)
		}
}

function isKeyword(word) {
	return keywords.indexOf(word) > -1;
}

//Food api file from Paul from here on, separate later
var name = "";
var id = "";
var category = "";
var type = "";

var carbs = "0";
var sugar = "0";
var fiber = "0";
var fat = "0";
var protein = "0";
var calories = "0"
var icon = "";

var icons = ["pizza", "cheeseburger", "burger", "fries", "coke", "soda", "sushi", "pasta", "taco", "burrito", "quesadilla", "cheesesteak", "hoagie", "sandwich", "salad", "soup"];

function urlFood(name) {
    return "https://api.foodcare.me/dishes/list/facts?q="+name+"&page=1&per_page=1";
}

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        id = info['edibles'][0]['id'];
        console.log(info);
        name = info.name;
        // type = info['edibles'][0]['description'];
        request({
			    url: urlId(id),
			    hash: info.hash,
			    date: info.date,
			    headers: {
			        'X-Access-Token': 'at7ppmp352pkxjvgcrwb6wxk'
			    }}, callback2);
    }
}

function urlId(id) {
    return "http://api.foodcare.me/dishes/show/"+id+"/facts";
}

function callback2(error, response, body) {
    if (!error && response.statusCode == 200) {

        var info = JSON.parse(body);
        // category = info['nutritional_facts'][0]['nutrient']['common_name'];
        nutritional_facts = info['nutritional_facts'];
        for (i = 0; i < nutritional_facts.length; i++) {
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Calories") {
                calories = info['nutritional_facts'][i]['nutritional_value'];
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Carbohydrate") {
                carbs = info['nutritional_facts'][i]['daily_value_rounded'];
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Sugar") {
                sugar = info['nutritional_facts'][i]['daily_value_rounded'];
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Fiber") {
                fiber = info['nutritional_facts'][i]['daily_value_rounded'];
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Total Fat") {
                fat = info['nutritional_facts'][i]['daily_value_rounded'];
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Protein") {
                protein = info['nutritional_facts'][i]['daily_value_rounded'];
            }
        }
        // type = info['nutritional_facts'][0]['nutritional_value'];
        // console.log(name + " " + id + " " + calories + " " + carbs + " " + sugar + " " + fiber + " " + fat + " " + protein);
        
        for (i = 0; i < icons.length; i++) {
            if (icons[i] == name) icon = icons[i];
        }


        var specs = {
            "food" : {
                "name" : name,
                "id" : id,
                "calories" : calories,
                "icon" : icon
            },
            "chart" : {
                "carbs": carbs,
                "sugar": sugar,
                "fiber": fiber,
                "fat": fat,
                "protein": protein
            }
        };
        console.log(info)
        var meal = new Meal({id: info.hash, date: info.date, food: name, specs: specs});
		console.log(meal)
		console.log(specs)
		meal.save(function (err, user) {
				if (err) return console.error(err);
		});
    }
}
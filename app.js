var express = require('express');
var crypto = require('crypto');
var request = require('request');
var bodyParser = require('body-parser');
var router = express.Router();
var _ = require('underscore');
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
	  	food: String,
	  	date: Date,
	  	group: String,
	  	specs: Object,
	  	carbs: String,
        sugar: String,
        fiber: String,
        fat: String,
        protein: String
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

  	var newUser = new User({phone: newPhone, id: hash});

  	newUser.save(function (err, user) {
				if (err) return console.error(err);
	});
 //  	User.update({phone: newPhone}, {phone: newPhone, id: hash}, {upsert: true}, function (err, user) {
	// 	if (err) return console.error(err);
	// })
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
	console.log("----------Meal incoming-----------");
	var phone = req.param("From");
	console.log(phone);
	var sms = req.param("Body");
	var date = Date.now();
	User.findOne({phone: phone}, function(err, phone) {
		if (err) return console.error(err);
		console.log(phone);
		console.log("ID1: " + phone.id);
		parse(sms, phone.phone, date)
		res.json({success: true})
	});
	
});


function addPercent (n1, n2) {
	var first = "";
	var second = "";
		for (i = 0; i < n1.length - 1; i ++) {
				first = first + n1[i];
		}
		for (i = 0; i < n2.length - 1; i ++) {
				second = second + n2[i];
		}
		// second = 
		console.log(parseInt(first) + parseInt(second));
		return parseInt(first) + parseInt(second);
}

var querryPhone = "";
app.get('/data', function(req, res) {
	var hash = req.param("id")
	var parsedDate = req.param("date")
	console.log(parsedDate);
	var d = new Date();
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();
	if (parsedDate == "m") {
		month -= 1;
	}
	else if (parsedDate == "w") {
		day -= 7;
	}
	else if (parsedDate === undefined) {
		year -= 10;
	}	
	console.log(month);
	console.log(day);
	User.findOne({ id: hash }, function(err, user) {
		if (err) {
		  	res.json({success: false})
		  	return console.error(err);
		}
		console.log(user);
		console.log(user.phone);
		querryPhone = user.phone;
		Meal.find({ id: querryPhone, date: { $lt: new Date(), $gte: new Date(year+','+month+','+day) }}, function(err, meals) {
			if (err) {
			  	res.json({success: false})
			  	return console.error(err);
			}
			var totalCarbs = 0;
			var totalSugar = 0;
			var totalFiber = 0;
			var totalFat = 0;
			var totalProtein = 0;
			var foods = [];
			console.log(totalSugar)
			//var obj = JSON.parse(meal);
			_.each(meals, function(item) {
				foods.push(item.specs);
				totalCarbs += parseInt(item.carbs);
				while (totalCarbs > 100) totalCarbs -= 100;
				totalSugar += parseInt(item.sugar);
				while (totalSugar > 100) totalSugar -= 100;
				totalFiber += parseInt(item.fiber);
				while (totalFiber > 100) totalFiber -= 100;
				totalFat += parseInt(item.fat);
				while (totalFat > 100) totalFat -= 100;
				totalProtein += parseInt(item.protein);
				while (totalProtein > 100) totalProtein -= 100;
			})
			
			if (totalCarbs === NaN || totalCarbs === null) totalCarbs = 0;
			if (totalSugar === NaN || totalSugar === null) totalSugar = 0;
			if (totalFiber === NaN || totalFiber === null) totalFiber = 0;
			if (totalFat === NaN || totalFat === null) totalFat = 0;
			if (totalProtein === NaN || totalProtein === null) totalProtein = 0;
			console.log(foods);
			console.log(totalCarbs);
			console.log(totalSugar);
			console.log(totalFiber);
			console.log(totalFat);
			console.log(totalProtein);

			var specs = {
		        "meals" : foods,
		        "chart" : {
		            "carbs": totalCarbs,
		            "sugar": totalSugar,
		            "fiber": totalFiber,
		            "fat": totalFat,
		            "protein": totalProtein
		        }
		     };
	     	res.send(specs);
		});
	});
});
//a
app.listen(process.env.PORT || 7002);

console.log('Express server listening on port ' + app.get('port'));

//parsing stuff, separate later


var apiId = "48bb4311";
var apiKey = "7f49df0097a6aead808d9c25e0dd3544";
var keywords = "ate had drank and with I i an a for lunch dinner breakfast at in on just";
var foodItem = "";

function parse(sms, id, date) {
		var message = sms.split(" ");
		for (i = 0; i < message.length; i++) {
			hashDB = id;
			dateDB = date;
			name = message[i];
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
var hashDB = "";
var dateDB = ""
var name = "";
var id = "";
var category = "";
var type = "";

var carbs = "0";
var sugar = "0";
var fiber = "0";
var fat = "0";
var protein = "0";
var calories = "0";


var icons = ["Pizza", "Taco", "Fries", "Assorted Sushi", "Cupcake", "Egg", "Chicken", "Cheeseburger", "Soda", "Steak", "Fish"];

function urlFood(name) {
    return "https://api.foodcare.me/dishes/list/facts?q="+name+"&page=1&per_page=1";
}

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        console.log("INFO!!!!!! " + info);
        if (info['edibles'].length == 0)
        	return;
        id = info['edibles'][0]['id'];
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
        var icon = "";
        dateDB = new Date();
        // category = info['nutritional_facts'][0]['nutrient']['common_name'];
        nutritional_facts = info['nutritional_facts'];
        for (i = 0; i < nutritional_facts.length; i++) {
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Calories") {
                calories = info['nutritional_facts'][i]['nutritional_value'];
                if (calories == null) calories = 0;
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Carbohydrate") {
                carbs = info['nutritional_facts'][i]['daily_value_rounded'];
                if (carbs == null) carbs = 0;
                else carbs = parseInt(carbs.substr(0,carbs.length));
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Sugar") {
                sugar = info['nutritional_facts'][i]['daily_value_rounded'];
                if (sugar == null) sugar = 0;
                else sugar = parseInt(sugar.substr(0,sugar.length));
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Fiber") {
                fiber = info['nutritional_facts'][i]['daily_value_rounded'];
                if (fiber == null) fiber = 0;
                else fiber = parseInt(fiber.substr(0,fiber.length));
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Total Fat") {
                fat = info['nutritional_facts'][i]['daily_value_rounded'];
                if (fat == null) fat = 0;
                else fat = parseInt(fat.substr(0,fat.length));
            }
            if (info['nutritional_facts'][i]['nutrient']['common_name'] == "Protein") {
                protein = info['nutritional_facts'][i]['daily_value_rounded'];
                if (protein == null) fat = 0;
                else protein = parseInt(protein.substr(0,protein.length));
            }
        }
        var innerName = info['name'];
        // type = info['nutritional_facts'][0]['nutritional_value'];
        // console.log(name + " " + id + " " + calories + " " + carbs + " " + sugar + " " + fiber + " " + fat + " " + protein);
        console.log(innerName);
        if (innerName == "Steakburger") innerName = "Steak";
        if (innerName == "Diet Soda") innerName = "Soda";
        if (innerName == "Bean Soup") innerName = "Soup";
        console.log("icon!!!!!!!!!!!!!!" + icons.indexOf(innerName))
        var index = icons.indexOf(innerName)
        if (index != -1)
        	icon = icons[index];

        var specs = {
            "food" : {
                "name" : innerName,
                "id" : id,
                "calories" : Math.floor(calories),
                "icon" : icon,
                "date" : new Date(dateDB)
            },
            "nutrition" : {
            	"carbs" : Math.floor(carbs),
            	"sugar" : Math.floor(sugar),
            	"fiber" : Math.floor(fiber),
            	"fat" : Math.floor(fat),
            	"protein" : Math.floor(protein)
            }
        };

        console.log(info)
        var meal = new Meal({id: hashDB, date: dateDB, food: innerName, specs: specs, carbs: carbs,
         sugar: sugar, fiber: fiber, fat: fat, protein: protein});
		console.log(meal)
		console.log(specs)
		meal.save(function (err, user) {
				if (err) return console.error(err);
		});
    }
}
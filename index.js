var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var cors = require('cors');
var AWS = require('aws-sdk');
var dynamoDBConfiguration = 
{
	accessKeyId : process.env.accessKeyId,
	secretAccessKey : process.env.secretAccessKey,
	region: process.env.region
	
};
var sortJsonArray = require('sort-json-array');
var tableName = 'user_queue';


//https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

AWS.config.update(dynamoDBConfiguration);

var port = process.env.PORT || 8081;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('API CALLED with request: %j',req);
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/queuedpeople')

	.get(function(req, res) {
		getQueuedPeople(json_payload=>{
			res.json(json_payload);
		});   
	})	
	.put(function(req, res) {
		putQueuedPerson(req.body, theResult=>{
			res.json({message:'person put!'});
		});
	});

router.get('/allpeople', function(req, res) {
    getAllPeople(json_payload=>{
			res.json(json_payload);
	});     
});
	

// more routes for our API will happen here


function getQueuedPeople(callback){
	
	var documentClient = new AWS.DynamoDB.DocumentClient();
	
	var scanQuery = {TableName: tableName,
             FilterExpression: 'handled = :handled',
			 ExpressionAttributeValues : {':handled' : 0}
	};
	documentClient.scan(scanQuery,(err, data) => {              //needing stringify on this for avoiding silent errors is ridiculous
				if (err) console.log("Error: " + err);
				else console.log("Success: " + JSON.stringify(data));
				var sortedData = sortJsonArray(data.Items,'proposed_time','asc');
				callback(sortedData);
	});	
}

function putQueuedPerson(payload, callback){
	var documentClient = new AWS.DynamoDB.DocumentClient();
	console.log("JSON Item: %j", payload); 
	
	documentClient.put({
             'TableName': tableName,
             'Item': payload
			},(err, data) => {              //needing stringify on this for avoiding silent errors is ridiculous
				if (err) console.log("Error: " + err);
				else console.log("Success: %j" + data);
				callback(data);
			});
}

function getAllPeople(callback){
	
	var documentClient = new AWS.DynamoDB.DocumentClient();
	
	var scanQuery = {TableName: tableName};
	
	documentClient.scan(scanQuery,(err, data) => {              //needing stringify on this for avoiding silent errors is ridiculous
				if (err) console.log("Error: " + err);
				else console.log("Success: " + JSON.stringify(data));
				var sortedData = sortJsonArray(data.Items,'name','asc');
				callback(sortedData);
	});	
}


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

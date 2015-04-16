var express = require('express');
var router = express.Router();
var moment = require('moment');
var cloudinary = require('cloudinary').v2;
var cas = require('grand_master_cas');
var feeds = require('../feeds.js');

module.exports = router;

var hostname = process.env.C9_HOSTNAME || "localhost:3000";



// =========================================================
// =
// =   SET UP CLOUDINARY (FOR IMAGE UPLOADS)
// =

var cloudinary_cloud_name = 'dc33d6a7t';
var cloudinary_api_key = '677438795361962';
var cloudinary_api_secret = '8O_fhleFyuKddNWJpUEcokTdTDo';

cloudinary.config({
  cloud_name: cloudinary_cloud_name,
  api_key: cloudinary_api_key,
  api_secret: cloudinary_api_secret
});

var cloudinary_cors = "http://" + hostname + "/cloudinary_cors.html";



// =========================================================
// =
// =   SET UP CAS (FOR YALE USER AUTHENTICATION)
// =

cas.configure({
  casHost: "secure.its.yale.edu",             // required
  ssl: true,                                  // default false, Yale requires true
  service: 'https://' + hostname + '/new',    // Absolute URL to where cas.bouncer should take you after successful login.
  redirectUrl: '/',                           // the route that cas.blocker will send to if not authed. Defaults to '/'
  sessionName: 'username'                     // get the netID from request.session.whatever - cas_user by default.
});




// =========================================================
// =
// =   SET UP MONGODB AND MONGOOSE
// =

// MongoDB is a JavaScript-oriented database.
// http://docs.mongodb.org/manual/core/crud-introduction/

// --> In Cloud9, you need to start MongoDB before running your app by typing 
// ./mongod 
// at the terminal ("bash" window). But you only need to do that once per workspace. 
// MongoDB should run forever after that.

// Mongoose makes it easy to access MongoDB using a pattern of "models".
// http://mongoosejs.com

// Use Mongoose to connect to the MongoDB database. We'll call our
// database "networks". It will be created automatically if it doesn't already exist.

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || ('mongodb://' + process.env.IP + '/networks'));




// =========================================================
// =
// =   DEFINE OUR DATA MODELS
// =

// Define the data structure of a Phrase model
// It has width, height, top, and left attributes, which are required to be numbers from 0–100
// And it has a color attribute, which is optionaland is a string (text)
// Allowed data types (Number, String, Date...): http://mongoosejs.com/docs/schematypes.html

var Phrase = mongoose.model('Phrase', {
  preposition: {type: String, required: true},
  noun: {type: String, required: true},
  image: {type: String},
  username: {type: String}
});





// =========================================================
// =
// =   WEB ROUTES
// =


// HOME PAGE
// /
// Shows _all_ the phrases

router.get('/', function(request, response, toss) {
  
  // When the server receives a request for "/", this code runs

  // Find all the Shape records in the database
  Phrase.find(function(err, phrases) {
    // This code will run once the database find is complete.
    // phrases will contain a list (array) of all the phrases that were found.
    // err will contain errors if any.

    // If there's an error, tell Express to do its default behavior, which is show the error page.
    if (err) return toss(err);
    
    // Go through all the phrases and a set color for each
    var colors = ['yellow', 'red', 'blue'];
    var color_num = 0;
    var phrase_num = 0;
    while (phrase_num < phrases.length) {
      phrases[phrase_num].color = colors[color_num];
      phrase_num += 1;
      color_num += 1;
      if (color_num >= colors.length) {
        color_num = 0;
      }
    }
    
    // The list of shapes will be passed to the template.
    // Any additional variables can be passed in a similar way (response.locals.foo = bar;)
    response.locals.phrases = phrases;
    
    // Also pass the temperature, wind direction, and next bus arrival.
    // This can crash if the data hasn't loaded for whatever reason, so toss to Express's error page in that case.
    try {
      
      // Use Moment.js to calculate the next bus arrival time minus the current time,
      // and display it in english e.g. "in 18 minutes".
      // http://momentjs.com/docs/#/displaying/from/ (returns difference as an english string e.g. "18 minutes")
      // http://momentjs.com/docs/#/displaying/difference/ (returns difference in milliseconds)
      var now = moment();
      var next_arrival = moment(feeds.bus[0].arrival_at);
      var arriving_in = next_arrival.from(now);
      var margin = next_arrival.diff(now) / 1000;
      // Emergency limit for unusual weather or poor service
      if (margin > 500) {
        margin = 500;
      }

      response.locals.temperature = feeds.weather.main.temp;
      response.locals.font_size = feeds.weather.main.temp / 2;
      response.locals.wind_direction = feeds.weather.wind.deg;
      response.locals.arriving_in = arriving_in;
      response.locals.margin = margin;
      response.locals.route = feeds.bus[0].route_id;
      
    }
    catch(err) {
      return toss(err);
    }

    response.locals.current_user = request.session.username;
    
    // layout tells template to wrap itself in the "layout" template (located in the "views" folder).
    response.locals.layout = 'layout';

    // Render the "home" template (located in the "views" folder).
    response.render('home');

  });
  
});




// SHOW PAGE
// /show?id=54e2058e85b156d10b064ca0
// Shows a _single_ phrase

router.get('/show', function(request, response, toss) {
  
  // When the server receives a request for "/show", this code runs
  
  // Find a Phrase with this id
  Phrase.findOne({_id: request.query.id}, function(err, phrase) {
    // This code will run once the database find is complete.
    // phrase will contain the found phrase.
    // err will contain errors if any (for example, no such record).

    if (err) return toss(err);
    
    if (phrase.image) {
      var image_url = cloudinary.url(phrase.image, {crop: "fit", width: 200, height: 200});
    }
    
    response.locals.phrase = phrase;
    response.locals.image_url = image_url;
    response.locals.current_user = request.session.username;
    response.locals.layout = 'layout';
    response.render('show');
    
  });
  
});



// NEW PAGE
// /new
// cas.bouncer means when you go to /new you'll be asked to log in if you aren't already,
// and then sent along to this action.

router.get('/new', cas.bouncer, function(request, response) {

  // When the server receives a request for "/new", this code runs

  console.log("Logged in user", request.session.cas_user);
  
  // Just render a basic HTML page with a form. 
  // Pass variables to set up the special image uploader button.

  response.locals.image_upload_tag = cloudinary.uploader.image_upload_tag('image', { callback: cloudinary_cors });
  response.locals.cloudinary_cloud_name = cloudinary_cloud_name;
  response.locals.cloudinary_api_key = cloudinary_api_key;

  response.locals.current_user = request.session.username;
  response.locals.layout = 'layout';
  
  response.render('new');
  
  // Please see views/new.hbs for additional comments
  
});



// CREATE PAGE
// /create?width=25&height=25&top=25&left=25&color=#ff0000
// Normally you get to this page by clicking "Submit" on the /new page, but
// you could also enter a URL like the above directly into your browser.
// cas.blocker means if you aren't already logged in, you'll be redirected to home
// because you shouldn't be here.

router.get('/create', cas.blocker, function(request, response, toss) {
  
  // When the server receives a request for "/create", this code runs
  
  response.locals.current_user = request.session.username;
  response.locals.layout = 'layout';

  // Process the uploaded image
  var preloaded_file = new cloudinary.PreloadedFile(request.query.image);
  if (preloaded_file.is_valid()) {
    var image = preloaded_file.identifier();
    console.log("Got image", image);
  }
  
  console.log("Logged in user", request.session.cas_user);

  // Make a new Phrase in memory, with the parameters that come from the URL 
  // ?width=25&height=25&top=25&left=25&color=#ff0000
  // and store it in the shape variable
  var phrase = new Phrase({
    preposition: request.query.preposition,
    noun: request.query.noun,
    image: image,
    username: request.session.username
  });
  
  // Now save it to the database
  phrase.save(function(err) {
    // This code runs once the database save is complete

    // An err here can be due to validations
    if (err) return toss(err);
    
    // Otherwise render a "thank you" page
    response.locals.phrase = phrase;
    response.render('create');
    
    // Alternatively we could just do
    // response.redirect('/');
    // to send the user straight to the homepage after saving the new shape

  });
  
});



// ABOUT PAGE
// /about

router.get('/about', function(request, response) {

  // When the server receives a request for "/about", this code runs

  response.locals.current_user = request.session.username;
  response.locals.layout = 'layout';
  response.render('about');
  
});



// LOGOUT PAGE
// /logout

router.get('/logout', cas.logout);

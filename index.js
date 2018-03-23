const express = require('express');
const handlebars = require('express-handlebars');
const jsonfile = require('jsonfile');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");

const FILE = 'pokedex.json';
const USERFILE = 'users.json';
let userDB;
jsonfile.readFile(USERFILE, (err, obj) => {
  userDB = obj;
})

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

// Set handlebars to be the default view engine
app.engine('handlebars', handlebars.create().engine);
app.set('view engine', 'handlebars');

// Set static folder
app.use(express.static('public'));

// Set up body-parser to automatically parse form data into object
app.use(bodyParser.urlencoded({ extended: true }));

// Set up method-override for PUT and DELETE forms
app.use(methodOverride('_method'));

app.use(cookieParser());

/**
 * ===================================
 * Routes
 * ===================================
 */

app.get('/users/new', (request, response) => {
  response.render('new_user');
})

app.post('/users', (request, response) => {
  let usernameInput = request.body.username;
  let passwordInput = request.body.password;
  let userObj = {};
  bcrypt.hash(passwordInput, 10, (err, hash) => {
    userObj["username"] = usernameInput;
    userObj["passwordHash"] = hash;
    userDB.users.push(userObj);
    jsonfile.writeFile(USERFILE, userDB, {spaces: 2}, (err) => {
      if (err) {
        console.log(err);
      }
    })
  })
  response.cookie('loggedIn', true);
  response.redirect('/');
})

app.get('/users/login', (request, response) => {
  response.render('login');
})

app.post('/users/login', (request, response) => {
  let usernameInput = request.body.username;
  let passwordInput = request.body.password;
  let user = userDB.users.find((user) => {
    return user.username === usernameInput;
  });

  bcrypt.compare(passwordInput, user.passwordHash, function(err, auth) {
    if (auth === true) {
      response.cookie('loggedIn', true);
      response.redirect('/');
    } else {
      response.send("Invalid password");
    }
  })
})

app.get('/users/logout', (request, response) => {
  response.clearCookie("loggedIn");
  response.redirect('/');
})

app.get('/new', (request, response) => {
  // send response with some data
  response.render('new');
});

app.get('/:id/edit', (request, response) => {
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);

    // attempt to retrieve the requested pokemon
    let inputId = request.params.id;
    let pokemon = obj.pokemon.find(currentPokemon => {
      return currentPokemon.id === parseInt(inputId, 10);
    });

    if (pokemon === undefined) {
      // return 404 HTML page if pokemon not found
      response.render('404');
    } else {
      // return edit form HTML page if found
      let context = {
        pokemon: pokemon
      };

      response.render('edit', context);
    }
  });
});

app.get('/:id', (request, response) => {
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);

    // attempt to retrieve the requested pokemon
    let inputId = request.params.id;
    let pokemon = obj.pokemon.find(currentPokemon => {
      return currentPokemon.id === parseInt(inputId, 10);
    });

    if (pokemon === undefined) {
      // return 404 HTML page if pokemon not found
      response.render('404');
    } else {
      // return pokemon HTML page if found
      let context = {
        pokemon: pokemon
      };

      response.render('pokemon', context);
    }
  });
});

app.get('/', (request, response) => {
  let loggedIn;
  if ("loggedIn" in request.cookies) {
    loggedIn = true; 
  } else {
    loggedIn = false;
  };
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);
    response.render('home', { pokemon: obj.pokemon,
                              user: {"logged_in": loggedIn},
                            });
  });
});

app.post('/', (request, response) => {
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);

    let newPokemon = request.body;
    obj.pokemon.push(newPokemon);

    jsonfile.writeFile(FILE, obj, err2 => {
      if (err2) console.error(err2);
      response.render('home', { pokemon: obj.pokemon });
    });
  });
});

app.put('/:id', (request, response) => {
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);

    // attempt to retrieve the requested pokemon
    let inputId = request.params.id;
    let updatedPokemon = request.body;

    for (let i = 0; i < obj.pokemon.length; i++) {
      let currentPokemon = obj.pokemon[i];

      if (currentPokemon.id === parseInt(inputId, 10)) {
        // convert input id from string to number before saving
        updatedPokemon.id = parseInt(updatedPokemon.id, 10);

        // update pokedex object
        obj.pokemon[i] = updatedPokemon;
      }
    }
    // save pokedex object in pokedex.json file
    jsonfile.writeFile(FILE, obj, err2 => {
      if (err2) console.error(err2);

      // redirect to GET /:id
      response.redirect(`/${request.params.id}`);
    });
  });
});

app.delete('/:id', (request, response) => {
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);

    // attempt to retrieve the requested pokemon
    let inputId = request.params.id;

    for (let i = 0; i < obj.pokemon.length; i++) {
      let currentPokemon = obj.pokemon[i];

      if (currentPokemon.id === parseInt(inputId, 10)) {
        // convert input id from string to number before saving
        obj.pokemon.splice(i, 1);
      }
    }
    // save pokedex object in pokedex.json file
    jsonfile.writeFile(FILE, obj, err2 => {
      if (err2) console.error(err2);

      // redirect to GET /:id
      response.redirect('/');
    });
  });
});

/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
app.listen(3000, () =>
  console.log('~~~ Tuning in to the waves of port 3000 ~~~')
);

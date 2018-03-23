const express = require('express');
const handlebars = require('express-handlebars');
const jsonfile = require('jsonfile');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const FILE = 'pokedex.json';

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


app.get('/users', (request, response) => {
  jsonfile.readFile('users.json', (err, obj) => {
    let users = [];
    if (obj) {
      let keys = Object.keys(obj);
      for (let i in keys) {
        users.push(keys[i]);
      }
    }
    console.log(users);
    let context = {
      users: users
    };

    response.render('users', context);
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
  jsonfile.readFile(FILE, (err, obj) => {
    if (err) console.error(err);
    let context = {
      pokemon: obj.pokemon,
      login: request.cookies.login
    };
    // console.log(typeof(request.cookies.login));
    response.render('home', context);
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



app.get('/users/new', (request, response) => {
  // send response with some data
  response.render('new_user');
});

app.post('/users', (request, response) => {
  let username = request.body.username;
  let password = request.body.password;
  // console.log(request.body.username);
  bcrypt.hash(password, 1, (err, hash) => {

    jsonfile.readFile('users.json', (err, obj) => {
      if (obj) {
        obj[username] = hash;
      }
      else {
        obj = {};
        obj[username] = hash;
      }
      // console.log("obj: ", obj);
      jsonfile.writeFile('users.json', obj, (err) => {
        if (err) console.log(err);
        response.cookie('login', true);
        response.redirect("/");
      });
    });
  });
});

app.post('/users/logout', (request, response) => {
  // response.cookie('login');
  response.clearCookie('login');
  response.redirect("/");
});

app.get(`/users/login`, (request, response) => {
  response.render('login');
});

app.post('/users/login', (request, response) => {
  let textPassword = request.body.password;
  let username = request.body.username;
  jsonfile.readFile('users.json', (err, obj) => {
    let hashPassword = obj[username];
    bcrypt.compare(textPassword, hashPassword, (err, res) => {
      if (res) {
        console.log('here');
        response.cookie('login', true);
        response.redirect("/");
      }
      else {
        console.log('there');

        response.clearCookie('login');
        response.redirect("/users/login");
      }
    })

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

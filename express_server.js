/*-----------------
-- EXPRESS SETUP --
-----------------*/

const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const helpers = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080 (works with vagrant rerouting)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'session', secret: 'nalgene' }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));

app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

/*------------------
-- DB VARIABLES --
------------------*/

const urlDatabase = {};
const userDatabase = {};

/*------------------
-- ROUTE HANDLERS --
------------------*/

// GET handler for root URL page rerouting
app.get('/', (req, res) => {
  const user = userDatabase[req.session.userId];
  return user ? res.redirect('/urls') : res.redirect('/login');
});

// GET handler for the main URLs page
app.get('/urls', (req, res) => {
  const user = userDatabase[req.session.userId];
  const filteredUrlDatabase = user
    ? helpers.getUserUrls(user.id, urlDatabase)
    : null;
  const templateVars = { filteredUrlDatabase, user };
  res.render('urls_index', templateVars);
});

// GET handler for 'Create New URL' page
app.get('/urls/new', (req, res) => {
  const user = userDatabase[req.session.userId];
  const templateVars = { user };
  return user ? res.render('urls_new', templateVars) : res.redirect('/login');
});

// GET handler for the login page
app.get('/login', (req, res) => {
  const user = userDatabase[req.session.userId];
  if (!user) {
    const templateVars = { user };
    res.render('login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

// GET handler for the registration page
app.get('/register', (req, res) => {
  const user = userDatabase[req.session.userId];
  if (!user) {
    const templateVars = { user };
    res.render('register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

// GET handler for shortURL edit pages
app.get('/urls/:shortURL', (req, res) => {
  const user = userDatabase[req.session.userId];
  const shortURL = req.params.shortURL;
  if (user && helpers.getUserUrls(user.id, urlDatabase)[shortURL]) {
    const templateVars = {
      user,
      shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL'],
      authorized: true,
    };
    res.render('urls_show', templateVars);
  } else {
    const templateVars = {
      user: null,
      shortURL: null,
      longURL: null,
      authorized: false
    };
    res.render('urls_show', templateVars);
  }
});

// GET handler for shortURL redirects
app.get('/u/:shortURL', (req, res) => {
  const user = userDatabase[req.session.userId];
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]['longURL'];
    return res.redirect(longURL);
  } else {
    const templateVars = { user };
    return res.render('u_invalid', templateVars);
  }
});

// GET handler for all unconfigured requests
app.get('*', (req, res) => {
  const user = userDatabase[req.session.userId];
  const templateVars = { user, errorMsg: '404 Page Not Found' };
  res.status(404).render('error_page', templateVars);
});

// POST handler for user registrations
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Registration error handling
  if (email && password && !helpers.getUserByEmail(email, userDatabase)) {
    const newUserId = helpers.makeNewKey();
    const hashedPassword = bcrypt.hashSync(password, 10);
    userDatabase[newUserId] = {
      id: newUserId,
      email,
      password: hashedPassword,
    };
    req.session.userId = newUserId;
    res.redirect('/urls');
    console.log(userDatabase);
  } else {
    const user = userDatabase[req.session.userId];
    const templateVars = { user, errorMsg: '400 Bad Request' };
    res.status(400).render('error_page', templateVars);
  }
});

// POST handler for logins
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = helpers.getUserByEmail(email, userDatabase);
  // login error handling and authorization
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/urls');
  } else {
    const user = userDatabase[req.session.userId];
    const templateVars = { user, errorMsg: '403 Forbidden' };
    res.status(403).render('error_page', templateVars);
  }
});

// POST handler for logouts
app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});

// POST handler for URL creations
app.post('/urls', (req, res) => {
  const user = userDatabase[req.session.userId];
  if (user) {
    const randomStr = helpers.makeNewKey();
    urlDatabase[randomStr] = { longURL: req.body.longURL, userID: user.id };
    return res.redirect(`/urls/${randomStr}`);
  } else {
    return res.redirect('/urls');
  }
});

// PUT hanlder for URL edits
app.put('/urls/:shortURL', (req, res) => {
  const user = userDatabase[req.session.userId];
  const shortURL = req.params.shortURL;
  if (user && helpers.getUserUrls(user.id, urlDatabase)[shortURL]) {
    const newURL = req.body.newURL;
    urlDatabase[shortURL]['longURL'] = newURL;
  }
  return res.redirect('/urls');
});

// DELETE handler for URL deletions
app.delete('/urls/:shortURL/delete', (req, res) => {
  const user = userDatabase[req.session.userId];
  const shortURL = req.params.shortURL;
  if (user && helpers.getUserUrls(user.id, urlDatabase)[shortURL]) {
    delete urlDatabase[shortURL];
  }
  return res.redirect('/urls');
});

/*-----------------
-- EXPRESS SETUP --
-----------------*/

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080 (works with vagrant rerouting)

// Middleware config
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

/*------------------
-- TEST VARIABLES --
------------------*/

const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'LmjMRm',
  },
  fsm5xK: {
    longURL: 'http://www.google.com',
    userID: 'P22Wyk',
  },
};

const users = {
  LmjMRm: {
    id: 'LmjMRm',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  P22Wyk: {
    id: 'P22Wyk',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

/*--------------------
-- GLOBAL FUNCTIONS --
--------------------*/

// Generates a random key for usernames or shortURLs
const generateRandomString = () => {
  const chars =
    '01234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars[Math.floor(Math.random() * 63)];
  }
  return randomStr;
};

// Retrieves a user object given their email
const findUserByEmail = email => {
  for (let user in users) {
    if (users[user]['email'] === email) return users[user];
  }
};

// Finds a user object given their request cookie
const findUserByCookies = cookies => {
  return cookies ? users[cookies['user_id']] : null;
};

// Retrieves all url objects that were made by a given user
const getUserUrls = id => {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userID'] === id) userUrls[url] = urlDatabase[url];
  }
  return userUrls;
};

/*------------------
-- ROUTE HANDLERS --
------------------*/

// GET handler for the main URLs page
app.get('/urls', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const filteredUrlDatabase = user ? getUserUrls(user.id) : null;
  const templateVars = { filteredUrlDatabase, user };
  res.render('urls_index', templateVars);
});

// GET handler for 'Create New URL' page
app.get('/urls/new', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const templateVars = { user };
  user ? res.render('urls_new', templateVars) : res.redirect('/login');
});

// GET handler for the login page
app.get('/login', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const templateVars = { user };
  res.render('login', templateVars);
});

// GET handler for the registration page
app.get('/register', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const templateVars = { user };
  res.render('register', templateVars);
});

// GET handler for shortURL edit pages
app.get('/urls/:shortURL', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const shortURL = req.params.shortURL;
  if (user && getUserUrls(user.id)[shortURL]) {
    const templateVars = {
      user,
      shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL'],
    };
    res.render('urls_show', templateVars);
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

// GET handler for shortURL redirects
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

// GET handler for all unconfigured requests
app.get('*', (req, res) => {
  res.statusCode = '404';
  res.send('404 Page Not Found');
});

// POST handler for user registrations
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Registration error handling
  if (email && password && !findUserByEmail(email)) {
    const newUserId = generateRandomString();
    users[newUserId] = { id: newUserId, email, password };
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  } else {
    res.statusCode = '400';
    res.send('400 Bad Request');
  }
});

// POST handler for logins
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);
  // login error handling and authorization
  if (user && user.password === password) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  } else {
    res.statusCode = '403';
    res.send('403 Forbidden');
  }
});

// POST handler for logouts
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// POST handler for URL creations
app.post('/urls', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const randomStr = generateRandomString();
  urlDatabase[randomStr] = { longURL: req.body.longURL, userID: user.id };
  res.redirect(`/urls/${randomStr}`);
});

// POST hanlder for URL edits
app.post('/urls/:shortURL', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const shortURL = req.params.shortURL;
  if (user && getUserUrls(user.id)[shortURL]) {
    const newURL = req.body.newURL;
    urlDatabase[shortURL]['longURL'] = newURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

// POST handler for URL deletions
app.post('/urls/:shortURL/delete', (req, res) => {
  const user = findUserByCookies(req.cookies);
  const shortURL = req.params.shortURL;
  if (user && getUserUrls(user.id)[shortURL]) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

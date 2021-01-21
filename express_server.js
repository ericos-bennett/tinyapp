const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080 (works with vagrant rerouting)

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

// Initialize the dummy database variables
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'LmjMRm'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: '322Wyk'
  }
};

const users = {
  "LmjMRm": {
    id: "LmjMRm",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "322Wyk": {
    id: "322Wyk",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Function to generate a new shortURL string
const generateRandomString = () => {
  const chars = '01234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars[Math.floor(Math.random() * 63)];
  }
  return randomStr;
};

// Function to retrieve a user object given their email
const findUserByEmail = (email) => {
  for (let user in users) {
    if (users[user]['email'] === email) return users[user];
  }
};

// Function to retrieve all users that were made by a given user
const urlsForUser = (id) => {
  let userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) userUrls[url] = urlDatabase[url];
  }
  return userUrls;
};

/*
//
HANDLERS
//
*/

// GET handler for the main URLs page (dynamically rendered with EJS)
app.get('/urls', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const filteredUrlDatabase = user ? urlsForUser(user.id) : null;
  const templateVars = { filteredUrlDatabase, user };
  res.render('urls_index', templateVars);
});

// POST handler for new URL form submission
app.post('/urls', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const randomStr = generateRandomString();
  urlDatabase[randomStr] = { longURL: req.body.longURL, userID: user.id };
  console.log(urlDatabase);
  res.redirect(`/urls/${randomStr}`);
});

// GET handler for the login page
app.get('/login', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  res.render('login', templateVars);
});

// POST handler for a login
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

// POST handler for a logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


// GET handler for 'Create New URL' page
app.get("/urls/new", (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  user ? res.render("urls_new", templateVars) : res.redirect('/login');
});

// POST handler for URL deletions
app.post('/urls/:shortURL/delete', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const shortURL = req.params.shortURL;
  if (user && urlsForUser(user.id)[shortURL]) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

// GET handler for shortURLs (using express route parameters)
app.get("/urls/:shortURL", (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const shortURL = req.params.shortURL;
  if (user && urlsForUser(user.id)[shortURL]) {
    const templateVars = {
      user,
      shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL'],
    };
    res.render("urls_show", templateVars);
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

// POST hanlder for URL edits
app.post('/urls/:shortURL', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const shortURL = req.params.shortURL;
  if (user && urlsForUser(user.id)[shortURL]) {
    const newURL = req.body.newURL;
    urlDatabase[shortURL]['longURL'] = newURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect('/urls'); // Give this a prompt instead of a redirect? Also clean up error pages
  }
});

// GET handler for the registration page
app.get('/register', (req, res) => {
  const user = req.cookies ? users[req.cookies['user_id']] : null;
  const templateVars = { user };
  res.render('register', templateVars);
});

// POST handler for user registration
app.post('/register', (req, res) => {
  // Registration error handling
  if (req.body.email && req.body.password && !findUserByEmail(req.body.email)) {
    const newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  } else {
    res.statusCode = '400';
    res.send('400 Bad Request');
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

// Initialize listener
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

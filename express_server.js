const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080; // default port 8080 (works with vagrant rerouting)

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

// Initialize the dummy database variale
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// GET handler for index page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET handler for the main URLs page (dynamically rendered with EJS)
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// POST handler for new URL form submission
app.post('/urls', (req, res) => {
  console.log(req.body);
  const randomStr = generateRandomString();
  urlDatabase[randomStr] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${randomStr}`);
});

// GET handler for 'Create New URL' page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// GET handler for shortURLs (using express route parameters)
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// GET handler for shortURL redirects
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Initialize listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

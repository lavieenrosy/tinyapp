const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//list of URLs

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//handles long URL edits

app.post("/urls/:id", (req, res) => {
  let newURL = req.body.longURL;
  let targetURL = req.params.id;
  urlDatabase[targetURL] = newURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});

//get route to render the urls_new.ejs template in the browser and present the form to the user

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

//post route to handle form submission

app.post("/urls", (req, res) => {
  let submittedLongURL = `http://${req.body.longURL}`;
  let newlyGeneratedShortURL = generateRandomString();
  urlDatabase[newlyGeneratedShortURL] = submittedLongURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${newlyGeneratedShortURL}`);
  // res.send("Ok");
});

//request to handle deleted short URLs

app.post("/urls/:id/delete", (req, res) => {
  let targetURL = req.params.id;
  delete urlDatabase[targetURL];
  res.redirect("/urls");
});

//displays url entry

app.get("/urls/:id", (req, res) => {
  let templateVars = { username: req.cookies["username"], shortURL: req.params.id, longURL: urlDatabase };
  res.render("urls_show", templateVars);
});

//handles shortURL requests by redirecting to longURL

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//route for login submission

app.post("/login", (req, res) => {
  let username = req.body.username;
  console.log(username);
  res.cookie("username", username);
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let randomString = "";
  const possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++) {
    randomString += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
  }
  return randomString;
}

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });
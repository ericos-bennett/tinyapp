// Generates a random 6 character key for usernames or shortURLs
const makeNewKey = () => {
  const chars =
    '01234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars[Math.floor(Math.random() * 63)];
  }
  return randomStr;
};

// Retrieves a user object given their email
const findUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user]['email'] === email) return users[user];
  }
};

// Retrieves all url objects that were made by a given user
const getUserUrls = (id, urls) => {
  let userUrls = {};
  for (let url in urls) {
    if (urls[url]['userID'] === id) userUrls[url] = urls[url];
  }
  return userUrls;
};

module.exports = {
  makeNewKey,
  findUserByEmail,
  getUserUrls,
};

const jwt = require("jsonwebtoken");
const blogModel = require("../models/blogModel");

const authentication = async function (req, res, next) {
  try {
    const token = req.headers["x-api-key"]; //Setting token from the header
    if (!token) {
      //Checking if token having value
      return res
        .status(401)
        .send({ status: false, msg: "Token does not exist" });
    }
    const decodeToken = jwt.verify(token, "SECRET-OF-GROUP28"); //Decoding loggedin person token
    //console.log(decodeToken);
    if (!decodeToken) {
      return res.status(401).send({ status: false, msg: "Token is invalid" });
    }
    req.loggedInAuthor = decodeToken.authorId;
    next();
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

const authorisation = async function (req, res, next) {
  try {
    const token = req.headers["x-api-key"]; //Setting token from the header
    const decodeToken = jwt.verify(token, "SECRET-OF-GROUP28"); //Decoding loggedin person token
    const loggedInAuthorId = decodeToken.authorId;
    if(req.body.author_id){
    var authorId=req.body.author_id
    }
    //Comparing loggedIn author's Id with the author's Id which data is to be modified
    if (authorId!==undefined&&loggedInAuthorId !== authorId) {
      return res.status(403).send({
        status: false,
        msg: "Author has no permission to change other author's blog",
      });
    }
    req.loggedInAuthor = loggedInAuthorId;
    next();
  } catch (err) {
    return res.status(500).send({
      status: false,
      msg: err.message,
    });
  }
};
module.exports.authentication = authentication;
module.exports.authorisation = authorisation;

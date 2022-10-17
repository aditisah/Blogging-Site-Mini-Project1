const AuthorModel = require("../models/authorModel");
var validator = require("email-validator");
const authorModel = require("../models/authorModel");
const jwt = require("jsonwebtoken");
//const blogModel = require("../models/blogModel");

const isRequestBodyValid = function (reqBody) {
  if (Object.keys(reqBody).length > 0) return true;
};

//<---------------------Author signing up--------------->
const createAuthor = async function (req, res) {
  try {
    let author = req.body;
    let validPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;
    let validName = /^[A-Za-z ]+$/;
    const isValidTitle = function (title) {
      let enumValues = ["Mr", "Mrs", "Miss"];
      if (enumValues.indexOf(title) !== -1) return true;
    };

    if (!isRequestBodyValid(author)) {
      res
        .status(400)
        .send({ status: false, msg: "Please Provide Author's Details" });
      return;
    }
    if (typeof author.fname === "undefined" || author.fname === null) {
      res
        .status(400)
        .send({ status: false, msg: "FirstName is either undefined or null" });
      return;
    }
    if (!author.fname) {
      res.status(400).send({ status: false, msg: "Please Enter FirstName" });
      return;
    }
    if (typeof author.fname !== "string" || !validName.test(author.fname)) {
      res.status(400).send({ status: false, msg: "Enter valid  FirstName" });
      return;
    }
    if (!author.lname) {
      res.status(400).send({ status: false, msg: "Please Enter LastName" });
      return;
    }
    if (typeof author.lname !== "string" || !validName.test(author.lname)) {
      res.status(400).send({ status: false, msg: "Enter valid LastName" });
      return;
    }
    if (!author.title) {
      res.status(400).send({ status: false, msg: "Please Enter Title" });
      return;
    }
    if (!isValidTitle(author.title)) {
      res.status(400).send({ status: false, msg: "Enter valid Title" });
      return
    }
    if (!author.password) {
      res.status(400).send({ status: false, msg: "Please Enter Password" });
      return;
    }
    if (
      typeof author.password !== "string" ||
      !validPassword.test(author.password)
    ) {
      res.status(400).send({ status: false, msg: "Enter valid Password" });
      return;
    }
    if (author.password.length < 8) {
      res
        .status(400)
        .send({ status: false, msg: "Length Of password should be atleast 8" });
      return;
    }
    if (author.password.length > 12) {
      res
        .status(400)
        .send({ status: false, msg: "Length of password is exceeding" });
      return;
    }
    if (!author.email) {
      res.status(400).send({ status: false, msg: "Please Enter email" });
      return;
    }
    let isEmailValid = validator.validate(author.email);
    if (!isEmailValid) {
      res
        .status(400)
        .send({ status: false, msg: "Please enter valid Email Id" });
      return;
    } else {
      let authorsData = await authorModel.find();
      authorsData.map((el) => {
        if (el.email === author.email) {
          res
            .status(400)
            .send({ status: false, msg: "Email Id already exists" });
          return;
        }
      });
    }
    let authorCreated = await authorModel.create(author);
    res.status(201).send({ status: true, data: authorCreated });
    return;
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
    return;
  }
};

//<--------------------------login author----------------------->

const login = async function (req, res) {
  try {
    const credentials = req.body;
    if (!isRequestBodyValid(credentials)) {
      res
        .status(400)
        .send({ status: false, msg: "Please Provide login credentials" });
      return;
    }
    if (!validator.validate(credentials.email)) {
      res
        .status(400)
        .send({ status: false, msg: "Please Enter Valid Email Id" });
      return;
    }
    const { userName, password } = credentials;
    let logIn = await authorModel.findOne({
      userName,
      password,
    });
    if (!logIn)
      return res.status(400).send({
        status: false,
        msg: "username and password is not correct",
      });
    //Generating Token
    const token = jwt.sign(
      {
        authorId: logIn._id.toString(),
      },
      "SECRET-OF-GROUP28"
    );
    res.setHeader("x-api-key", token);
    res.status(200).send({
      status: true,
      msg: "You are Logged in!!",
      data: { token },
    });
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

module.exports.createAuthor = createAuthor;
module.exports.login = login;

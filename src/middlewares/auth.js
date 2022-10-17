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
    console.log(decodeToken);
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
    const blogId = req.params.blogId;
    const filterData = req.query;
    let filter = {};
    if (filterData.category) {
      filter.category = filterData.category.trim();
    }
    if (filterData.tags) {
      let tagArr = filterData.tags.split(",").map((x) => x.trim());
      filter.tags = { $in: tagArr };
    }
    if (filterData.subcategory) {
      let subcategoryArr = filterData.subcategory.split(",").map((x) => x.trim());
      filter.subcategory = { $in: subcategoryArr };
    }
    if(filterData.isPublished){
      isPublishedValInStr = filterData.isPublished.trim();
      if(isPublishedValInStr === 'true'){
        filter.isPublished = true
      }
      filter.isPublished = false
    }
    let authorIdToBeModified;
    if (blogId) {
      let author = await blogModel
        .findById({ _id: blogId })
        .select({ author_id: 1 }); //Fetching author id using blogId
      if (!author) {
        return res.send({ status: false, msg: "No Blog found" });
      }
      authorIdToBeModified = author.author_id.toString();
    } else {
      //getting authorId from query param if Blogid is not given in path param
      console.log(filter);
      let author = await blogModel.find(filter);
      console.log(author);
      if (author.length === 0) {
        return res.status(400).send({ status: false, msg: "Blog not found" });
      }

      let filteredAuthor = author.filter(
        (blog) => blog.author_id.toString() === loggedInAuthorId
      );
      filteredAuthor.map(
        (el) => (authorIdToBeModified = el.author_id.toString())
      );
    }
    //Comparing loggedIn author's Id with the author's Id which data is to be modified
    if (loggedInAuthorId !== authorIdToBeModified) {
      return res.status(403).send({
        status: false,
        msg: "Author has no permission to change other author's blog",
      });
    }
    req.loggedInAuthor = decodeToken.authorId;
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

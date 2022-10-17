const { response } = require("express");
const authorModel = require("../models/authorModel");
const blogModel = require("../models/blogModel");

//<----------------Creating Blod------------------->
const createBlog = async function (req, res) {
  try {
    let newBlogEntry = req.body;
    const isRequestBodyValid = function (reqBody) {
      if (Object.keys(reqBody).length > 0) return true;
    };
    if (!isRequestBodyValid(newBlogEntry)) {
      res
        .status(400)
        .send({ status: false, msg: "Please Provide Blog's Details" });
      return;
    }
    //Validations
    if (!newBlogEntry.title) {
      return res
        .status(404)
        .send({ status: false, msg: "Please Enter Title!" });
    }
    if (!newBlogEntry.body) {
      res.status(400).send({ status: false, msg: "Please Enter body!" });
      return;
    }
    if (!newBlogEntry.author_id) {
      res.status(400).send({ status: false, msg: "Please Enter Author id" });
      return;
    }
    // if (newBlogEntry.author_id !== req.loggedInAuthor) {
    //   return res
    //     .status(400)
    //     .send({ status: false, msg: "Entering invalid authorId" });
    // }
    isAuthorIdExist = await authorModel.findOne({_id: newBlogEntry.author_id});
    if(!isAuthorIdExist){
      res.status(400).send({ status: false, msg: "Please Enter valid Author id" });
      return;
    }
    if (!newBlogEntry.tags || newBlogEntry.tags.length === 0) {
      res.status(400).send({ status: false, msg: "Please Enter tags" });
      return;
    }
    if (!newBlogEntry.category) {
      res.status(400).send({ status: false, msg: "Please Enter category" });
      return;
    }
    if (typeof newBlogEntry.title !== "string") {
      res.status(400).send({ status: false, msg: "Enter valid title" });
      return;
    }
    if (typeof newBlogEntry.body !== "string") {
      res.status(400).send({ status: false, msg: "Enter valid body" });
      return;
    }
    //creating new document with given entry in body
    let newBlog = await blogModel.create(newBlogEntry);
    return res.status(201).send({
      status: true,
      data: { newBlog },
    });
  } catch (err) {
    return res.status(500).send({ Error: err.message });
  }
};


//<--------------------------Fetching Blog------------>

const getBlog = async function (req, res) {
  try {
    let data = req.query;
    //creating an object with 2 attributes
    filter = {
      isDeleted: false,
      isPublished: true,
    };
    //For filling filter object on the basis of field
    //given in query param for fileration in blogs collection
    if (data.category) {
      filter.category = data.category.trim();
    }
    if (data.author_id) {
      filter.author_id = data.author_id.trim();
    }
    if (data.tags) {
      let tagArr = data.tags.split(",").map((x) => x.trim());
      filter.tags = { $in: tagArr };
    }
    if (data.subcategory) {
      let subcategoryArr = data.subcategory.split(",").map((x) => x.trim());
      filter.subcategory = { $in: subcategoryArr };
    }
    let filteredBlog = await blogModel.find(filter);
    if (filteredBlog.length === 0) {
      return res.status(404).send({ status: false, msg: "No Blog found" });
    }
    return res.status(200).send({ status: true, data: { filteredBlog } });
  } catch (err) {
    return res.status(500).send({ Error: err.message });
  }
};

//<----------------------------Updating Blog----------------------->

const updateBlog = async function (req, res) {
  try {
    const blogId = req.params.blogId;
    const blogDocument = req.body;
    if (Object.keys(blogDocument).length === 0) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Enter Details to update" });
    }
     //Finding the document in the blogs collection on the basis of blogId given in path param
    let isBlogIdExists = await blogModel.findOne({
      $and: [{ _id: blogId }, { isDeleted: false }],
    });
    //Checking If blog is deleted
    if (!isBlogIdExists) {
      return res.status(404).send({
        status: false,
        msg: "Blog does not exist!!",
      });
    }
    //updating blog with given entries in body If blog is not deleted
    let timeStamps = new Date();
    if(blogDocument.title){
      isBlogIdExists.title = blogDocument.title
    }
    if(blogDocument.body){
      isBlogIdExists.body = blogDocument.body
    }
    if(blogDocument.category){
      isBlogIdExists.category = blogDocument.category
    }
    if(blogDocument.tags){
      isBlogIdExists.tags.push(...blogDocument.tags)
    }
    if(blogDocument.subcategory){
      isBlogIdExists.subcategory.push(...blogDocument.subcategory)
    }
    //Checking for valid authorId from body
    if(blogDocument.author_id){
      if (blogDocument.author_id !== req.loggedInAuthor) {
        return res
          .status(400)
          .send({ status: false, msg: "Entering invalid authorId" });
      }
      
    }
    if (blogDocument.isPublished === true) {
      isBlogIdExists.isPublished = true;
      isBlogIdExists.publishedAt = timeStamps;
    }
    if(blogDocument.isPublished === false){
      isBlogIdExists.publishedAt = ''
    }
    
    const updatedBlog = await blogModel.findByIdAndUpdate(
      { _id: blogId },
      { $set: isBlogIdExists },
      { new: true }
    );
    
    return res.status(200).send({
      status: true,
      data: {
        updatedBlog,
      },
    });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

//<----------------------Deleting Blog----------------------------->

const deleteBlog = async function (req, res) {
  try {
    const blogId = req.params.blogId;
    //Fetching undeleted blog which having blogId from collection
    const getblog = await blogModel.findOne({ _id: blogId , isDeleted: false });
    //Deleting the blog If undeleted blog with given blogId exists
    if (getblog) {
      let timeStamp = new Date();
      let deletedBlog = await blogModel.findOneAndUpdate(
        { _id: getblog._id },
        { $set: { isDeleted: true, deletedAt: timeStamp } },
        { new: true }
      );
      return res.status(200).send({
        status: true,
        msg: "Blog is deleted",
      });
    }
    //Giving response when undeleted with given blogId does not exist
    return res.status(404).send({
      status: false,
      msg: "Blog is not found",
    });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

//<----------------------Delete filered Blogs--------------------->

const deleteBlogsBySelection = async function (req, res) {
  try {
    let data = req.query;
    //Validations
    if(Object.keys(data).length === 0){
      res.status(400).send({status: false, msg: 'Please select filters'})
      return
    }
    //For filling filter object on the basis of field
    //given in query param for fileration in blogs collection
    filter = {
      isDeleted: false,
    };
    if (data.category) {
      filter.category = data.category.trim();
    }
    if (data.author_id) {
      filter.author_id = data.author_id.trim();
    }
    if (data.tags) {
      let tagArr = data.tags.split(",").map((x) => x.trim());
      filter.tags = { $in: tagArr };
    }
    if (data.subcategory) {
      let subcategoryArr = data.subcategory.split(",").map((x) => x.trim());
      filter.subcategory = { $in: subcategoryArr };
    }
    if(data.isPublished){
      isPublishedValInStr = data.isPublished.trim();
      if(isPublishedValInStr === 'true'){
        filter.isPublished = true
      }
      filter.isPublished = false
    }
    //Fetching Blogs with given filter object
    let blogDetail = await blogModel
      .findOne(filter)
      .select({ isDeleted: 1, _id: 0 });
    //Deleting blog if according to filter
    if (blogDetail) {
      let timeStamp = new Date();
      let deleteBlog = await blogModel.updateMany(
        filter,
        { isDeleted: true, deletedAt: timeStamp },
        { new: true }
      );
      return res.status(200).send({
        status: true,
        msg: "Blog is deleted",
      });
    } else {
      //Giving response if undeleted blog with given filter conditions does not exist
      return res.status(400).send({ status: true, msg: "Blog not found" });
    }
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

module.exports.createBlog = createBlog;
module.exports.getBlog = getBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteBlogsBySelection = deleteBlogsBySelection;

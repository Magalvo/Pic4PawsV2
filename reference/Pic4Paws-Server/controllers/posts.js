import Post from '../models/Posts.model.js';
import User from '../models/User.model.js';

/* CREATE */

export const createPost = async (req, res, next) => {
  try {
    const { description, imgUrl } = req.body;
    const user = req.authUser || (await User.findById(req.authUserId));

    if (!description?.trim() && !imgUrl) {
      return res
        .status(400)
        .json({ message: 'Post description or image is required' });
    }

    const newPost = new Post({
      userId: req.authUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: description?.trim() || '',
      userPicturePath: user.imgUrl,
      imgUrl,
      likes: {},
      comments: []
    });
    await newPost.save();

    const post = await Post.find().sort({ createdAt: -1 });

    res.status(201).json(post);
  } catch (error) {
    res.status(409).json({ message: error.message });
    next(error);
  }
};

/* READ */

export const getFeedPosts = async (req, res, next) => {
  try {
    const post = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
    next(error);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const post = await Post.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
    next(error);
  }
};

/* UPDATE */

export const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.authUserId;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log('An error occurred liking the post:', error);
    res.status(404).json({ message: error.message });
    next(error);
  }
};

export const commentPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commentText } = req.body;
    const userId = req.authUserId;

    if (!commentText?.trim()) {
      return res
        .status(400)
        .json({ message: 'commentText is a required field.' });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const newComment = {
      userId,
      comment: commentText.trim()
    };

    post.comments.push(newComment);

    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log('Error adding the comment:', error);
    res.status(500).json({ message: 'Error adding the comment.' });
  }
};

/* UPLOAD */
export const UploadImg = async (req, res, next) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    res.json({ fileUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred uploading the image' });
    next(error);
  }
};

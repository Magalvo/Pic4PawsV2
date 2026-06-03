import { Schema, model } from 'mongoose';

const postSchema = new Schema(
  {
    userId: {
      type: String,
      required: true
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String,
      default: 'Paws'
    },
    location: String,
    description: String,
    imgUrl: String,
    userPicturePath: String,
    likes: {
      type: Map,
      of: Boolean
    },
    comments: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

const Post = model('Post', postSchema);

export default Post;

import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50
    },
    lastName: {
      type: String,
      min: 2,
      max: 50,
      default: 'Paws'
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      min: 5
    },
    imgUrl: {
      type: String,
      default: ''
    },
    friends: {
      type: Array,
      default: []
    },
    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number
  },
  {
    timestamps: true
  }
);

const User = model('User', UserSchema);
export default User;

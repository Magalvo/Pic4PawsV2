import { Schema, model } from 'mongoose';

const PetSchema = new Schema(
  {
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      require: true
    },
    petName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
      default: 'Name'
    },
    location: {
      type: {
        lat: {
          type: Number,
          required: true
        },
        lng: {
          type: Number,
          required: true
        }
      },
      required: true,
      default: { lat: 0, lng: 0 }
    },
    petType: {
      type: String,
      min: 2,
      max: 50,
      default: 'Animal'
    },
    breeds: {
      primary: String,
      secondary: {
        type: String,
        default: null
      },
      mixed: {
        type: Boolean,
        default: false
      },
      unknown: {
        type: Boolean,
        default: false
      }
    },
    breedsId: {
      primaryId: String,
      secondaryId: String
    },
    petDescription: {
      type: String
    },
    photos: [String],
    profilePicture: String,
    userPicturePath: {
      type: String,
      default: ''
    },
    tags: [String],
    gender: String,
    age: String,
    adoptable: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: new Date()
    },
    likes: {
      type: Map,
      of: Boolean
    },
    comments: {
      type: Array,
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Pet = model('Pet', PetSchema);
export default Pet;

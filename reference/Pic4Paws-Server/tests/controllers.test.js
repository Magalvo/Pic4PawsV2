import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import Post from '../models/Posts.model.js';
import Pet from '../models/Pet.model.js';
import User from '../models/User.model.js';
import {
  commentPost,
  createPost,
  likePost
} from '../controllers/posts.js';
import { deletePet, updatePet } from '../controllers/pets.js';
import { addRemoveFriend } from '../controllers/users.js';

const originalPostSave = Post.prototype.save;
const originalPostFind = Post.find;
const originalPostFindById = Post.findById;
const originalPostFindByIdAndUpdate = Post.findByIdAndUpdate;
const originalPetFindById = Pet.findById;
const originalPetFindByIdAndUpdate = Pet.findByIdAndUpdate;
const originalPetFindByIdAndDelete = Pet.findByIdAndDelete;
const originalUserFindById = User.findById;

const createRes = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const createNext = () => {
  const next = error => {
    next.calls.push(error);
  };
  next.calls = [];
  return next;
};

afterEach(() => {
  Post.prototype.save = originalPostSave;
  Post.find = originalPostFind;
  Post.findById = originalPostFindById;
  Post.findByIdAndUpdate = originalPostFindByIdAndUpdate;
  Pet.findById = originalPetFindById;
  Pet.findByIdAndUpdate = originalPetFindByIdAndUpdate;
  Pet.findByIdAndDelete = originalPetFindByIdAndDelete;
  User.findById = originalUserFindById;
});

test('createPost uses authenticated user id instead of body userId', async () => {
  let savedPost;

  Post.prototype.save = async function save() {
    savedPost = this;
    return this;
  };
  Post.find = () => ({
    sort: async () => [savedPost]
  });

  const req = {
    authUserId: 'authenticated-user',
    authUser: {
      firstName: 'Auth',
      lastName: 'User',
      location: 'Lisbon',
      imgUrl: 'profile.png'
    },
    body: {
      userId: 'attacker-user',
      description: 'hello',
      imgUrl: 'post.png'
    }
  };
  const res = createRes();
  const next = createNext();

  await createPost(req, res, next);

  assert.equal(res.statusCode, 201);
  assert.equal(savedPost.userId, 'authenticated-user');
  assert.equal(savedPost.description, 'hello');
  assert.equal(next.calls.length, 0);
});

test('likePost toggles likes for authenticated user only', async () => {
  let update;

  Post.findById = async () => ({
    likes: new Map()
  });
  Post.findByIdAndUpdate = async (id, changes) => {
    update = { id, changes };
    return { _id: id, likes: changes.likes };
  };

  const req = {
    authUserId: 'authenticated-user',
    params: { id: 'post-id' },
    body: { userId: 'attacker-user' }
  };
  const res = createRes();
  const next = createNext();

  await likePost(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.equal(update.id, 'post-id');
  assert.equal(update.changes.likes.get('authenticated-user'), true);
  assert.equal(update.changes.likes.get('attacker-user'), undefined);
});

test('commentPost stores comments under authenticated user id', async () => {
  const post = {
    comments: [],
    save: async () => post
  };

  Post.findById = async () => post;

  const req = {
    authUserId: 'authenticated-user',
    params: { id: 'post-id' },
    body: {
      userId: 'attacker-user',
      commentText: ' Nice post '
    }
  };
  const res = createRes();
  const next = createNext();

  await commentPost(req, res, next);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(post.comments, [
    { userId: 'authenticated-user', comment: 'Nice post' }
  ]);
});

test('updatePet rejects edits from non-owners', async () => {
  let updateCalled = false;

  Pet.findById = async () => ({
    userId: 'owner-user'
  });
  Pet.findByIdAndUpdate = async () => {
    updateCalled = true;
  };

  const req = {
    authUserId: 'other-user',
    params: { id: '64a1f1f1f1f1f1f1f1f1f1f1' },
    body: { petName: 'New name' }
  };
  const res = createRes();
  const next = createNext();

  await updatePet(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(updateCalled, false);
});

test('deletePet rejects deletes from non-owners', async () => {
  let deleteCalled = false;

  Pet.findById = async () => ({
    userId: 'owner-user'
  });
  Pet.findByIdAndDelete = async () => {
    deleteCalled = true;
  };

  const req = {
    authUserId: 'other-user',
    params: { id: '64a1f1f1f1f1f1f1f1f1f1f1' }
  };
  const res = createRes();
  const next = createNext();

  await deletePet(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(deleteCalled, false);
});

test('addRemoveFriend only allows current user to edit their friend list', async () => {
  let findCalled = false;

  User.findById = async () => {
    findCalled = true;
  };

  const req = {
    authUserId: 'authenticated-user',
    params: {
      id: 'other-user',
      friendId: 'friend-user'
    }
  };
  const res = createRes();
  const next = createNext();

  await addRemoveFriend(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(findCalled, false);
});

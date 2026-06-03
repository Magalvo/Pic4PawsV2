import User from '../models/User.model.js';
import mongoose from 'mongoose';

/* READ */
export const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
    next(error);
  }
};

export const findByEmail = async (req, res, next) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ message: 'userEmail is required' });
    }

    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      email: user.email,
      firstName: user.firstName,
      _id: user._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

export const getUserFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    const friends = await Promise.all(
      user.friends.map(id => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, imgUrl }) => {
        return { _id, firstName, lastName, occupation, location, imgUrl };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (error) {
    res.status(404).json({ message: error.message });
    next(error);
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res, next) => {
  try {
    const { id, friendId } = req.params;

    if (id !== req.authUserId) {
      return res.status(403).json({ message: 'You cannot edit this user' });
    }

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userFriends = user.friends.map(friend => friend.toString());
    const friendFriends = friend.friends.map(friend => friend.toString());

    if (userFriends.includes(friendId)) {
      user.friends = userFriends.filter(id => id !== friendId);
      friend.friends = friendFriends.filter(existingId => existingId !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map(id => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, imgUrl }) => {
        return { _id, firstName, lastName, occupation, location, imgUrl };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (error) {
    res.status(404).json({ message: error.message });
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId !== req.authUserId) {
      return res.status(403).json({ message: 'You cannot edit this user' });
    }

    const { firstName, lastName, email, location, occupation } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        location,
        occupation
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

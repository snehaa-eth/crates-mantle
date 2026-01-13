const User = require("../models/user.schema");
const getUserByAddress = async (address) => {
  return await User.findOne({ wallet: address });
};

const createUser = async (address) => {
  try {
    if (!address) {
      return new ErrorResponse("Please connect your wallet !!!", 400);
    }
    const existingUser = await User.findOne({ wallet: address });
    if (existingUser) return existingUser;
    const user = new User({ wallet: address });
    return await user.save();
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

const getOrCreateUser = async (address) => {
  const user = await getUserByAddress(address);
  console.log("User found:", user);
  if (user) return user;
  return await createUser(address);
};

module.exports = {
  getUserByAddress,
  createUser,
  getOrCreateUser,
};

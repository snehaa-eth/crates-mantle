const Waitlist = require("../models/waitlist.schema");
const ErrorResponse = require("../utils/errorResponse");

const inviteCodes = [
  "1234",
  "5678",
  "9101",
  "1121",
  "3141",
  "5161",
  "7181",
  "9202",
  "2232",
  "4252",
];

exports.registerWaitlist = async (req, res, next) => {
  try {
    const { email } = req.body;
    // if (!wallet) {
    //   return next(new ErrorResponse("Wallet address is required", 400));
    // }
    if (!email) {
      return next(new ErrorResponse("Email is Required !!!", 400));
    }
    const existing = await Waitlist.findOne({ email });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "You are already on the waitlist!",
        data: existing,
      });
    }
    const entry = await Waitlist.create({email });
    res.status(201).json({
      success: true,
      message: "Successfully joined the waitlist!",
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyInviteCode = async (req, res, next) => {
  try {
    const { wallet, inviteCode } = req.query;

    if (!wallet) {
      return next(new ErrorResponse("Wallet is required", 400));
    }
    const user = await Waitlist.findOne({ wallet });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    if (!inviteCode) {
      if (user.isVerified) {
        return res.status(200).json({
          success: true,
          message: "You are already a subscribed user",
          data: user,
        });
      } else {
        return next(new ErrorResponse("Invite code required for unverified user", 400));
      }
    }
    const isValid = inviteCodes.includes(inviteCode);
    if (!isValid) {
      return next(new ErrorResponse("Invalid invite code", 400));
    }

    // Update the user with inviteCode and isVerified
    user.inviteCode = inviteCode;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Invite code accepted",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getNumberOfUsers = async (req,res,next) =>{
  try {
    const count = await Waitlist.countDocuments();
    res.status(200).json({
      success: true,
      message: "Number of users retrieved successfully",
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

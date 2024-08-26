import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(
      `\n MONGO DB Connected !! DB HOST:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Mongo DB Connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;

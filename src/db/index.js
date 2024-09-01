import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    // console.log(a);
    console.log(process.env.MONGODB_URI);
    console.log(DB_NAME);
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // You can also add additional error handling or retries here if needed
    process.exit(1); // Exit the process with a non-zero status code to indicate an error
  }
};

// const uri=process.env.MONGODB_URI;
// const uri="mongodb://localhost:27017";



export default connectDB;






import { connect } from 'mongoose';
import { config } from 'dotenv';
config(); // loads data from .env to process.env object

const DBConn = async () => {
    const MONGO_URL = process.env.MONGO_URL;
    try {
        // the new URL parser is faster, more secure, more customisable and returns null for invalid input instead of erroring out
        await connect(MONGO_URL)
        console.log("DB connection established");
    } catch(err) {
        console.log("Error connecting to DB : "+ err);
        
    }
}

export {DBConn};
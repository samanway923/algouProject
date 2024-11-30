import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    name: {
        type : String,
        required : true
    },
    email: {
        type : String,
        required : true,
        unique : true
    },
    passwordHash: {
        type : String,
        required : false
    },
    participationHistory: [
      {
        type : Array,
        problemId: {
            type : String,
            required : true
        },
        submissionId: {
            type : String,
            required : false
        }
      }
    ],
    createdAt: {
        type: Date,
        required: true
    }
  });

  export default model("user", userSchema);
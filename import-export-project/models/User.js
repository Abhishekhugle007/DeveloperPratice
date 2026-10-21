import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {type: String,required: true,trim: true,maxlength: 100,
    },
    email: {type: String,required: true,trim: true,lowercase: true,unique: true,match: /^\S+@\S+\.\S+$/,
    },
    age: {type: Number,min: 0,max: 150,
    },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

export default User;
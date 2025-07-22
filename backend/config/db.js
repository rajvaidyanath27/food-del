import mongoose from "mongoose";

export const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://newfoodraj:Y6bJJYXhZDL4bgyv@cluster0.agiysq.mongodb.net/New-foodDeliver?retryWrites=true&w=majority&appName=Cluster0').then(()=>console.log("DB Connected"));
   
}


// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.
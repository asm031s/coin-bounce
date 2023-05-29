const mongoose = require ('mongoose');//import mongoos
// copy the url from mongodb atlas database connection application and input database name after mongodb/
const connectionString =  "mongodb+srv://romm031255:1234@cluster0.bhybm9b.mongodb.net/coin-bounce?retryWrites=true&w=majority"

const dbConnect = async  () => {
    try {
     const conn = await mongoose.connect(connectionString);
     console.log(`Database connected to host: ${conn.connection.host}`);

    } catch (error) {
        console.log(`Error: ${error}`);
    }
}

module.exports = dbConnect;
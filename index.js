import bodyParser from 'body-parser';// Import body-parser
import express from 'express'; // Import express
import mongoose from 'mongoose';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import orderRouter from './routes/orderRouter.js';
import jwt from 'jsonwebtoken';
import cors from 'cors'; // Import cors
import dotenv from 'dotenv'; // Import dotenv
dotenv.config();
 // Load environment variables from .env file
import reviewRouter from './routes/reviewRouter.js';
import inventoryRouter from './routes/inventoryRouter.js';
import analyticsRouter from './routes/analyticsRouter.js';
import driverRouter from './routes/driverRouter.js';
import notificationRoutes from './routes/notificationRoutes.js';


const app = express(); // Create an express app

app.use(cors()) // Use cors middleware to enable CORS
// Add body-parser to express app
app.use(bodyParser.json())

app.use((req, res, next) => {
    const tokenString = req.header("Authorization")
    if(tokenString != null) {
        const token = tokenString.replace("Bearer ", "")

        jwt.verify(token, process.env.JWT_KEY, 
            (err, decoded) => {
                if(decoded != null) {
                    req.user = decoded
                    next()
                }else{ 
                    res.status(403).json({
                        message: "Unauthorized"
                    })
            }
        }
        )   
    }else{
        next()
    }
})
mongoose.connect(process.env.MONGODB_URL).then(()=>{console.log("Connected to MongoDB")   
}).catch((err)=>{console.log("Error: ",err)})

//Plug in

app.use("/products", productRouter)
app.use("/users", userRouter)
app.use("/orders", orderRouter)
app.use('/reviews', reviewRouter)
app.use('/inventory', inventoryRouter)
app.use("/analytics", analyticsRouter)
app.use("/drivers", driverRouter);
app.use("/notifications", notificationRoutes);



//app.delete("/",
    //(req,res)=> {res.json(
            //{
            //autherName: "Mahera Keshan",
           // profilePicture: "https://www.google.com",
            //message: "This is a delete request",
           // likes: 150,
            //comments: [
               // {
                    //name: "Mahera Keshan",
                    //profilePicture: "https://www.google.com",
                    //comment: "Nice post",
               // }
          //  ]
            
          //  }
       // )
   // }
//)



//app.put("/",
   // (req,res)=> {res.json(
            //{
               // autherName: "Mahera Keshan",
               // profilePicture: "https://www.google.com",
              //  likes: 150,
              //  message: "This is a put request",
             //   comments: [
                //    {
                   //     name: "Mahera Keshan",
                   //     profilePicture: "https://www.google.com",
                    //    comment: "Nice post",  
                 ///   }
               // ]
           // }
       // )
   // }
//)


//function successFullyStarted(){
    //console.log('Server is running on port 3000')}

// app.listen( 5000, successFullyStarted)

//arow function only used for one time use
app.listen( 3000, 
    ()=> {console.log('Server is running on port 3000')
}
)



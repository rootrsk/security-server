const express = require ('express')
const router = express.Router()
const User = require('./../db/Models/user')
const Image = require('./../db/Models/image')
const userAuth = require('./../middlewares/userAuth')


const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );
const url = require('url')
// S3 object 
const s3 = new aws.S3({
    accessKeyId: 'AKIA3OYGIS7MBPLU7EO2',
    secretAccessKey: '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',
    Bucket: 'rootrskbucket1'
})
// Upload Function 
const profileImgUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'rootrskbucket1',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, path.basename( file.originalname, path.extname( file.originalname ) ) + '-' + Date.now() + path.extname( file.originalname ) )
        }
    }),
    limits:{ fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function( req, file, cb ){
        checkFileType( file, cb );
    }
}).single('img')
// Function to check file type 
function checkFileType( file, cb ){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test( path.extname( file.originalname ).toLowerCase());
    // Check mime
    const mimetype = filetypes.test( file.mimetype );if( mimetype && extname ){
        return cb( null, true );
    } else {
        cb( 'Error: Images Only!' );
    }
}

router.get('/',(req,res)=>{
    res.json({
        status: 'Welcome to security rest api',
    })
})

router.get('/user/images',async(req,res)=>{
    try {
        let savedImages = []
        console.log(req.query)
        
        if(req.query.skip){
            savedImages= await Image.find({}).sort({_id:-1}).skip(parseInt(req.query.skip)).limit(50)
        }else{
            savedImages= await Image.find({}).sort({_id:-1}).limit(50)
        }
        
        res.json({
            status:'success',
            savedImages
        })
    } catch (error) {
        res.json({
            status: 'failed',
            error: error.message
        })
    }
})
router.delete('/user/image', async (req, res) => {
    try {
        console.log('Delte REquiest')
        if(!req.body._id){
            return res.json({
                error:`Something Wrong With This Image.`
            })
        }
        const image = await Image.findById(req.body._id)
        if(!image){
            return res.json({
                status:'failed',
                error:`This Image Doensn't Exist.`
            })
        }
        if(image.key || image.uri){

            s3.deleteObject({ Bucket: 'rootrskbucket1', Key: image.key?image.key:image.uri }, async(err, data) => {
                console.error(err);
                console.log(data);
                await Image.findByIdAndDelete(image._id)
            });

        }
        res.json({
            message: 'Image Delation Successful.',
            status: 'success'
        })
            
    } catch (error) {
        res.json({
            message: 'Image Delation Successful.',
            status: 'success'
        })
    }
})
//Router for new users to singup  
router.post('/signup',async(req,res) =>{
    try {
        console.log(req.body)
        const user = new User(req.body)
        await user.save()
        console.log(user)
        res.json(user)
    }catch(e){
        res.json({
            status : 'failed',
            error  : e.message
        })
    }
})
// for loggin user
router.post('/login',async(req,res) =>{
    console.log('login requiret is made')
    try {
        console.log(req.body)
        if (!req.body.id || !req.body.password){
            return res.json({
                status : 'failed',
                error : 'Email or Username and  Password is Required',
            })
        }
        const {user,error} = await User.findByCredentials({
            id : req.body.id,
            password : req.body.password,
        })
        if(error){
            return res.json({
                error : error,
                status : 'failed',
            })
        }
        console.log(user)
        const token = await user.getAuthToken()
        res.json({
            user,
            token,
        })
    } catch (e) {
        res.json({
            status : 'failed',
            error : e.message
        })
    }
})
// for getting all registered users
router.get('/users',async(req,res)=>{
    try {
        const users= await User.find()
        res.json(users)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// For getting user details
router.get('/user/me',userAuth,async(req,res)=>{
    try {
        const users= req.user
        res.json(users)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

// for user to join class


//Route for updating profile details
router.patch('/user/profile',userAuth,async(req,res) => {
    try {
        req.user.fullname = req.body.fullname
        req.user.email = req.body.email
        req.user.contact = req.body.contact
        await req.user.save()
        const token = await req.user.getAuthToken()
        res.json({
            user: req.user,
            token,
            status:'success'
        })
    }catch(e){
        res.json({
            status : 'failed',
            error : e.message  
        })
    }
})

router.post( '/user/profile-img',userAuth,async(req,res)=>{
    try{
        profileImgUpload( req, res, ( error ) => {
            if(error){
                return res.json({
                    error: error
                })
            }
            if(req.file === undefined){
                return res.json({
                    error:'No File Selected.',
                    status:'failed'
                })
            }
            const imageName = req.file.key;
            const imageLocation = req.file.location;// Save the file name into database into profile model
            console.log(req.user)
            if(req.user.profile && req.user.profile.key){
                // deleting 
                console.log('deleing')
                s3.deleteObject({ Bucket: 'rootrskbucket1', Key: req.user.profile.key }, (err, data) => {
                    console.error(err);
                    console.log(data);
                });
            }
            
            req.user.profile = {
                avatar: imageLocation,
                key: imageName
            };
            req.user.save()
            res.json({
                image: imageName,
                location: imageLocation,
                status:'success',
                error:null,
                user: req.user

            });

        });
    }catch(e){
        res.json({
            error:e.message,
            status:'failed'
        })
    }
})



module.exports = router

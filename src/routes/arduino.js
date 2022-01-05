const express = require('express')
const router = express.Router()


const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');
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
            cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
        }
    }),
    limits: {
        fileSize: 2000000
    }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('imageFile')
// Function to check file type 
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

router.post('/arduino/upload-image', async (req, res) => {
    try {
        console.log("A request is made to arduino upload route.")
        console.log(req)
        console.log(req.body)
        profileImgUpload(req, res, (error) => {
            if (error) {
                return res.json({
                    error: error
                })
            }
            if (req.file === undefined) {
                console.log('No File Selected')
                return res.json({
                    error: 'No File Selected.',
                    status: 'failed'
                })
            }
            const imageName = req.file.key;
            const imageLocation = req.file.location; 
            // Save the file name into database into profile model
            console.log(imageName)
            console.log(imageLocation)
            res.json({
                id: imageName,
                uri: imageLocation,
            })
        });
    } catch (error) {
        res.json({
            status: 'failed',
            error: error.message
        })
    }
})
module.exports = router

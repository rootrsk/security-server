const express = require('express')
const router = express.Router()
const Image = require('./../db/Models/image')
const aws = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const url = require('url')
// S3 object 
const formidable = require('express-formidable');
const s3 = new aws.S3({
    accessKeyId: 'AKIA3OYGIS7MBPLU7EO2',
    secretAccessKey: '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',
    Bucket: 'rootrskbucket1'
})


router.post('/arduino/upload-image',formidable, async(req, res) => {
    try {
        console.log("A request is made to arduino upload route.")
        console.log(req.io)
        const fileName = path.basename(req.fields.imageName, path.extname(req.fields.imageName)) + '_' + Date.now() + path.extname(req.fields.imageName)
        console.log(fileName)
        bufferImage = Buffer.from(req.fields.image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
        const uploadParams = {
            Bucket: 'rootrskbucket1',
            Key: fileName,
            Body: bufferImage,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg'
        }

        s3.upload(uploadParams,async function (err, data) {
            if (err) {
                console.log("Error", err);
            }
            if (data) {
                try {
                    const image = new Image({
                        uri:data.Location,
                        key:data.key,
                        captured_at: new Date()
                    })
                    await image.save()
                    req.io.sockets.emit("new-image-uploaded", image);
                    console.log("Saved to database successfully")
                } catch (error) {
                    console.log(error)
                }
                console.log(data)
                console.log("Upload Success", data.Location);
            }
        });
        res.json({
            message:"Image Upload Successful"
        })
    } catch (error) {
        console.log(error)
        res.json({
            status: 'failed',
            error: error.message
        })
    }
})
module.exports = router

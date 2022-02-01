const router = require('express').Router()
const Image = require('./../db/Models/image')
const aws = require('aws-sdk');
const path = require('path');
const axios = require('axios')
const AWS = require('aws-sdk')
AWS.config.update({
    credentials:{
        accessKeyId: process.env.REKOGNITION_KEY,
        secretAccessKey: process.env.REKOGNITION_SECRET,
    },
    region: 'ap-south-1'
})
AWS.config.logger = console;
const s3 = new aws.S3({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    Bucket: 'rootrskbucket1'
})


router.get('/detect',async(req,res)=>{
    try {
        const url = 'https://rootrskbucket1.s3.ap-south-1.amazonaws.com/rootrsk_esp32_cam_1641454488469.jpg';
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        })
        const buffer = Buffer.from(response.data, "utf-8")
        const base64 = new Uint8Array(buffer)
        var params = {
            Image: {
                Bytes: base64,
            },
            MaxLabels:20,
            MinConfidence:60
        }
        const rekognition = new AWS.Rekognition()
        /** 
        * Returns callback function passed which is passed as arguments
        * @param { object } params  The aws reckgnition config
        * @param { function }  a callback functions  
        */

        rekognition.detectLabels(params,function(err,data){
            if(err){
                console.log(err,err.stack)
                res.json({
                    status:'faliled',
                    error: "Something Went Wrong!"
                })
            }else{
                res.json({
                    labels: data.Labels,
                    status:'success'
                })
                console.log(data.Labels)
            }
        })
        
    } catch (error) {
        console.log('error occured')
        console.log(error)
        res.json({
            erorr:error
        })
    }
})

router.post('/arduino/upload-image', async (req, res) => {
    try {
        console.log("A request is made to arduino upload route.")
        const fileName = path.basename(req.fields.imageName, path.extname(req.fields.imageName)) + '_' + Date.now() + path.extname(req.fields.imageName)
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
                const response = await axios.get(data.Location, {responseType: 'arraybuffer'})
                const buffer = Buffer.from(response.data, "utf-8")
                const base64 = new Uint8Array(buffer)
                var params = {
                    Image: {Bytes: base64,},
                    MaxLabels: 20,
                    MinConfidence: 60
                }
                const rekognition = new AWS.Rekognition()
                rekognition.detectLabels(params,async function (err, labelData) {
                    if (err) {
                        console.log(err, err.stack)
                    } else {
                        const image = new Image({
                            uri:data.Location,
                            key:data.key,
                            captured_at: new Date(),
                            labels: labelData.Labels
                        })
                        await image.save()
                        req.io.sockets.emit("new-image-uploaded", image);
                        console.log("Saved to database successfully")
                        console.log(labelData.Labels)
                    }
                })
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

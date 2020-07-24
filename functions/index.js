
//AutoML Info
const project_name = 'image-283903'
const project_region = 'us-central1'
const dataset_id = 'ICN2658167216683352064'

const bucket_prefix = 'animals'
const labels = ['animals']

const model_name = `${bucket_prefix}_${new Date().getTime()}`
const num_labels = labels.length
const img_threshold = 10;

// Dependencies
const fs = require('fs')
const functions = require('firebase-functions');
const firebase = require('firebase-admin')
const { Storage }  = require('@google-cloud/storage')
const automl = require('@google-cloud/automl')
const cors = require('cors')({origin: true})

firebase.initializeApp()

const database = firebase.database()
const firestore = firebase.firestore()
const storage =new Storage()
const automlClient = new automl.AutoMlClient()

function writeToDB(path) {
    console.log('Whats the path', path)
    database.ref(path).transaction(function (labelCount) {
        return labelCount + 1
    })
}

exports.uploadToVCMBucket = functions.storage.object().onFinalize(event => {
    const file = storage.bucket(event.bucket).file(event.name)
    const newLocation = `gs://${project_name}-vcm/${event.name}`

    console.log('file', file)
    return file.copy(newLocation).then((err, copiedFile, resp) =>{
            return event.name.substring(0, event.name.lastIndexOf('/'))}).then((label) => {
            return writeToDB(label)
    });
})

function checkFileType(type) {
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'ico']
    if(allowedTypes.includes(type)){
        return true
    } else {
        return false
    }
}

function createCSV(bucket) {
    let csvString = ''
    return new Promise((resolve, reject) => {
        bucket.getFiles({prefix: bucket_prefix}).then(result => {
            for(let i in result[0]){
                let filename = result[0][i].name
                let filetype = filename.substring(filename.lastIndexOf('.') + 1, filename.length)
                let alllowedFileType = checkFileType =(filetype)

                if (alllowedFileType) {
                    let strippedName = filename.substring(filename.indexOf(bucket_prefix) + bucket_prefix.length +1, filename.length )
                    let label = strippedName.substring(0, strippedName.indexOf('/'))
                    let fileURL = `gs://${project_name}-vcm/${filename}`
                    csvString += `${fileURL}, ${label}\n`
                }
            }
            resolve (csvString)
        })
    })
}

function uploadtoAutoMl (csvpath) {
    return new Promise(((resolve, reject) => {
        const request = {
            name: automlClient.datasetPath(project_name, project_region, project_region),
            inputConfig: {
                'gcsSource':{'inputUris': [csvpath]}
            }
        }
        automlClient.importData(request)
            .then(response =>{
                let op = response[0]
                op.on('complete', (result, metadata, finalresp) => {
                    resolve('dataset was uploaded successfully')
                })
                op.on('error', err =>{
                  reject('error occured uploading dataset to automl')
                })
            })
    }))
}

function uploadToGcs(filepath){
    return new Promise((resolve, reject) => {
        storage
            .bucket(`${project_name}-vcm`)
            .upload(filepath, {destination: `${bucket_prefix}.csv`})
            .then(() => {
            resolve('upload was successful')
        })
            .catch(err => {
                reject(err)
            })
        }
    )
}

exports.checkNumberofImages = functions.database.ref(bucket_prefix).onWrite((snap, contex) => {
    const afterData = snap.after.val()
    let num_label_with_enough_photos = 0

    for (let i in afterData){
        if(afterData[i] > img_threshold) {
            num_label_with_enough_photos += 1
        }
    }

    const automlBucketPath = storage.bucket(`${project_name}-vcm`)

    if (num_label_with_enough_photos == num_labels){
        return createCSV(automlBucketPath)
            .then(csvData => {
                return fs.writeFile('/tmp/labels.csv', csvData, () => {})
            })
            .then(err => {
                if (err) {console.log('errr', err)}
                console.log('csv was created')
                return uploadToGcs('/tmp/labels.csv')
            })
            .then((uploadResp) => {
                if(uploadResp != 'upload was successful') {
                    console.log('there was an error uploading ... ')
                } else {
                    return uploadtoAutoMl(`gs://${project_name}-vcm/${bucket_prefix}.csv`)
                }
            })
    } else {
        return 'not enough photos'
    }
})
import React, {Component} from 'react';
import firebase from "firebase";
import * as automl from '@tensorflow/tfjs-automl'
import FileUploader from 'react-firebase-file-uploader'

class UserDemo extends Component {
    state = {
        imagestorageRef: 'userDemo',
        imgSrc: 'n/a',
        winner: '',
        winningPrediction: {}
    }

    getImage = async (imgSrc) => {
        await fetch(imgSrc)
            .then(async response => response.blob())
            .then(async image => {
                let element = await document.getElementById('user_image')
                await element.setAttribute('src', URL.createObjectURL(image))
                await this.classifyImage()
            })
    }

    handleuploadSuccess = async (filename) => {
        try {
            let {bucket, fullPath} = await firebase.storage().ref(this.state.imagestorageRef).child(filename).getMetadata()
            let downloadUrl = await firebase.storage().ref(this.state.imagestorageRef).child(filename).getDownloadURL()
            let newPhoto = {
                url: downloadUrl,
                bucket,
                fullPath,
                viewed: false,
                useAsTraining: false
            }

            let photoAdded = await firebase.database().ref('classification/userDemo').push(newPhoto)

            this.setState( {
                imgSrc: downloadUrl
            })

            this.getImage(downloadUrl)
        } catch (err) {
            console.log('There was an error uploading...', err)

        }
    }

    classifyImage = async() => {
        const model = await automl.loadImageClassification('./image_classification_model_v1/model.json')
        const img = document.getElementById('user_image')

        const predictions = await model.classify(img)

        console.log('predictions', predictions)

        let winner = await this.getWinner(predictions)

        this.savePrediction(winner, predictions)
    }

    savePrediction  = async (winner, prediction) => {
     await firebase.firestore().collection('userUploadedClassification').add({
         prediction,
         ...this.state.currentImageObj,
         winninglabel: winner.label,
         winningScore: winner.prob
     })

    }

    getWinner = (prediction) => {
        let winner = 0;
        let winningPrediction = {}

        prediction.forEach((prediction) => {
            prediction.prob = Math.round((prediction.prob * 100).toFixed(2))

            if (prediction.prob > winner) {
                winner = prediction.prob
                winningPrediction = prediction
            }
        })

        this.setState({
            winner: winningPrediction.label,
            winningPrediction
        })

        return winningPrediction

    }


    render() {
        return (
            <div>
                this is an image classification uploader
                <br />
                {this.state.winner
                    ?<div>
                        <p>The winner is = <b>{this.state.winner} </b> with confidence of
                            <b> {this.state.winningPrediction.prob && this.state.winningPrediction.prob}% </b></p>
                    </div>
                    :<div>
                        <p>
                            Upload Image to be classfied
                        </p>

                    </div>
                }
                <br />
                {this.state.imgSrc !== 'n/a' && <img id = 'user_image' src={this.state.imgSrc}/>}
                <br/>
                <FileUploader accept = 'image/'
                              storageRef = {firebase.storage().ref(this.state.imagestorageRef)}
                              onUploadStart = {this.handleUloadStart}
                              onUploadError = {this.handleUploadError}
                              onUploadSuccess = {this.handleuploadSuccess}
                              onProgress = {this.handleProgress}/>

            </div>
        );
    }
}

export default UserDemo;
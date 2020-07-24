import React, {Component} from "react";
import * as automl from '@tensorflow/tfjs-automl'
import * as firebase from "firebase/app";


class AutoClassfication  extends Component{
    state = {
        imagesThatNeedInference: [],
        nextImage: {},
        currentImage: {},
        currentImageObj: {},
        winner: '',
        winningPrediction: {}
    }

    componentDidMount = async ()  => {
        await this.getImages()
        this.startProcess()
    }

    startProcess = async () => {
        const sleep = (miliseconds) => {
            return new Promise(resolve => setTimeout(resolve, miliseconds))
        }

        while (true) {
            if (this.state.imagesThatNeedInference.length > 0) {
                while (this.state.imagesThatNeedInference.length > 0) {
                    await this.getNextImage()
                }
            } else {
                console.log('No images detected in queue .... sleeping for 3 seconds')

                await sleep(3000)
            }
        }
    }
    getImages = async() =>{
        let imgagesinRTDB = firebase.database().ref('classification/newPhotos').orderByChild('viewed').equalTo(false)

        await imgagesinRTDB.on('value',(snapshot) => {
            let images = []
            snapshot.forEach((childSnapshot) => {
                let childKey = childSnapshot.key
                let childData = childSnapshot.val()
                childData.rtdbkey = childKey
                images.push(childData)
            })

            if (images.length > 0 ){
                this.setState({
                    imagesThatNeedInference: images,
                    nextImage: [images.length-1],
                    currentImage: images[images.length-1].url
                })
            }
        })
    }

    getNextImage = async() => {
        let images = this.state.imagesThatNeedInference
        let nextImage = images.pop()

        this.setState({
            currentImageObj: nextImage
        })
        console.log('fetching next image, :URL', nextImage.url)

        await fetch(nextImage.url)
            .then(async response => response.blob())
            .then(async image => {
                let element = await document.getElementById('animal')
                await element.setAttribute('src', URL.createObjectURL(image))
                await this.classifyImage()
        })
    }

    savePrediction  = async (winner, prediction) => {
     await firebase.firestore().collection('classificationImages').add({
         prediction,
         ...this.state.currentImageObj,
         winninglabel: winner.label,
         winningScore: winner.prob
     })

        await firebase.database().ref('classification/newPhotos/' + this.state.currentImageObj.rtdbkey).remove()
    }

    classifyImage = async() => {
        const model = await automl.loadImageClassification('./image_classification_model_v1/model.json')
        const img = document.getElementById('animal')

        const predictions = await model.classify(img)

        console.log('predictions', predictions)

        let winner = await this.getWinner(predictions)

        this.savePrediction(winner, predictions)
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
            This is the auto Classfication Page
                <br />
                <div>
                    <img id = 'animal' src={this.state.currentImage} alt = 'a test'/>
                </div>
            </div>
        );
    }
}

export default AutoClassfication;
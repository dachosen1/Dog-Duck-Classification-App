import React, {Component} from "react";
import * as automl from '@tensorflow/tfjs-automl'
import * as firebase from "firebase";


class AutoClassfication  extends Component{
    state = {
        imagesthatNeedInference: [],
        nextImage: {},
        currentImage: {},
        currentImageObj: {},
        winner: '',
        winningPrediction: {}
    }

    componentDidMount() {
        this.getImages()
    }

    getImages = async() =>{
        let imgagesinRTDB = firebase.database().ref('classification/newPhoto').orderByChild('viewed').equalTo(false)

        await imgagesinRTDB.on('value',(snapshot) => {
            let images = []
            snapshot.forEach((childSnapshot) => {
                let childkey = childSnapshot.key
                let childData = childSnapshot.val()
                childData.rtdbkey = childkey
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
        let images = this.state.imagesthatNeedInference
        let nextImage = images.pop()

        this.setState({
            currentImageObj: nextImage
        })

        await fetch(nextImage.url)
            .then(async response => response.blob())
            .then(async image => {
                let element = await document.getElementById('amimal_image')
                await element.setAttribute('src', URL.createObjectURL(image))
                await this.classifyImage()
        })
    }


    classifyImage = async() => {
        const model = await automl.loadImageClassification('./image_classification_model_v1/model.json')
        const img = document.getElementById('animal')
        const predictions = await model.classify(img)

        console.log('predictions', predictions)
    }

    render() {
        return (
            <div>
            This is the auto Classfication Page
                <button onClick={() => this.getNextImage()}>Classify Image</button>
                <div>
                    <img id = 'animal' src={this.state.currentImage} alt = 'a test'/>
                </div>
            </div>
        );
    }
}

export default AutoClassfication;
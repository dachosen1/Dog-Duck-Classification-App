import React, {Component} from "react";
import testdog from '../Test-Dog.jpg'
import * as automl from '@tensorflow/tfjs-automl'

class ImageClassificationDemo  extends Component{

    classifyImage = async() => {
        const model = await automl.loadImageClassification('./image_classification_model_v1/model.json')
        const img = document.getElementById('animal')
        const predictions = await model.classify(img)

        console.log('predictions', predictions)
    }

    render() {
        return (
            <div>
            This is the Image Classfication Demo Page
                <button onClick={() => this.classifyImage()}>Classify Image</button>
                <div>
                    <img id = 'animal' src={testdog} alt = 'a test'/>
                </div>
            </div>
        );
    }
}

export default ImageClassificationDemo;
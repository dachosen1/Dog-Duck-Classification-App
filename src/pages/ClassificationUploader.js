import React, {Component} from 'react';
import firebase from "firebase";
import FileUploader from 'react-firebase-file-uploader'

class ClassificationUploader extends Component {
    state = {
        imagestorageRef: 'userUploaded/animals',
        imgSrc: 'n/a'
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

            let photoAdded = await firebase.database().ref('classification/newPhotos').push(newPhoto)
            this.setState( {
                imgSrc: downloadUrl
            })
        } catch (err) {
            console.log('There was an error uploading...', err)

        }
    }

    render() {
        return (
            <div>
                this is a classification uploader
                <br />
                {this.state.imgSrc !== 'n/a' && <img src={this.state.imgSrc}/>}
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

export default ClassificationUploader;
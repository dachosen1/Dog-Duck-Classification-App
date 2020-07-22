import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
} from 'react-router-dom'

import constants from './config/constant'
import * as serviceWorker from './serviceWorker';
import ImageClassificationDemo from "./pages/ImageClassificationDemo";
import ClassificationUploader from "./pages/ClassificationUploader";
import AutoClassfication from "./pages/AutoClassfication";


ReactDOM.render(
  <React.StrictMode>
      <Router>
          <Switch>
              <Route path= '/autoClassfication' component={AutoClassfication}/>
              <Route path = '/classficationUploader' component={ClassificationUploader} />
              <Route path = '/classificationDemo' component  ={ImageClassificationDemo}/>
              <Route path = '/' component={App}/>
          </Switch>
      </Router>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

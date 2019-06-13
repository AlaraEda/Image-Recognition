'use strict';

import KNear from './knear'
import Util from "./util"
import model from './model.js'

import image0 from '../images/translate0.jpeg';
import image1 from '../images/translate1.jpeg';
import image2 from '../images/translate2.jpeg';
import image3 from '../images/translate3.jpeg';

export default class App {
    constructor() {

        console.log(JSON.parse(model))

        this.machine = new KNear(4)

        this.images = [image0, image1, image2, image3]

        this.labelcam = false

        this.learned = document.getElementById("learned")
        this.video = document.querySelector('video')
        this.canvas = document.querySelector('#mosaic')
        this.context = this.canvas.getContext('2d')

        //The number of dimensions in the tensor (10x10 = 100 dimensions)
        this.numpixels = 15

        this.width// 340
        this.height// 255
        this.intervalid
        this.webcamData
        this.trainingdata = []

        // start the stream
        this.initVideoStream()
    }

    initSettings() {

        this.width = this.video.offsetWidth
        this.height = this.video.offsetHeight

        this.canvas.width = this.width
        this.canvas.height = this.height

        this.context.mozImageSmoothingEnabled = false
        this.context.webkitImageSmoothingEnabled = false
        this.context.imageSmoothingEnabled = false

        // buttons
        this.initButtons()

        // redraw the video input 60 times/second as a mosaic
        this.drawMosaic()

        // create tensor data every second
        this.intervalid = setInterval(() => this.displayPixelData(), 1000)
    }

    initButtons() {
        let btns = document.getElementsByClassName("record")
        for (let i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", (e) => this.recordData(e, i))
        }
        document.getElementById("train").addEventListener("click", (e) => {
            this.labelcam = true
            console.log(JSON.stringify(this.trainingdata))
        })
    }

    recordData(e, i) {
        //console.log("adding vector to " + i + "   entries:" + this.webcamData.length)
        this.machine.learn(this.webcamData, i) // use i as a label ?

        this.trainingdata.push({ data: this.webcamData, label: i })

        // add a nice little thumbnail to see what we trained
        let img = document.createElement('img')
        img.src = this.canvas.toDataURL()
        document.getElementsByClassName("data")[i].appendChild(img)
    }

    labelWebcam() {
        let label = this.machine.classify(this.webcamData)
        //console.log("current webcam is seen as " + label)
        this.learned.src = this.images[label] // label i 
    }

    //Loop
    drawMosaic() {
        // drawing the video very small causes pixelation. then blow up the canvas image itself
        this.context.drawImage(this.video, 0, 0, this.numpixels, this.numpixels)
        this.context.drawImage(this.canvas, 0, 0, this.numpixels, this.numpixels, 0, 0, this.width, this.height)

        // Als label aan staat, checken welke class het is
        if (this.labelcam) this.labelWebcam()

        // draw 60 times / second
        // requestAnimationFrame(()=>this.drawMosaic())

        // Call/draw this function 10 times/second 
        setTimeout(() => this.drawMosaic(), 100)
    }

    //
    // get a tensor with 100 dimensions, do this every second
    //
    displayPixelData() {

        this.webcamData = []

        for (let pos = 0; pos < this.numpixels * this.numpixels; pos++) {
            let col = pos % this.numpixels
            let row = Math.floor(pos / this.numpixels)

            let x = col * (this.width / this.numpixels)
            let y = row * (this.height / this.numpixels)

            // colorsample location in the middle of the rectangle
            let p = this.context.getImageData(x + this.width / 20, y + this.height / 20, 1, 1).data

            // Here we convert three R G B values to one decimal using bit shifting. 
            // We need one decimal so that kNear can more easily compare different values
            // console.log("rgb is " + p[0] + "," + p[1] + "," + p[2]);
            let decimalColor = Util.rgbToDecimal(p[0], p[1], p[2])
            this.webcamData.push(decimalColor)
        }

    }

    initVideoStream() {
        // docs: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices() not supported.");
            return;
        }

        this.startCamera()
    }

    startCamera() {
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                // permission granted:
                .then((stream) => {
                    this.video.srcObject = stream;
                    this.video.addEventListener("playing", () => this.initSettings())
                    //video.addEventListener('click', takeSnapshot)
                })
                // permission denied:
                .catch((error) => {
                    document.body.textContent = 'Could not access the camera. Error: ' + error.name
                })
        }
    }
}

// init the app
new App()
const {platform} = process;
const window = require(`./${platform}/window.js`)
const video = require('./video.js')

window()
video()
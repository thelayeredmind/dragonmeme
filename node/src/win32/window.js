const {U, K, C} = require('win32-api')
const knl32 = K.load()
const user32 = U.load()

function main (){
  console.log("Hello from Window JS")
}


module.exports = main;
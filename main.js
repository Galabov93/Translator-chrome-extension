"use strict"

const select = document.querySelector('#languages')
const inputField = document.querySelector('#text-to-translate')
const outputField = document.querySelector('#output-box')
const submit = document.querySelector('#submit')
const list = document.getElementById('list')

let inputText //store the word/expression to be translated
let translatedWord // store the current translated word/expression
let lang // store the language

inputField.addEventListener('keypress', (e) => {
    console.log('pressed');
    ValidAlphabet(e)
})

// Translate the word when enter is clicked
inputField.addEventListener("keyup", function(event) {
    event.preventDefault()
    if (event.keyCode === 13) {
        submit.click()
    }
})

// When new language is chosen from the dropdown we save it to the storage
select.addEventListener('change', () => {
    chrome.storage.local.set({ "language": select.value }, function() {
        console.log('Language is set!');
    })

})


submit.addEventListener('click', (e) => {
    inputText = inputField.value
    lang = select.value

    let translatorAPI = fetch(`https://testlngapi.herokuapp.com/translate?text=${inputText}&to=${lang}`)

    translatorAPI
        .then(response => {
            if (!response.ok) {
                throw Error(response.statusText)
            }
            return response.text()
        })
        .then(response => {
            return response
        }).then(response => {
            if (response != undefined && response != '') {
                outputField.value = response;
                translatedWord = response
                inputField.value = ''
                inputField.focus()
                var event = new CustomEvent('translation', {
                    data: {
                        input: inputText,
                        output: translatedWord
                    }
                })
                outputField.dispatchEvent(event)
            } else {
                throw Error('Word is not defined')
            }
        })
        .catch(function(error) {
            console.log("There was an error when trying to translate the text: error: " + error.message)
        })
})

// listen for the custom translation event to save the current word pair to the storage
outputField.addEventListener('translation', () => {
    setWordPairToLocalStorage(inputText, translatedWord)
})


// When new item is added to the storage we also add it to the history list 
chrome.storage.onChanged.addListener((change) => {
    console.log(change);
    console.log(change.hasOwnProperty('data'));

    if (change.hasOwnProperty('data')) {
        if (inputText != undefined && translatedWord != undefined) {
            addElementToList(inputText, translatedWord)
        }
    }
})

window.addEventListener("DOMContentLoaded", () => {

    if (select.value === '' || select.value === undefined) {
        chrome.storage.local.set({ "language": lang }, function() {
            console.log('Language is set!');
        })
    }

    chrome.storage.local.get("language", function(result) {
        console.log('waat ' + result);
        select.value = result.language
    })
})

// when the application is started we add the local storage data in
window.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(null, function(items) {
        console.log(items.data[0].input)
        let myStorage = items.data
        for (let index = 0; index < myStorage.length; index++) {
            addElementToList(myStorage[index].input, myStorage[index].output)
        }
    })
})

// Validate input to accept only letters
function lettersOnly(event) {
    let regex = /[a-z]/gi
    inputField.value = inputField.value.replace(regex, '')
}

function addElementToList(inputText, outputText) {
    let li = document.createElement("li")
    li.className = 'list-group-item'
    li.appendChild(document.createTextNode(`${inputText} ---> ${outputText}`))
    list.insertBefore(li, list.childNodes[0])
        // list.appendChild(li)
}

function setWordPairToLocalStorage(inputWord, outputWord) {
    chrome.storage.local.get(function(items) {
        if (Object.keys(items).length > 0 && items.data) {
            let set = new Set(items.data.map(pair => pair.input))

            if (!set.has(inputWord)) { //check if word already in list
                items.data.push({
                    input: inputWord,
                    output: outputWord
                })
            } else {
                console.log('it is already added')
                return
            }
        } else {
            // The data array doesn't exist yet, create it
            items.data = [{
                input: inputWord,
                output: outputWord
            }];
        }

        // Now save the updated items using set
        chrome.storage.local.set(items, function() {
            console.log('Data successfully saved to the storage!');
        });
    });
}


// function saveTabData(tab, data) {
//     if (tab.incognito) {
//         chrome.runtime.getBackgroundPage(function(bgPage) {
//             bgPage[tab.url] = data // Persist data ONLY in memory
//         })
//     } else {
//         localStorage[tab.url] = data // OK to store data
//     }
// }
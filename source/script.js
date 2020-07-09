/* global fieldProperties, setAnswer, goToNextField, getPluginParameter, getMetaData, setMetaData, parent, ResizeSensor */

// Start standard field setup
var choices = fieldProperties.CHOICES
// var appearance = fieldProperties.APPEARANCE
var fieldType = fieldProperties.FIELDTYPE
var numChoices = choices.length

var labelContainer = document.querySelector('#label')
var hintContainer = document.querySelector('#hint')
var platform

if (document.body.className.indexOf('web-collect') >= 0) {
  platform = 'web'
} else {
  platform = 'mobile' // Currently, iOS or Android does not matter, but will add the distinction later if needed
}

var shiftContainer = document.querySelector('.scrolling')
var headerTable = document.querySelector('#ft-headers')
var rowTable = document.querySelector('#ft-rows')
var rowBody = rowTable.querySelector('tbody')

var fieldHContainer = document.querySelector('#field-header') // Top-left most cell
var fieldRowHtml = rowTable.querySelector('.list-nolabel').outerHTML // The HTML for each non-header row

// Start timer fields
var timerContainer = document.querySelector('#timer-container')
var timerDisp = timerContainer.querySelector('#timerdisp')
var unitDisp = timerContainer.querySelector('#unitdisp')

// PARAMETERS

var allLabels = getPluginParameter('labels')

var timeStart = getPluginParameter('duration')
var headerText = getPluginParameter('header')

var frameAdjust = getPluginParameter('adjust')
var autoAdvance = getPluginParameter('advance')
var block = getPluginParameter('block')
var dispTimer = getPluginParameter('disp')
var endEarly = getPluginParameter('endearly')
var missed = getPluginParameter('pass')
var nochange = getPluginParameter('nochange')
var numberRows = getPluginParameter('numberrows')
var allRequired = getPluginParameter('required')
var unit = getPluginParameter('unit')
var prevMetaData = getMetaData()
var leftoverTime

// Time and other vars
var startTime // This will get an actual value when the timer starts in startStopTimer()
var round = 1000 // Default, may be changed
var timeLeft // Starts this way for the display.
var timePassed = 0 // Time passed so far
var complete = false
var currentAnswer
var allChoices = []
var rowAnswers = []
var buttonElements = [[]]

if (prevMetaData != null) {
  var metaDataArray = prevMetaData.match(new RegExp('[^|]+', 'g'))
  var timeArray = metaDataArray[0].match(new RegExp('[^ ]+', 'g'))
  var lastTimeLeft = parseInt(timeArray[0])
  var lastTimeNow = parseInt(timeArray[1])
  var timeWhileGone = Date.now() - lastTimeNow // This is how much time has passed since the respondent left the field and returned

  leftoverTime = lastTimeLeft - timeWhileGone // This is how much time should be remaining on the timer. It takes how much was previously remaining, and subtracts the amount of time that has passed since the respondent was last at this field. This way, the respondent cannot leave the field and come back to extend their time and cheat.

  if (leftoverTime < 0) {
    complete = true
    leftoverTime = 0
  }

  rowAnswers = metaDataArray.slice(1) // A single-dimensional array, where each element is a space-separated list of those answers
}

// Setup defaults of parameters if they are not defined (defined in alphabetical order of the original parameter name, with the recommended parameter "duration" on top)

// Recommended parameter

// Parameter: duration
if ((timeStart == null) || isNaN(timeStart)) {
  timeStart = 10000 // Ten seconds, or 10,000 milliseconds
} else {
  timeStart *= 1000 // Convert seconds to milliseconds
}

// Optional parameters

// Parameter: adjust
if (isNaN(frameAdjust)) {
  frameAdjust = 0
}

// Parameter: advance
if (autoAdvance === 0) {
  autoAdvance = false
} else {
  autoAdvance = true
}

// Parameter: block
if (block === 0) {
  block = false
} else {
  block = true
}

// Parameter: disp
if (dispTimer === 0) {
  dispTimer = false
  timerContainer.parentElement.removeChild(timerContainer)
} else {
  dispTimer = true
}

// Parameter: nochange
if (nochange === 1) {
  nochange = true
} else {
  nochange = false
}

// Parameter: numberrows
if (numberRows === 0) {
  numberRows = false
} else {
  numberRows = true
}

// Parameter: pass
if (missed == null) {
  missed = '-99'
} else {
  missed = String(missed)
}

// Parameter: required
if (allRequired === 1) {
  allRequired = true
} else {
  allRequired = false
}

// Parameter: unit
if (unit === 'ms') {
  round = 1
} else if (unit === 'cs') {
  round = 10
} else if (unit === 'ds') {
  round = 100
} else { // If the parameter value of "unit" is invalid, then it will be seconds.
  unit = 's'
  round = 1000
}

// Reliant on other parameters

// Parameter: endearly
if ((endEarly == null) || (nochange)) { // If a row is blocked when it is answered, then the respondent should be able to move on when they are done, since otherwise they are waiting for nothing.
  endEarly = true
} else {
  endEarly = false
}

// End default parameters values

if (headerText == null) {
  headerText = ''
} else {
  headerText = unEntity(headerText)
}

fieldHContainer.innerHTML = headerText

unitDisp.innerHTML = unit

// Check to make sure "pass" value is a choice value
for (var c = 0; c < numChoices; c++) {
  var choice = choices[c]
  allChoices.push(choice.CHOICE_VALUE)
}
if (allChoices.indexOf(missed) === -1) {
  var errorMessage = missed + ' is not specified as a choice value. Please add a choice with ' + missed + ' as a choice value, or this field plug-in will not work.'
  document.querySelector('#error').innerHTML = 'Error: ' + errorMessage
  throw new Error(errorMessage)
}

if (fieldProperties.LABEL) {
  labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
}
if (fieldProperties.HINT) {
  hintContainer.innerHTML = unEntity(fieldProperties.HINT)
}

// BEGIN CREATING THE ROWS
var labelArray = allLabels.match(new RegExp('[^|]+', 'g'))
var numLabels = labelArray.length

for (var l = 1; l < numLabels; l++) { // Starts at 1, since the first one has already been created.
  rowBody.innerHTML += fieldRowHtml
}

var fieldRows = rowBody.querySelectorAll('.list-nolabel')
for (var l = 0; l < numLabels; l++) { // Populates the table with labels
  var fieldRow = fieldRows[l]
  fieldRow.querySelector('.fl-label').innerHTML = (numberRows ? String(l + 1) + '. ' : '') + labelArray[l] // Adds the label, and numbers it if applicable
}
// END CREATING THE ROWS

// Removes the "missed" values as a visible choice
var passTags = document.querySelectorAll('#choice-' + missed)
var numTdRemove = passTags.length
for (var r = 0; r < numTdRemove; r++) {
  var thisPassTag = passTags[r]
  thisPassTag.parentElement.removeChild(thisPassTag) // Remove the pass value as a label
}

// Assign each row a different <input> tag name attribute, and checkmarks if it has been previously selected

var numRowButtons = numChoices - 1
for (var l = 0; l < numLabels; l++) { // Populates the table with the buttons
  var answers = rowAnswers[l] // Selected choices in that row
  var fieldRow = fieldRows[l] // TR element
  var rowTds = fieldRow.querySelectorAll('td.fl-radio') // TDs with buttons
  var rowButtons = fieldRow.querySelectorAll('input') // Actual buttons in the TDs
  var rowName = 'row-' + String(l)
  for (var r = 0; r < numRowButtons; r++) {
    var rowTd = rowTds[r]
    var tdInput = rowTd.querySelector('input')
    var tdLabel = rowTd.querySelector('label') // The label is empty, and just used for creating new buttons
    var buttonValue = tdInput.value
    var buttonId = rowName + '-choice-' + String(buttonValue)
    tdInput.name = rowName
    tdInput.id = tdLabel.htmlFor = buttonId // The LABEL's "for" attribute has to be the same as the INPUT's "id" attribute
    if (prevMetaData != null) {
      if (answers.indexOf(buttonValue) !== -1) { // If that box had been selected previously, this selects it
        tdInput.checked = true
      } else {
        tdInput.checked = false
      }
    }
  }
  buttonElements[l] = rowButtons // Stores INPUT elements for gathering the answer later to see which ones have been selected
}

// Retrieves the button info now that all of the unneeded ones have been removed
var allButtons = document.querySelectorAll('input') // This is declared here so the unneeded boxes have already been removed, and the new boxes have been created

// Retrieves the total number of buttons, which is used in a few places
var numButtons = allButtons.length

// The below IF is for blocking and advancing if applicable when there is already an answer (aka if there is already metadata)
if (prevMetaData != null) { // If there is already a set answer when the field first appears, then this statement is true
  if ((leftoverTime === 0) && ((!allRequired) || (prevMetaData.indexOf(missed) === -1))) { // If there is no time left, and either all rows have to be completed, or all fields are already complete
    complete = true
    blockInput()

    if (autoAdvance) {
      goToNextField()
    }
    setAnswer(missed)
  }
}

// Changes checkboxes to radio buttons if select_one
if (fieldType === 'select_one') { // Changes input type
  for (var b = 0; b < numButtons; b++) {
    allButtons[b].type = 'radio'
  }
}

// This is for applying the onchange event listener to each button
for (var i = 0; i < numButtons; i++) {
  allButtons[i].onchange = function () {
    // remove 'selected' class from a previously selected option (if any)
    // var selectedOption = document.querySelector('.choice-container.selected')
    var selectedOption = this.parentElement.parentElement.querySelector('.selected')
    if ((selectedOption) && (fieldType === 'select_one')) {
      selectedOption.classList.remove('selected')
    }
    this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
    change.apply(this) // call the change() function and tell it which value was selected
  }
}

// Timing calculations

if (platform === 'web') {
  parent.onresize = adjustWindow
  try {
    var iframe = parent.document.querySelector('iframe')
    shiftContainer.onscroll = function () {
      iframe.offsetHeight = 100 // Fixes an issue where during certain scroll events, the iframe becomes way to long, so this makes it smaller again
    }
  } catch (e) {
    Error(e) // Not a big deal if there is an error, since this is just a basic aethetic thing, so the respondent can continue even if there is an error here.
  }
} else {
  window.onresize = adjustWindow
}

gatherAnswer() // This sets each answer to the "missed" value in case no choice is selected
establishTimeLeft()

adjustWindow()
setInterval(timer, 1)

ResizeSensor(rowTable, adjustWindow) // Adjust whenever the size of the rowTable changes

// FUNCTIONS

function clearAnswer () {
  var selectedOptions = document.querySelectorAll('input:checked')
  var numSelected = selectedOptions.length
  for (var s = 0; s < numSelected; s++) {
    var selectedOption = selectedOptions[s]
    selectedOption.checked = false
    selectedOption.parentElement.classList.remove('selected')
  }
}

function gatherAnswer () {
  currentAnswer = ''
  for (var r = 0; r < numLabels; r++) {
    var selectedArray = []
    for (var c = 0; c < numChoices - 1; c++) {
      var thisButton = buttonElements[r][c]
      var rowDisabled = false
      if (thisButton.checked) {
        selectedArray.push(thisButton.value)
        if (nochange && (!rowDisabled)) { // If a row can only have a choice selected once ("nochange"), then this is for disabling the row once a choice has been selected
          rowDisabled = true // This is so if the row has already been disabled, it does not disable the row multiple times. It's just a bit of a time saver.
          for (var d = 0; d < numChoices - 1; d++) {
            buttonElements[r][d].disabled = true
          }
        } // End "nochange" is true
      } // End button was checked
    } // End loop through each button in the row
    var joinedArray = selectedArray.join(' ')
    if (joinedArray === '') {
      currentAnswer += '|' + missed // Set as "missed" value if not yet
      joinedArray = missed
    } else {
      currentAnswer += '|' + joinedArray
    }
  } // End loop through each row

  var allAnswered = (currentAnswer.indexOf(missed) === -1)
  var timeZero = (timeLeft === 0)

  if (allAnswered && (endEarly || timeZero)) { // If all rows have been answered, and either they're allowed to leave early or time has reached 0, then they can leave the field.
    setAnswer(joinedArray)
  } // End setting answer IF

  if (allRequired && allAnswered && timeZero) { // Usually, blocking input and going to the next field is taken care of by the timer() function. However, if all rows are required due to "allRequired" being true, then it also needs to be addressed when the final field row is completed
    blockInput()
    if (autoAdvance) {
      goToNextField()
    }
  }
}

// Save the user's response (update the current answer)
function change () { // Currently does nothing but gather the answer, but leaving as it is for now in case something else needs to happen.
  gatherAnswer()
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Detect right-to-left languages
function isRTL (s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF'
  var rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
  var rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']')

  return rtlDirCheck.test(s)
}

// TIME FUNCTIONS

function timer () {
  var timeNow = Date.now()
  if (!complete) {
    timePassed = timeNow - startTime
    timeLeft = timeStart - timePassed
  }

  if (timeLeft < 0) { // Timer ended
    complete = true
    timeLeft = 0
    if ((!allRequired) || (currentAnswer.indexOf(missed) === -1)) { // This is true if not every row has to be completed, or if every row has to be completed, but all are completed
      setAnswer(missed)
      blockInput()
      if (autoAdvance) {
        goToNextField()
      }
    } // End setup block and advance
  } // End timer ran out
  setMetaData(String(timeLeft) + ' ' + String(timeNow) + currentAnswer)

  if (dispTimer) {
    timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
  }
}

function establishTimeLeft () { // This checks if there is leftover time
  if ((leftoverTime == null) || (leftoverTime === '') || isNaN(leftoverTime)) {
    startTime = Date.now()
    timeLeft = timeStart
  } else {
    timeLeft = leftoverTime
    startTime = Date.now() - (timeStart - timeLeft)
  }
} // End establishTimeLeft

// Makes radio/check buttons unusable if that setting is turned on. Notice how this checks the "block" var, so there is no need to put blockInput in an IF statement that checks if "block" is true each time.
function blockInput () {
  if (block) {
    for (var b = 0; b < numButtons; b++) {
      allButtons[b].disabled = true
    } // End FOR
  } // End "block" is true
}

function adjustWindow () {
  // labelContainer.innerHTML += '|'
  var usedHeight // This will be an estimation of how much height has already been used by the interface
  var windowHeight // Height of the working area. In web forms, it's the height of the window, otherwise, it's the height of the device.

  if (platform === 'web') {
    usedHeight = 300 // This is an estimation for web collect
    windowHeight = parent.outerHeight // Height of the document of the web page.
  } else {
    usedHeight = 150 // This is an estimation for mobile devices
    windowHeight = window.screen.height // Height of the device.
  }
  var shiftPos = rowBody.getBoundingClientRect().top

  var containerHeight = windowHeight - shiftPos - usedHeight + frameAdjust // What the height of the scrolling container should be

  shiftContainer.style.height = String(containerHeight) + 'px'

  adjustHeaderFont()
  var rowTableWidth = rowTable.clientWidth
  headerTable.style.width = String(rowTableWidth) + 'px'
}

function adjustHeaderFont () { // If the words in the headers are too long, this shrinks them so they fit better.
  var allHeaders = document.querySelectorAll('.header')
  for (var h = 0; h < numChoices - 1; h++) {
    var headerCell = allHeaders[h]
    var fontSize = 1 // Start at the default, then get smaller as needed
    while ((headerCell.scrollWidth > headerCell.clientWidth) && (fontSize > 0.1)) {
      fontSize -= 0.1
      headerCell.style.fontSize = String(fontSize) + 'em'
    }
  }
}

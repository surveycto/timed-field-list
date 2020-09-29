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
var immediate = getPluginParameter('immediate')
var missed = getPluginParameter('pass')
var nochange = getPluginParameter('nochange')
var numberRows = getPluginParameter('numberrows')
var numberStart = getPluginParameter('numberstart')
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
var choiceValues = []
var rowAnswers = []
var buttonElements = [[]]
var completeValue // This will be the parameter for the setAnswer() function when the respondent is allowed to move on to the next field. The actual field answer does not matter, so by default, it will be the "missed" value. However, if the "missed" value is not a choice, then it will be the first choice value.
var timedField // A boolean, whether or not the field list is a timed field list.
var currentAnswerArray = []
var numColumns

// Setup defaults of parameters if they are not defined (defined in alphabetical order of the original parameter name, with the recommended parameter "duration" on top)

// Recommended parameter

// Parameter: duration
if ((timeStart == null) || isNaN(timeStart)) {
  timedField = false // The timer will not run if there is no duration
} else {
  timedField = true
  timeStart *= 1000 // Convert seconds to milliseconds
}

// Optional parameters

// Parameter: adjust
if (isNaN(frameAdjust)) {
  frameAdjust = 0
}

// Parameter: advance
if (autoAdvance === 1) {
  autoAdvance = true
} else {
  autoAdvance = false
}

// Parameter: block (On by default unless not a timed field)
if ((block === 0) || (!timedField && (block !== 1))) {
  block = false
} else {
  block = true
}

// Parameter: disp
if (!timedField || (dispTimer === 0)) { // If the form designer specifically states the timer will not be displayed, or if no "duration" was specified (meaning it will not be timed anyway), then the timer will not be shown.
  dispTimer = false
  timerContainer.parentElement.removeChild(timerContainer)
} else {
  dispTimer = true
}

if (immediate === 1) {
  immediate = true
} else {
  immediate = false
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

// Parameter: numberstart
if ((numberStart == null) || isNaN(numberStart)) {
  numberStart = 1
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

if (prevMetaData != null) {
  var metaDataArray = prevMetaData.match(new RegExp('[^|]+', 'g'))
  if (timedField) {
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
  } else {
    rowAnswers = metaDataArray
  }
}

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
  choiceValues.push(choice.CHOICE_VALUE)
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
  fieldRow.querySelector('.fl-label').innerHTML = (numberRows ? String(l + numberStart) + '. ' : '') + labelArray[l] // Adds the label, and numbers it if applicable
}
// END CREATING THE ROWS

// Removes the "missed" values as a visible choice
var passTags = document.querySelectorAll('#choice-' + missed)
var numTdRemove = passTags.length

if (numTdRemove === 0) {
  completeValue = choiceValues[0]
  numColumns = numChoices
} else {
  numColumns = numChoices - 1
  completeValue = missed
  for (var r = 0; r < numTdRemove; r++) {
    var thisPassTag = passTags[r]
    thisPassTag.parentElement.removeChild(thisPassTag) // Remove the pass value as a column if applicable
  }
}

// Assign each row a different <input> tag name attribute, and checkmarks if it has been previously selected
for (var l = 0; l < numLabels; l++) { // Populates the table with the buttons
  var answers = rowAnswers[l] // Selected choices in that row
  var fieldRow = fieldRows[l] // TR element
  var rowTds = fieldRow.querySelectorAll('td.fl-radio') // TDs with buttons
  var rowButtons = fieldRow.querySelectorAll('input') // Actual buttons in the TDs
  var rowName = 'row-' + String(l)
  for (var r = 0; r < numColumns; r++) {
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
  var allAnswered = (metaDataArray.indexOf(missed) === -1) // Whether or not there were any "missed" values. If none are found, then all rows have been answered. Using "metaDataArray", since that stores an array of previous row answers

  if ((allAnswered && (!timedField || endEarly || (leftoverTime === 0))) || (timedField && (leftoverTime === 0) && !allRequired)) {
    complete = true
    setAnswer(completeValue)
    if (!timedField || (leftoverTime === 0)) {
      blockInput()
      if (autoAdvance) {
        goToNextField()
      }
    } // End blocking and advancing if applicable
  } // End field has been given an answer
} // End metadata existed

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

adjustWindow()

if (timedField) {
  establishTimeLeft()
  setInterval(timer, 1)
}

ResizeSensor(rowTable, adjustWindow) // Adjust whenever the size of the rowTable changes

// FUNCTIONS

function clearAnswer () {
  var selectedOptions = document.querySelectorAll('input:checked')
  var numSelected = selectedOptions.length

  for (var b = 0; b < numButtons; b++) { // Re-enable buttons
    allButtons[b].disabled = false
  }

  for (var s = 0; s < numSelected; s++) { // Un-check buttons
    var selectedOption = selectedOptions[s]
    selectedOption.checked = false
    selectedOption.parentElement.classList.remove('selected')
  }

  gatherAnswer()

  if (timedField) {
    leftoverTime = null
    timeStart = getPluginParameter('duration') * 1000
    establishTimeLeft()
    complete = false
  }
}

function gatherAnswer () {
  currentAnswerArray = [] // This will store an array of each row of space-separated answers. They will then be joined into a string.
  for (var r = 0; r < numLabels; r++) {
    var selectedArray = [] // This will store a list of all choices selected in that row
    for (var c = 0; c < numColumns; c++) {
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
      currentAnswerArray.push(missed) // Set as "missed" value if not yet answered
    } else {
      currentAnswerArray.push(joinedArray)
    }
  } // End loop through each row

  currentAnswer = currentAnswerArray.join('|')
  var allAnswered = (currentAnswerArray.indexOf(missed) === -1) // If there are no "missed" values, then this is true. Checking the array in case a choice value contains the missed value (e.g. a choice value is -999 while the missed value is -99). This works because the missed value will be by itself, with no other choice values in that array part.
  var timeZero = (timeLeft === 0) // Will be false if not a timed field

  if (!timedField) { // If not a timed field, then set the metadata here instead of in the timer
    setMetaData(currentAnswer) // Drop the first '|' when setting the metadata
  }

  if (allAnswered && (!timedField || endEarly || timeZero)) { // If all rows have been answered, and either they're allowed to leave early or time has reached 0, then they can leave the field.
    setAnswer(completeValue)

    if (allRequired && timeZero) { // Usually, blocking input and going to the next field is taken care of by the timer() function. However, if all rows are required due to "allRequired" being true, then it also needs to be addressed when the final field row is completed
      blockInput()
      if (autoAdvance) {
        goToNextField()
      }
    } // End allRequired and timeZero
  } // End setting answer IFs
} // End gatherAnswer

// Save the user's response (update the current answer)
function change () { // Currently does nothing but gather the answer, but leaving as it is for now in case something else needs to happen.
  gatherAnswer()
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
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
    if ((!allRequired) || (currentAnswerArray.indexOf(missed) === -1)) { // This is true if not every row has to be completed, or if every row has to be completed, but all are completed
      setAnswer(completeValue)
      blockInput()
      if (autoAdvance) {
        goToNextField()
      }
    } // End setup block and advance
  } // End timer ran out
  setMetaData(String(timeLeft) + ' ' + String(timeNow) + '|' + currentAnswer)

  if (dispTimer) {
    timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
  }

  if (immediate) {
    setAnswer(completeValue)
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
    usedHeight = 355 // This is an estimation for web collect
    windowHeight = parent.outerHeight // Height of the document of the web page.
  } else {
    usedHeight = 200 // This is an estimation for mobile devices
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

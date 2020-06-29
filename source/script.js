// Put this at the top of your script when testing in a web browser
class Choice {
  constructor (value, index, label, selected, image) {
    this.CHOICE_INDEX = index
    this.CHOICE_VALUE = String(value)
    this.CHOICE_LABEL = label
    if (selected) {
      this.CHOICE_SELECTED = true
    } else {
      this.CHOICE_SELECTED = false
    }
    this.CHOICE_IMAGE = image
  }
}

var fieldProperties = {
  CHOICES: [
    new Choice(1, 0, 'Choice 1'),
    new Choice(2, 1, 'Choice 2'),
    new Choice(3, 2, 'Choice 3'),
    new Choice(-99, 3, 'Pass')
  ],
  METADATA: undefined,
  LABEL: 'This is a label',
  HINT: 'This is a hint',
  PARAMETERS: [
    {
      key: 'labels',
      value: 'Row A|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B|Row B'
    },
    {
      key: 'advance',
      value: 0
    },
    {
      key: 'header',
      value: 'This is the header'
    }
  ],
  FIELDTYPE: 'select_one',
  APPEARANCE: '',
  LANGUAGE: 'english'
}

function setAnswer (ans) {
  console.log('Set answer to: ' + ans)
}

function setMetaData (string) {
  fieldProperties.METADATA = string
}

function getMetaData () {
  return fieldProperties.METADATA
}

function getPluginParameter (param) {
  const parameters = fieldProperties.PARAMETERS
  if (parameters != null) {
    for (const p of fieldProperties.PARAMETERS) {
      const key = p.key
      if (key == param) {
        return p.value
      } // End IF
    } // End FOR
  } // End IF
}

function goToNextField () {
  console.log('Skipped to next field')
}
document.body.classList.add('web-collect')
// */

/* global fieldProperties, setAnswer, goToNextField, getPluginParameter, getMetaData, setMetaData, parent */

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

var fieldTable = document.querySelector('#field-table')// .querySelector('tbody')
var fieldBody = fieldTable.querySelector('tbody')
var fieldHContainer = document.querySelector('#field-header')
var fieldRowHtml = fieldTable.querySelector('.list-nolabel').outerHTML
var shiftContainer = document.querySelector('tbody')

// Start timer fields
var timerContainer = document.querySelector('#timer-container')
var timerDisp = timerContainer.querySelector('#timerdisp')
var unitDisp = timerContainer.querySelector('#unitdisp')

// PARAMETERS
var headerText = getPluginParameter('header')
var dispTimer = getPluginParameter('disp')
var timeStart = getPluginParameter('duration')
var unit = getPluginParameter('unit')
var missed = getPluginParameter('pass')
var resume = getPluginParameter('resume')
var autoAdvance = getPluginParameter('advance')
var block = getPluginParameter('block')
var nochange = getPluginParameter('nochange')
var allLabels = getPluginParameter('labels')
var frameAdjust = getPluginParameter('adjust')
var numberRows = getPluginParameter('numberrows')
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

// var allAnswers = [[]] // This will be a two-dimentional array, where the first dimension is the row number starting at 0, and the second dimension is the choices selected in that row.

var rowAnswers = []

if (prevMetaData != null) {
  var metaDataArray = prevMetaData.match(new RegExp('[^|]+', 'g'))

  leftoverTime = parseInt(metaDataArray[0])
  rowAnswers = metaDataArray.slice(1) // A single-dimensional array, where each element is a space-separated list of those answers
}

// Setup defaults of parameters if they are not defined

if (headerText == null) {
  headerText = ''
} else {
  headerText = unEntity(headerText)
}

fieldHContainer.innerHTML = headerText

if (dispTimer === 0) {
  dispTimer = false
  timerContainer.parentElement.removeChild(timerContainer)
} else {
  dispTimer = true
}

if ((timeStart == null) || isNaN(timeStart)) {
  timeStart = 10000
} else {
  timeStart *= 1000
}

if (unit == null) {
  unit = 's'
}
unitDisp.innerHTML = unit

if (missed == null) {
  missed = '-99'
} else {
  missed = String(missed)
}

if ((autoAdvance === 0) || ((!dispTimer) && (autoAdvance !== 1))) {
  autoAdvance = false
} else {
  autoAdvance = true
}

if (block === 0) {
  block = false
} else {
  block = true
}

if (resume === 1) {
  resume = true
} else {
  resume = false
}

if (nochange === 1) {
  nochange = true
} else {
  nochange = false
}

if (numberRows === 0) {
  numberRows = false
} else {
  numberRows = true
}

if (isNaN(frameAdjust)) {
  frameAdjust = 0
}

// End default parameters

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
  fieldBody.innerHTML += fieldRowHtml
}

var fieldRows = fieldBody.querySelectorAll('.list-nolabel')
for (var l = 0; l < numLabels; l++) { // Populates the table with labels
  var fieldRow = fieldRows[l]
  fieldRow.querySelector('.fl-label').innerHTML = (numberRows ? String(l + 1) + '. ' : '') + labelArray[l]
}
// END CREATING THE ROWS

// Removes the "missed" value as a visible choice
var passTd = document.querySelectorAll('#choice-' + missed)

for (var r = 0; r <= numLabels; r++) { // There are 1 more "pass" cells than labels due to the header row, so use <= to address that one
  var thisPassTd = passTd[r]
  thisPassTd.parentElement.removeChild(thisPassTd) // Remove the pass value as a label
}

var buttonElements = [[]]

// Assign each row a different <input> tag name attribute, and checkmarks if it has been previously selected

for (var l = 0; l < numLabels; l++) { // Populates the table with labels
  var answers = rowAnswers[l]
  var fieldRow = fieldRows[l]
  var rowButtons = fieldRow.querySelectorAll('input')
  var numRowButtons = rowButtons.length
  for (var r = 0; r < numRowButtons; r++) {
    var rowButton = rowButtons[r]
    rowButton.name = 'row-' + String(l)
    if (prevMetaData != null) {
      var buttonValue = rowButton.value
      if (answers.indexOf(buttonValue) !== -1) { // IMPORTANT: includes() is not supported in later versions of Android, so this will have to be replaced.
        rowButton.checked = true
      } else {
        rowButton.selected = false
      }
    }
  }
  buttonElements[l] = rowButtons
}

// Retrieves the button info now that all of the unneeded ones have been removed
var allButtons = document.querySelectorAll('input') // This is declared here so the unneeded boxes have already been removed.

// Retrieves the total number of buttons, which is used in a few places
var numButtons = allButtons.length

// The below IF is for blocking and advancing if applicable when there is already an answer (aka if there is already metadata)
if (prevMetaData != null) { // If there is already a set answer when the field first appears, then this statement is true
  if (!resume) { // There is already a set answer, and the field cannot be resumed
    complete = true
    blockInput()

    if (autoAdvance) {
      goToNextField()
    }
  } // End cannot resume field
} else { // If not complete yet
  setAnswer(missed) // This is so if the respondent leaves the field, then the answer will already be set. Only set if there is no answer yet, as setup in the FOR loop above
}

// Changes checkboxes to radio buttons if select_one
if (fieldType === 'select_one') { // Changes input type
  for (var b = 0; b < numButtons; b++) {
    allButtons[b].type = 'radio'
  }
}

// This is for applying the onchange event listener to the buttons
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
if (unit === 'ms') {
  unit = 'milliseconds'
  round = 1
} else if (unit === 'cs') {
  unit = 'centiseconds'
  round = 10
} else if (unit === 'ds') {
  unit = 'deciseconds'
  round = 100
} else {
  unit = 'seconds'
  round = 1000
}

gatherAnswer() // This sets each answer to the "missed" value in case no choice is selected
adjustWindow()
establishTimeLeft()
setInterval(timer, 1)

if (platform === 'web') {
  parent.onresize = adjustWindow
  var iframe = parent.document.querySelector('iframe')
  shiftContainer.onscroll = function () {
    iframe.offsetHeight = 100 // Fixes an issue where during certain scroll events, the ifram becomes way to long, so this makes it smaller again
  }
} else {
  window.onresize = adjustWindow
}


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
          rowDisabled = true // This is so if the row has already been disabled, it does not disable the row multiple times
          for (var d = 0; d < numChoices - 1; d++) {
            buttonElements[r][d].disabled = true
          }
        } // End "nochange" is true
      } // End button was checked
    } // End loop through each button in the row
    var joinedArray = selectedArray.join(' ')
    if (joinedArray === '') {
      currentAnswer += '|' + missed // The question mark means it has not been answered
      joinedArray = missed
    } else {
      currentAnswer += '|' + joinedArray
    }
  } // End loop through each row
  setAnswer(joinedArray) // Only stores the last field, but can be helpful for detecting completion
}

// Save the user's response (update the current answer)
function change () {
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
  if (!complete) {
    timePassed = Date.now() - startTime
    timeLeft = timeStart - timePassed
  }

  if (timeLeft < 0) { // Timer ended
    blockInput()
    complete = true
    timeLeft = 0
    // timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
    setMetaData('0' + currentAnswer)
    if (autoAdvance) {
      goToNextField()
    }
  }
  setMetaData(String(timeLeft) + currentAnswer)

  if (dispTimer) {
    timerDisp.innerHTML = String(Math.ceil(timeLeft / round))
  }
}

function establishTimeLeft () { // This checks the current answer and leftover time, and either auto-advances if there is no time left, or establishes how much time is left.
  if ((leftoverTime == null) || (leftoverTime === '') || isNaN(leftoverTime)) {
    startTime = Date.now()
    timeLeft = timeStart
  } else {
    timeLeft = parseInt(leftoverTime)
    startTime = Date.now() - (timeStart - timeLeft)
  }
} // End establishTimeLeft

// Makes radio/check buttons unusable if that setting is turned on
function blockInput () {
  if (block) {
    for (var b = 0; b < numButtons; b++) {
      allButtons[b].disabled = true
    } // End FOR
  }
}

function adjustWindow () {
  var frameHeight
  var windowHeight
  var tbodyWidth = fieldBody.clientWidth // Width of the tbody, not including the scrollbar
  var emptySpace = tbodyWidth - fieldBody.querySelector('tr').offsetWidth // How much empty space there is within the tbody to start

  var tdWidth = fieldBody.querySelector('td').offsetWidth
  var headerWidth = tdWidth + emptySpace
  var headerWidthString = String(headerWidth) + 'px'
  var allLabelContainers = fieldTable.querySelectorAll('.fl-label')
  var numLabelContainers = allLabelContainers.length
  for (var r = 0; r < numLabelContainers; r++) {
    allLabelContainers[r].style.width = headerWidthString
  }
  allLabelContainers[0].style.width = String(headerWidth - (allLabelContainers[0].offsetWidth - headerWidth)) + 'px' // The header row becomes too wide, so this shortens it. This is a messy solution for now.

  if (platform === 'web') {
    frameHeight = 300 // This is an estimation for web collect
    windowHeight = parent.outerHeight
  } else {
    frameHeight = 150 // This is an estimation for mobile devices
    windowHeight = window.screen.height
  }
  var shiftPos = fieldBody.getBoundingClientRect().top

  var containerHeight = windowHeight - shiftPos - frameHeight + frameAdjust

  fieldBody.style.height = String(containerHeight) + 'px'
}

// This is so that if the time runs out when there is an invalid selection, then set to the "missed" value
function handleConstraintMessage (message) {
  setAnswer(missed)
}

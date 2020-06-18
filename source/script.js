/* global fieldProperties, setAnswer, goToNextField, getPluginParameter, getMetaData, setMetaData */

// Start standard field setup
var choices = fieldProperties.CHOICES
var appearance = fieldProperties.APPEARANCE
var fieldType = fieldProperties.FIELDTYPE
var numChoices = choices.length

var labelContainer = document.querySelector('#label')
var hintContainer = document.querySelector('#hint')

var fieldTable = document.querySelector('#field-table')
var fieldRowHtml = fieldTable.querySelector('.list-nolabel')

// Start timer fields
var timerContainer = document.querySelector('#timer-container')
var timerDisp = timerContainer.querySelector('#timerdisp')
var unitDisp = timerContainer.querySelector('#unitdisp')

// PARAMETERS
var dispTimer = getPluginParameter('disp')
var timeStart = getPluginParameter('duration')
var unit = getPluginParameter('unit')
var missed = getPluginParameter('pass')
var resume = getPluginParameter('resume')
var autoAdvance = getPluginParameter('advance')
var block = getPluginParameter('block')
var nochange = getPluginParameter('nochange')
var allLabels = getPluginParameter('labels')
var leftoverTime = parseInt(getMetaData())

// Time and other vars
var startTime // This will get an actual value when the timer starts in startStopTimer()
var round = 1000 // Default, may be changed
var timeLeft // Starts this way for the display.
var timePassed = 0 // Time passed so far
var complete = false
var currentAnswer
var allChoices = []

// Default parameter values
// Setup defaults of parameters if they are not defined
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

if (checkComplete()) { // If there is already a set answer when the field first appears, then this statement is true
  if (nochange) {
    blockInput()
    complete = true
  }

  if (!resume) {
    complete = true
    if (block) {
      blockInput()
    }

    if (autoAdvance) {
      goToNextField()
    }
  } // End cannot resume field
} else { // If not complete yet
  setAnswer(missed) // This is so if the respondent leaves the field, then the answer will already be set. Only set if there is no answer yet, as setup in the FOR loop above
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

// Removes the "missed" value as a visible choice
var passTd = document.querySelector('#choice-' + missed)
passTd.parentElement.removeChild(passTd) // Remove the pass value as a label

// BEGIN CREATING THE ROWS
var labelArray = allLabels.match(new RegExp('|'))
var numLabels = labelArray.length

for (let l = 1; l < numLabels; l++) { // Starts at 1, since the first one has already been created.
  fieldTable.innerHTML += fieldRowHtml
}

var fieldRows = fieldTable.querySelectorAll('.list-nolabel')
for (let l = 0; l < numLabels; l++) { // Populates the table with labels
  var fieldRow = fieldRows[l]
  fieldRow.querySelector('.fl-label').innerHTML = labelArray[l]
}

// END CREATING THE ROWS

// Retrieves the button info now that all of the unneeded ones have been removed
var allButtons = document.querySelectorAll('input[name="opt"]') // This is declared here so the unneeded boxes have already been removed.

// If it set to not resume, and the field has already been accessed before, then this activate blockInput. Doing it now instead of before, since not all of the buttons were available yet.
if (complete) {
  blockInput()
}

// Changes checkboxes to radio buttons if select_one
var numButtons = allButtons.length
if (fieldType === 'select_one') { // Changes input type
  for (var b = 0; b < numButtons; b++) {
    allButtons[b].type = 'radio'
  }
}

// minimal appearance
if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) {
  selectDropDownContainer.onchange = change // when the select dropdown is changed, call the change() function (which will update the current value)
} else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
  var likertButtons = document.querySelectorAll('div[name="opt"]')
  for (var i = 0; i < likertButtons.length; i++) {
    likertButtons[i].onclick = function () {
      if (!complete) {
        // clear previously selected option (if any)
        var selectedOption = document.querySelector('.likert-input-button.selected')
        if (selectedOption) {
          selectedOption.classList.remove('selected')
        }
        this.classList.add('selected') // mark clicked option as selected
        change.apply({ value: this.getAttribute('data-value') }) // call the change() function and tell it which value was selected

        if (nochange) {
          complete = true // This is so it knows to dissalow input when an answer is set
        }
      }
    }
  }
} else { // all other appearances
  var buttons = document.querySelectorAll('input[name="opt"]')
  var numButtons = buttons.length
  if (fieldType === 'select_one') { // Change to radio buttons if select_one
    for (var i = 0; i < numButtons; i++) {
      buttons[i].type = 'radio'
    }
  }
  for (var i = 0; i < numButtons; i++) {
    buttons[i].onchange = function () {
      // remove 'selected' class from a previously selected option (if any)
      var selectedOption = document.querySelector('.choice-container.selected')
      if ((selectedOption) && (fieldType === 'select_one')) {
        selectedOption.classList.remove('selected')
      }
      this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
      change.apply(this) // call the change() function and tell it which value was selected
    }
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

establishTimeLeft()
setInterval(timer, 1)

// FUNCTIONS

function clearAnswer () {
  // minimal appearance
  if (appearance.indexOf('minimal') !== -1) {
    selectDropDownContainer.value = ''
  } else if (appearance.indexOf('likert') !== -1) { // likert appearance
    var selectedOption = document.querySelector('.likert-input-button.selected')
    if (selectedOption) {
      selectedOption.classList.remove('selected')
    }
  } else { // all other appearances
    var selectedOption = document.querySelector('input[name="opt"]:checked')
    if (selectedOption) {
      selectedOption.checked = false
      selectedOption.parentElement.classList.remove('selected')
    }
  }
}

function checkComplete () { // Returns true if any of the choices has a CHOICE_SELECTED value of true. Otherwise, returns false.
  for (var c = 0; c < numChoices; c++) { // Checks each choice to see if the form has already been completed
    var choice = choices[c]
    if (choice.CHOICE_SELECTED) { // If a choice has a value, then that means the field is already complete
      return true // No need to check anymore if even one choice has been selected
    } // End going through each choice
  }
  return false
}

// Removed the containers that are not to be used
function removeContainer (keep) {
  if (keep !== 'radio') {
    radioButtonsContainer.parentElement.removeChild(radioButtonsContainer) // remove the default radio buttons
  }

  if (keep !== 'minimal') {
    selectDropDownContainer.parentElement.removeChild(selectDropDownContainer) // remove the select dropdown contrainer
  }

  if (keep !== 'likert') {
    likertContainer.parentElement.removeChild(likertContainer) // remove the likert container
  }

  if (keep !== 'label') {
    choiceLabelContainer.parentElement.removeChild(choiceLabelContainer)
  }

  if (keep !== 'nolabel') {
    listNoLabelContainer.parentElement.removeChild(listNoLabelContainer)
  }
}

// Save the user's response (update the current answer)
function change () {
  if (fieldType === 'select_one') {
    currentAnswer = this.value
    setAnswer(currentAnswer)
    // If the appearance is 'quick', then also progress to the next field
    if (appearance.indexOf('quick') !== -1) {
      goToNextField()
    }
  } else {
    var selected = []
    for (var c = 0; c < numChoices; c++) {
      if (choiceContainers[c].querySelector('INPUT').checked === true) {
        selected.push(choices[c].CHOICE_VALUE)
      }
    }
    currentAnswer = selected.join(' ')
    setAnswer(currentAnswer)
  }

  if (nochange) { // If not supposed to change the field after a value has been set, then this blocks the input once the value has been set.
    blockInput()
    complete = true
  }
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

    if ((currentAnswer == null) || (currentAnswer === '') || (Array.isArray(currentAnswer) && (currentAnswer.length === 0))) {
      setAnswer(missed)
    }
    setMetaData(0)
    if (autoAdvance) {
      goToNextField()
    }
  }
  setMetaData(timeLeft)

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
    if (appearance.indexOf('minimal') !== -1) {
      selectDropDownContainer.disabled = true // Disable 'minimal' container
    } else {
      for (var b = 0; b < numButtons; b++) {
        allButtons[b].disabled = true
      } // End FOR
    } // End ELSE
  } // End "block" is true
} // End blockInput

// This is so that if the time runs out when there is an invalid selection, then set to the "missed" value
function handleConstraintMessage (message) {
  setAnswer(missed)
}

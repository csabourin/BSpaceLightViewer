/* eslint-disable */
/* global PNotify */

/**
 * Contains all of the functionality for Matching and Categorization Vanilla.
 *
 * @class MatchingApp
 */
/** Mods on line 573 and 1311 **/
var MatchingApp = {
    mobileDevice: false,
    ActivityType: null,
    AppData: null,
    currentAttempts: 0,
    sessionTimer: 0,
    timerInterval: null,
    ti: 0,
    containerRef: null,
    hLightingEffect: false,
    qCols: 1,
    curQCol: 1,
    accMATCont: 'div',
    questionData: null,
    AnsSlotData: null,
    alreadySelected: false,
    heightSet: false,
    finishedQuiz: false,
    allAnswered: false,
    disableDragging: false,
    interval: null,
    headingLevel: null,
    continueButton: null,
    checkAnswersButton: null,
    resetWrongButton: null,
    resetButton: null,
    restartButton: null,
    submitButton: null,
    postQuizButton: null,
    instructionButton: null,
    droppedItem: null,
    notifications: true,
    origPos: [],
    aMatch: [],
    qMatch: [],
    matchAmount: [],
    selectedElements: [],
    scoreEval: [],
    savedElements: [],
    savedAnswers: [],
    savedCorrectAnswers: [],
    savedBackgrounds: [],
    savedBackgroundColors: [],
    lineHeightNoBorders: null,
    lineHeightWithBorders: null,
    mobileDragging: false,
    score: 0,
    SCORMConnectionAttempts: 0,
    SCORMEnabled: false,
    SCORMConnected: false,
    SCORMConnectionInterval: null,
    SCORMSession: null,
    SCORMInteraction: null,
    // global default dropzone height
    dropzoneHeight: 0,
    //  global default dropzone background
    dropzoneBackground: null
};

var D2LDEBUG = true;
var MAT_appContainer, MAT_buttonIcon, MAT_preQuizText, MAT_postQuizText;
var slotBackground;
var temp, tempPar, tempComp, ans, ansId, data, code, questionFile, idNum, tempArr, ti, validSrc;
var c, i, j, k;
/**
 * Resets specified properties to their default values.
 *
 * @method resetQuizData
 */
MatchingApp.resetQuizData = function () {
    MatchingApp.sessionTimer = 0;
    MatchingApp.alreadySelected = false;
    MatchingApp.heightSet = false;
    MatchingApp.finishedQuiz = false;
    MatchingApp.allAnswered = false;
    MatchingApp.interval = null;
    MatchingApp.origPos = [];
    MatchingApp.aMatch = [];
    MatchingApp.qMatch = [];
    MatchingApp.matchAmount = [];
    MatchingApp.selectedElements = [];
    MatchingApp.scoreEval = [];
    MatchingApp.savedElements = [];
    MatchingApp.savedAnswers = [];
    MatchingApp.savedCorrectAnswers = [];
};
/**
 * Establishes the JSON text file path, the id of the container that houses the activity, and makes a call to get the activity data.
 *
 * @method setupApp
 * @param {String} file
 * @param {String} location
 */
MatchingApp.setupApp = function (file, location) {
    questionFile = file;
    if (document.getElementById(location) !== null) {
        MatchingApp.containerRef = document.getElementById(location);
        MatchingApp.containerID = location;
        MatchingApp.getAppData(MatchingApp.buildApp);
    } else {
        d2log('ERROR: Missing specified DOM object in MatchingApp.setupApp().');
    }
};
/**
 * Retrieves the activity data from the JSON text file, passes that data to build the activity.
 *
 * @method getAppData
 * @param {Method} callback
 */
MatchingApp.getAppData = function (callback) {
    if (questionFile === '') {
        if (window.useActivityData) {
            MatchingApp.AppData = window.useActivityData;
            callback(MatchingApp.AppData);
        } else {
            d2log('ERROR: Could not resolve json data.');
        }
    } else {
        var jqxhr = $.getJSON(questionFile, function (data) {
            MatchingApp.AppData = data;
            callback(MatchingApp.AppData);
        });
        // If the json data fails inform the users ang give some data to developers using the debug console.
        jqxhr.fail(function (e) {
            d2log(
                'ERROR: Failed to load data from specified file. Ensure that the file path is correct' +
                    ' and that JSON the JSON data is valid. (Use a validator like: http://jsonformatter.curiousconcept.com/ )'
            );
            d2log(e);
        });
    }
};
/**
 * Checks if the activity is being accessed on a mobile device, sets up other necessary things for the entire activity.
 *
 * @method buildApp
 */
MatchingApp.buildApp = function () {
    // Maps old data to new data structure
    MatchingApp.parseData();

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        MatchingApp.mobileDevice = true;
    }
    MatchingApp.questionData = MatchingApp.AppData.QuestionNodes;
    MatchingApp.AnsSlotData = MatchingApp.AppData.AnswerNodes;
    MatchingApp.ActivityType = MatchingApp.AppData.ActivityType;
    if (MatchingApp.AppData.DefaultColor === null || MatchingApp.AppData.DefaultColor === undefined || MatchingApp.AppData.DefaultColor === '' || MatchingApp.AppData.DefaultColor === 'none') {
        MatchingApp.AppData.DefaultColor = '#FFFFFF';
    }
    if (
        MatchingApp.AppData.DefaultSelectColor === null ||
        MatchingApp.AppData.DefaultSelectColor === undefined ||
        MatchingApp.AppData.DefaultSelectColor === '' ||
        MatchingApp.AppData.DefaultSelectColor === 'none'
    ) {
        MatchingApp.AppData.DefaultSelectColor = '#B7E5E5';
    }
    if (
        MatchingApp.AppData.DefaultHighlightColor === null ||
        MatchingApp.AppData.DefaultHighlightColor === undefined ||
        MatchingApp.AppData.DefaultHighlightColor === '' ||
        MatchingApp.AppData.DefaultHighlightColor === 'none'
    ) {
        MatchingApp.AppData.DefaultHighlightColor = '#C6C8CA';
    }
    MatchingApp.AppData.DefaultColor = '#FFFFFF';
    MatchingApp.qCols = parseInt(MatchingApp.AppData.Advanced.QuestionColumns);
    if (MatchingApp.qCols > MatchingApp.questionData.length) {
        MatchingApp.qCols = MatchingApp.questionData.length;
    }
    //FORCED TRUE
    MatchingApp.hLightingEffect = true;
    MatchingApp.headingLevel = parseInt(MatchingApp.AppData.Advanced.HeadingLevel);
    if (MatchingApp.headingLevel === null || MatchingApp.headingLevel === undefined || MatchingApp.headingLevel === 'none' || isNaN(MatchingApp.headingLevel) || MatchingApp.headingLevel === '') {
        MatchingApp.headingLevel = 1;
    } else if (MatchingApp.headingLevel > 3) {
        MatchingApp.headingLevel = 3;
    }
    MatchingApp.buildAppFrame();
    MatchingApp.loadButtons();

    if (MatchingApp.AppData.SCORMEnabled) {
        MatchingApp.SCORMEnabled = MatchingApp.AppData.SCORMEnabled;

        if (MatchingApp.SCORMEnabled) {
            MatchingApp.establishScorm();
        }
    } else {
        MatchingApp.startActivity();
    }
};

MatchingApp.startActivity = function () {
    if (window.startLocation === undefined) {
        if (
            MatchingApp.AppData.PreActivityText === 'none' ||
            MatchingApp.AppData.PreActivityText === null ||
            MatchingApp.AppData.PreActivityText === undefined ||
            MatchingApp.AppData.PreActivityText === ''
        ) {
            if (
                MatchingApp.AppData.PreActivityMedia === 'none' ||
                MatchingApp.AppData.PreActivityMedia === null ||
                MatchingApp.AppData.PreActivityMedia === undefined ||
                MatchingApp.AppData.PreActivityMedia === '' ||
                MatchingApp.AppData.PreActivityMedia.length === 0
            ) {
                MatchingApp.buildActivity();
            } else {
                MatchingApp.buildPreQuiz();
            }
        } else {
            MatchingApp.buildPreQuiz();
        }
    } else {
        // When in the editor, this launches to a specific part of the activity
        switch (window.startLocation) {
            case 0:
                MatchingApp.buildPreQuiz();
                break;

            case 1:
                MatchingApp.buildPreQuiz();
                break;

            case 2:
                MatchingApp.buildActivity();
                break;

            case 3:
                MatchingApp.buildPostQuiz();
                break;
        }
    }

    $(MatchingApp.containerRef).addClass('rs_preserve');

    try {
        PNotify.removeAll();
    } catch (err) {
        MatchingApp.notifications = false;
    }
};

/**
 * Allows for dragging in Internet Explorer.
 *
 * @method autoSelect
 * @param {Object} selectTarget
 */
MatchingApp.autoSelect = function (selectTarget) {
    // IE
    var browserName = navigator.appName;
    if (browserName === 'Microsoft Internet Explorer') {
        document.selection.empty();
        var range = document.body.createTextRange();
        range.moveToElementText(selectTarget);
        range.select();
    }
};
/**
 * Sets up the inital containers for the app.
 *
 * @method buildAppFrame
 */
MatchingApp.buildAppFrame = function () {
    var MAT_container = document.createElement('section');
    MAT_container.id = 'MAT_container';
    var MAT_content = document.createElement('section');
    MAT_content.id = 'MAT_content';
    var MAT_header = document.createElement('section');
    MAT_header.id = 'MAT_header';
    MAT_header.innerHTML = '<h' + MatchingApp.headingLevel + '>' + MatchingApp.AppData.ActivityName + '</h' + MatchingApp.headingLevel + '>';
    MAT_container.appendChild(MAT_content);
    $(MAT_container).appendTo(MatchingApp.containerRef);
    $('<div/>', {
        id: 'AccMessageDisp',
        class: 'AccMessage',
        text: 'Stuff'
    }).appendTo('body');
    MAT_appContainer = document.createElement('div');
    MAT_appContainer.id = 'MAT_appContainer';
    MAT_appContainer.setAttribute('role', 'main');
    $(MAT_header).hide().appendTo(MAT_content).slideDown(500, 'swing');
    MAT_content.appendChild(MAT_appContainer);
};
/**
 * Sets up all the parameters for each button and stores them in an object.
 *
 * @method loadButtons
 */
MatchingApp.loadButtons = function () {
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    var MAT_checkButton = document.createElement('button');
    MAT_checkButton.id = 'MAT_checkButton';
    MAT_checkButton.setAttribute('class', 'MAT_button');
    MAT_checkButton.setAttribute('title', 'Checks the Answers');
    MAT_checkButton.onclick = function () {
        if (MatchingApp.SCORMEnabled) {
            MatchingApp.sendButtonEvent('Checked answers.');
        }
        MatchingApp.checkAnswers();
    };
    var MAT_checkLabel = document.createElement('span');
    MAT_checkLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_checkLabel.innerHTML = 'Check Answers';
    //MAT_checkButton.appendChild(MAT_buttonIcon);
    MAT_checkButton.appendChild(MAT_checkLabel);
    MatchingApp.checkAnswersButton = MAT_checkButton;
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    var MAT_resetWrongButton = document.createElement('button');
    MAT_resetWrongButton.id = 'MAT_resetWrongButton';
    MAT_resetWrongButton.setAttribute('class', 'MAT_button');
    MAT_resetWrongButton.setAttribute('title', 'Resets the Wrong Draggable Items');
    MAT_resetWrongButton.onclick = function () {
        MatchingApp.disableDragging = false;
        if (MatchingApp.SCORMEnabled) {
            MatchingApp.sendButtonEvent('Reset wrong answers.');
        }
        MatchingApp.resetWrong();
    };
    var MAT_resetWrongLabel = document.createElement('span');
    MAT_resetWrongLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_resetWrongLabel.innerHTML = 'Reset Wrong';
    //MAT_resetWrongButton.appendChild(MAT_buttonIcon);
    MAT_resetWrongButton.appendChild(MAT_resetWrongLabel);
    MAT_resetWrongButton.disabled = true;
    MatchingApp.resetWrongButton = MAT_resetWrongButton;
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    var MAT_resetButton = document.createElement('button');
    MAT_resetButton.id = 'MAT_resetButton';
    MAT_resetButton.setAttribute('class', 'MAT_button');
    MAT_resetButton.setAttribute('title', 'Resets All the Draggable Items');
    MAT_resetButton.onclick = function () {
        MatchingApp.disableDragging = false;
        if (MatchingApp.SCORMEnabled) {
            MatchingApp.sendButtonEvent('Reset all answers.');
        }
        MatchingApp.reset();
    };
    var MAT_resetLabel = document.createElement('span');
    MAT_resetLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_resetLabel.innerHTML = 'Reset Answers';
    //MAT_resetButton.appendChild(MAT_buttonIcon);
    MAT_resetButton.appendChild(MAT_resetLabel);
    MatchingApp.resetButton = MAT_resetButton;
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    var MAT_restartButton = document.createElement('button');
    MAT_restartButton.id = 'MAT_restartButton';
    MAT_restartButton.setAttribute('class', 'MAT_button');
    MAT_restartButton.setAttribute('title', 'Restarts the Activity');
    MAT_restartButton.onclick = function () {
        MatchingApp.disableDragging = false;
        if (document.getElementById('MAT_checkButton')) {
            document.getElementById('MAT_checkButton').disabled = false;
        }
        if (MatchingApp.SCORMEnabled) {
            MatchingApp.sendButtonEvent('Restarted activity.');
            MatchingApp.SCORMSession = new SCORMSession(MatchingApp.AppData.ActivityID);
            MatchingApp.SCORMInteraction = new SCORMInteraction(MatchingApp.SCORMSession);
        }
        MatchingApp.clearStage();
        MatchingApp.resetQuizData();
        if (
            MatchingApp.AppData.PreActivityText === 'none' ||
            MatchingApp.AppData.PreActivityText === null ||
            MatchingApp.AppData.PreActivityText === undefined ||
            MatchingApp.AppData.PreActivityText === ''
        ) {
            if (
                MatchingApp.AppData.PreActivityMedia === 'none' ||
                MatchingApp.AppData.PreActivityMedia === null ||
                MatchingApp.AppData.PreActivityMedia === undefined ||
                MatchingApp.AppData.PreActivityMedia === ''
            ) {
                MatchingApp.buildActivity();
            } else {
                MatchingApp.buildPreQuiz();
            }
        } else {
            MatchingApp.buildPreQuiz();
        }
        MatchingApp.GoToTop();
    };
    var MAT_restartLabel = document.createElement('span');
    MAT_restartLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_restartLabel.innerHTML = 'Restart Activity';
    //MAT_restartButton.appendChild(MAT_buttonIcon);
    MAT_restartButton.appendChild(MAT_restartLabel);
    MatchingApp.restartButton = MAT_restartButton;
    var MAT_continueButton = document.createElement('button');
    MAT_continueButton.id = 'MAT_continueButton';
    MAT_continueButton.setAttribute('class', 'MAT_button');
    MAT_continueButton.onclick = function () {
        MatchingApp.disableDragging = false;
        MatchingApp.clearStage();
        MatchingApp.buildActivity();
        MatchingApp.timerInterval = setInterval(MatchingApp.timer, 1000);
        MatchingApp.GoToTop();
    };
    var MAT_continueLabel = document.createElement('span');
    MAT_continueLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_continueButton.setAttribute('title', 'Starts the Activity');
    MAT_continueLabel.innerHTML = 'Start Activity';
    MAT_continueButton.appendChild(MAT_continueLabel);
    MatchingApp.continueButton = MAT_continueButton;
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    var MAT_postQuizButton = document.createElement('button');
    MAT_postQuizButton.id = 'MAT_postQuizButton';
    MAT_postQuizButton.setAttribute('class', 'MAT_button');
    MAT_postQuizButton.setAttribute('title', 'Finishes the Activity');
    MAT_postQuizButton.onclick = function () {
        if (MatchingApp.SCORMEnabled) {
            MatchingApp.sendButtonEvent('Finished activity.');
        }
        MatchingApp.clearStage();
        MatchingApp.buildPostQuiz();
        MatchingApp.GoToTop();
    };
    var MAT_postQuizLabel = document.createElement('span');
    MAT_postQuizLabel.setAttribute('class', 'MAT_buttonLabel');
    MAT_postQuizLabel.innerHTML = 'Continue';
    //MAT_postQuizButton.appendChild(MAT_buttonIcon);
    MAT_postQuizButton.appendChild(MAT_postQuizLabel);
    MatchingApp.postQuizButton = MAT_postQuizButton;
    MAT_buttonIcon = document.createElement('div');
    MAT_buttonIcon.setAttribute('class', 'MAT_buttonIcon');
    MAT_buttonIcon.setAttribute('style', 'margin:0px auto;');
    // var MAT_instructionButton = document.createElement('button');
    // MAT_instructionButton.id = 'MAT_instructionButton';
    // MAT_instructionButton.setAttribute('class', 'MAT_button');
    // MAT_instructionButton.setAttribute('title', 'Toggles the Instructions');
    // MAT_instructionButton.onclick = function() {
    //     MatchingApp.toggleInstructions();
    // };
    // //MAT_instructionButton.appendChild(MAT_buttonIcon);
    // MatchingApp.instructionButton = MAT_instructionButton;
};
/**
 * Builds the pre activity inside of the app container.
 *
 * @method buildPreQuiz
 */
MatchingApp.buildPreQuiz = function () {
    MatchingApp.ti = 0;
    if (
        MatchingApp.AppData.PreActivityText !== 'none' &&
        MatchingApp.AppData.PreActivityText !== null &&
        MatchingApp.AppData.PreActivityText !== undefined &&
        MatchingApp.AppData.PreActivityText !== ''
    ) {
        MAT_preQuizText = document.createElement('p');
        MAT_preQuizText.id = 'MAT_preQuizText';
        MAT_preQuizText.innerHTML = MatchingApp.AppData.PreActivityText;
        $(MAT_preQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
        // MAT_appContainer.appendChild(MAT_preQuizText);
    }
    if (
        MatchingApp.AppData.PreActivityMedia !== 'none' &&
        MatchingApp.AppData.PreActivityMedia !== null &&
        MatchingApp.AppData.PreActivityMedia !== undefined &&
        MatchingApp.AppData.PreActivityMedia !== ''
    ) {
        for (i = 0; i < MatchingApp.AppData.PreActivityMedia.length; i++) {
            MatchingApp.EmbedMedia(MAT_appContainer, MatchingApp.AppData.PreActivityMedia[i]);
        }
    }
    MatchingApp.buildPreQuizButtons();
    MatchingApp.editorFallback();

    // if ($('.d2l-page-title', window.parent.document).length > 0) {
    // 	$('body', window.parent.document).animate({
    // 		scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    // 	}, 1000);
    // }
};
/**
 * Adds the button(s) for the pre activity into the app container.
 *
 * @method buildPreQuizButtons
 */
MatchingApp.buildPreQuizButtons = function () {
    var MAT_buttonSet = document.createElement('div');
    MAT_buttonSet.id = 'MAT_buttonSet';
    $(MAT_buttonSet).hide().appendTo(MAT_appContainer).fadeIn(500);
    //MAT_appContainer.appendChild(MAT_buttonSet);
    MAT_buttonSet.appendChild(MatchingApp.continueButton);
    MatchingApp.continueButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
};
/**
 * Builds the post activity inside of the app container.
 *
 * @method buildPostQuiz
 */
MatchingApp.buildPostQuiz = function () {
    MatchingApp.ti = 0;
    if (
        MatchingApp.AppData.PostActivityText !== 'none' &&
        MatchingApp.AppData.PostActivityText !== null &&
        MatchingApp.AppData.PostActivityText !== undefined &&
        MatchingApp.AppData.PostActivityText !== ''
    ) {
        MAT_postQuizText = document.createElement('p');
        MAT_postQuizText.id = 'MAT_postQuizText';
        MAT_postQuizText.innerHTML = MatchingApp.AppData.PostActivityText;
        $(MAT_postQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
        //MAT_appContainer.appendChild(MAT_postQuizText);
    } else {
        MAT_postQuizText = document.createElement('p');
        MAT_postQuizText.id = 'MAT_postQuizText';
        MAT_postQuizText.innerHTML = 'You have completed the activity!';
        $(MAT_postQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
        //MAT_appContainer.appendChild(MAT_postQuizText);
    }
    if (
        MatchingApp.AppData.PostActivityMedia !== 'none' &&
        MatchingApp.AppData.PostActivityMedia !== null &&
        MatchingApp.AppData.PostActivityMedia !== undefined &&
        MatchingApp.AppData.PostActivityMedia !== ''
    ) {
        for (i = 0; i < MatchingApp.AppData.PostActivityMedia.length; i++) {
            MatchingApp.EmbedMedia(MAT_appContainer, MatchingApp.AppData.PostActivityMedia[i]);
        }
    }
    MatchingApp.buildPostQuizButtons();
    MatchingApp.editorFallback();

    if ($('.d2l-page-title', window.parent.document).length > 0) {
    	$('body', window.parent.document).animate({
    		scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    	}, 1000);
    }
};
/**
 * Adds the button(s) for the post activity into the app container.
 *
 * @method buildPostQuizButtons
 */
MatchingApp.buildPostQuizButtons = function () {
    var MAT_buttonSet = document.createElement('div');
    MAT_buttonSet.id = 'MAT_buttonSet';
    MAT_appContainer.appendChild(MAT_buttonSet);
    MAT_buttonSet.appendChild(MatchingApp.restartButton);
    MatchingApp.restartButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
};
/**
 * Builds the activity and adds it to the app container.
 *
 * @method buildActivity
 */
MatchingApp.buildActivity = function () {
    MatchingApp.score = 0;
    MatchingApp.ti = 0;

    for (i = 0; i < MatchingApp.questionData.length; i++) {
        MatchingApp.origPos.push(null);
        temp = MatchingApp.questionData[i].answer;
        MatchingApp.qMatch.push(temp);
    }
    for (j = 0; j < MatchingApp.AnsSlotData.length; j++) {
        temp = MatchingApp.AnsSlotData[j].key;
        MatchingApp.aMatch.push(temp);
        // if (MatchingApp.ActivityType === 'sort') {
        var matches = 0;
        for (k = 0; k < MatchingApp.questionData.length; k++) {
            if (MatchingApp.questionData[k].answer === MatchingApp.AnsSlotData[j].key) {
                matches++;
            }
        }
        MatchingApp.matchAmount.push(matches);
        // }
    }
    MatchingApp.buildInstructions();
    MatchingApp.buildQuestionCols();
    MatchingApp.buildAnswerSlots();
    MatchingApp.buildScrollZones();
    MatchingApp.buildActivityButtons();
    MatchingApp.initAccMAT();
    MatchingApp.assignOrigPos();
    if (MatchingApp.AppData.FeedbackType === 'report') {
        // MatchingApp.interval = setInterval(MatchingApp.checkAllAnswered, 100); Moved to drop event
        document.getElementById('MAT_checkButton').disabled = true;
        $('#MAT_checkButton').hide();
    }
    $('#MAT_instructions').attr('tabindex', MatchingApp.ti);
    //$('[tabindex=1]').focus();
    if (MatchingApp.mobileDevice === false) {
        //  MatchingApp.checkCollapse = setInterval(MatchingApp.checkForCollapse, 100);
    }
    // if ($('.d2l-page-title', window.parent.document).length > 0) {
    // 	$('body', window.parent.document).animate({
    // 		scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    // 	}, 1000);
    // }
    var elHeight = parseInt($('#drag0').css('line-height'));
    var elPadTop = parseInt($('#drag0').css('padding-top'));
    var elPadBot = parseInt($('#drag0').css('padding-bottom'));
    var elBordTop = parseInt($('#drag0').css('border-top-width'));
    var elBordBot = parseInt($('#drag0').css('border-bottom-width'));
    //console.log(elHeight);
    MatchingApp.lineHeightNoBorders = elHeight + elPadTop + elPadBot;
    MatchingApp.lineHeightWithBorders = MatchingApp.lineHeightNoBorders + elBordTop + elBordBot;
};
/**
 * Adds the button(s) for the current activity into the app container.
 *
 * @method buildActivityButtons
 */
MatchingApp.buildActivityButtons = function () {
    var MAT_buttonSet = document.createElement('div');
    MAT_buttonSet.id = 'MAT_buttonSet';
    $(MAT_buttonSet).hide().appendTo(MAT_appContainer).fadeIn(500);
    // MAT_appContainer.appendChild(MAT_buttonSet);
    MAT_buttonSet.appendChild(MatchingApp.checkAnswersButton);
    // MatchingApp.instructionButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
    MatchingApp.checkAnswersButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
    if (MatchingApp.AppData.FeedbackType === 'continuous') {
        MAT_buttonSet.appendChild(MatchingApp.resetWrongButton);
        $('#MAT_resetWrongButton').hide();
        MatchingApp.resetWrongButton.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    } else {
        MAT_buttonSet.appendChild(MatchingApp.resetButton);
        MatchingApp.resetButton.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    }
};
/**
 * Builds the report and adds it to the app container.
 *
 * @method buildReport
 */
MatchingApp.buildReport = function () {
    MatchingApp.ti = 0;
    MatchingApp.findCorrectAnswers();
    var correct =
        '<img class="correct" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Njk0QjdFOTZFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Njk0QjdFOTdFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5NEVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2OTRCN0U5NUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqYsgfwAAAFBSURBVHjaYvz//z8DLQETw5ADW/w7wBgKGKluOANDOZTXyeCzsYKRioY3AMl6NNEGZioZXgEkm7HIPGOkkuHtWGSWAXEcI4WGZwLJaVhkNgNxCDAOfjHS0nDyU9EW/0QgOQ+LzG4g9oEZTp4FW/yjgeQiLJl0P9Twb8iCjGgagUo2LqWW4QgLtvj7Ack1UDFQ+G3CYjhMDSuazCkgdgPq+YjNTYxYNP7GsIRMw2GFXS2aRlawYVv83aCGu+Ew/BIhw2E+EAXS+4BYB03uOxA3AXEdEHOiyV0BYieg4a8JpQlYHOCyBBsg2nD0VCQDJA8AsTIe9XeB2B5o+FPSKxyfjU+ApAPUEFyGO5BiOPaMBvHJCSCWRhIFWW4JdQSFVSbCJzCXgmhHcgzHXSf7bLwDteQkNFjukFsmMg75VgVAgAEAWmBzHcug4yIAAAAASUVORK5CYII=" alt="right check mark" disabled/>';
    var wrong =
        '<img class="wrong" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6REI5RDZEMUJFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6REI5RDZEMUNFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpEQjlENkQxOUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEQjlENkQxQUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pr+MFuwAAADiSURBVHjaxJY9DsIwDIXtHoCJkY1DdO2AWHuPHqj36IoYujJwBDZGJk7AM3KWoEa2JQtLr6na5Hup81cijRedeugOHSgY0lYZfXnGBY7iAu2gBzTs6fr0wlGs0BF6Q2cwblzBS7hMKniJr0mHy1zBSSuulnRtwEmZsxiM2mPymjTgJQsjGyv+pMvahr0NvHXZ2yu9N38tB/JKnlRyYPDICt80cJo01wwH57h5QXaUHP9JUeogp07T1IWWulWkbnYRuMdE1sESgUvou6FxnixiMOnx5oIbTIQ5pR/6lP3b8hFgAJ82ro/bie6BAAAAAElFTkSuQmCC" alt="wrong x" disabled/>';
    var score = MatchingApp.calculateScore();
    var MAT_report = document.createElement('div');
    MAT_report.id = 'MAT_report';
    var resultsHeader = document.createElement('h' + (MatchingApp.headingLevel + 1));
    resultsHeader.setAttribute('class', 'MAT_resultsHeader');
    /*resultsHeader.innerHTML = 'Feedback:';*/
    var total = 0;
    for (var i = 0; i < MatchingApp.matchAmount.length; i++) {
        total += MatchingApp.matchAmount[i];
    }
    resultsHeader.innerHTML = 'You scored ' + score + '/' + total + '!';
    MAT_report.appendChild(resultsHeader);
    /*
   var scoreHeader = document.createElement('h' + (MatchingApp.headingLevel + 2));
   scoreHeader.setAttribute('class', 'MAT_scoreHeader');
   var total = 0;
   for (var i = 0; i < MatchingApp.matchAmount.length; i++) {
      total += MatchingApp.matchAmount[i];
   }
   scoreHeader.innerHTML = 'You scored ' + score + '/' + total + '!';
   MAT_report.appendChild(scoreHeader);
   */
    for (i = 0; i < MatchingApp.AnsSlotData.length; i++) {
        if (MatchingApp.matchAmount[i] > 0) {
            var tempMiniReport = document.createElement('div');
            tempMiniReport.setAttribute('class', 'MAT_miniReport');
            var tempHeader = document.createElement('h' + (MatchingApp.headingLevel + 3));
            tempHeader.setAttribute('class', 'MAT_dropzoneHeader');
            tempHeader.innerHTML = MatchingApp.AnsSlotData[i].title;
            tempMiniReport.appendChild(tempHeader);
            MAT_report.appendChild(tempMiniReport);
            var tempMiniReportContent = document.createElement('div');
            tempMiniReportContent.setAttribute('class', 'MAT_miniReportContent');
            tempMiniReport.appendChild(tempMiniReportContent);
            for (j = 0; j < MatchingApp.savedElements.length; j++) {
                if (MatchingApp.AnsSlotData[i].key === MatchingApp.savedAnswers[j]) {
                    var tempMatch = document.createElement('li');
                    var tempFeedback = document.createElement('div');
                    $(tempFeedback).addClass('MAT_feedback');
                    switch (MatchingApp.scoreEval[j]) {
                        case 1:
                            /* Remove Lines to remove Answer in report */
                            tempMatch.innerHTML = MatchingApp.savedElements[j];
                            tempMiniReportContent.appendChild(tempMatch);
                            $(tempMatch).prepend(correct);
                            /* Remove lines stop*/
                            if (
                                MatchingApp.questionData[j].correct !== 'none' &&
                                MatchingApp.questionData[j].correct !== null &&
                                MatchingApp.questionData[j].correct !== undefined &&
                                MatchingApp.questionData[j].correct !== ''
                            ) {
                                tempFeedback.innerHTML = '<strong>Feedback: </strong>' + MatchingApp.questionData[j].correct;
                                tempMiniReportContent.appendChild(tempFeedback);
                            }
                            //$('#' + MatchingApp.savedAnswers[j]).prepend(correct);
                            break;
                        default:
                            /* Remove Lines to remove Answer in report */
                            tempMatch.innerHTML = MatchingApp.savedElements[j] /*+ ' (Correct Answer: ' + MatchingApp.savedCorrectAnswers[j] + ')'*/;
                            tempMiniReportContent.appendChild(tempMatch);
                            $(tempMatch).prepend(wrong);
                            /* Remove lines stop*/
                            if (
                                MatchingApp.questionData[j].wrong !== 'none' &&
                                MatchingApp.questionData[j].wrong !== null &&
                                MatchingApp.questionData[j].wrong !== undefined &&
                                MatchingApp.questionData[j].wrong !== ''
                            ) {
                                tempFeedback.innerHTML = '<strong>Feedback: </strong>' + MatchingApp.questionData[j].wrong;
                                tempMiniReportContent.appendChild(tempFeedback);
                            }
                            //$('#' + MatchingApp.savedAnswers[j]).prepend(wrong);
                            break;
                    }
                }
            }
        }
    }
    $('.MI_qColum').hide();
    $('#MAT_qColContainer').append($(MAT_report));
    $(MAT_report).hide().fadeIn(500);
    $('.MAT_expand').remove();
    /* Adds CSS to add space for table*/
    $('#MAT_ansSlotContainer').addClass('MAT_answers_lg');
    /* Modifies inline style to switch on Report mode*/
    $('#MAT_qColContainer').css('float', 'right');
    $('#MAT_ansSlotContainer').css('float', 'left');

    if (window.startLocation === undefined) {
        MatchingApp.buildReportButtons();
    }

    MatchingApp.GoToTop();
    if ($('.d2l-page-title', window.parent.document).length > 0) {
    	$('body', window.parent.document).animate({
    		scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    	}, 1000);
    }
};
/**
 * Adds the button(s) for the report into the app container.
 *
 * @method buildReportButtons
 */
MatchingApp.buildReportButtons = function () {
    var MAT_buttonSet = document.createElement('div');
    MAT_buttonSet.id = 'MAT_buttonSet';
    MAT_appContainer.appendChild(MAT_buttonSet);
    MAT_buttonSet.appendChild(MatchingApp.postQuizButton);
    MatchingApp.postQuizButton.setAttribute('tabindex', MatchingApp.ti);
    ////MatchingApp.ti++;
    MAT_buttonSet.appendChild(MatchingApp.restartButton);
    MatchingApp.restartButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
};
/**
 * Clears the app container.
 *
 * @method clearStage
 */
MatchingApp.clearStage = function () {
    $('#MAT_appContainer').empty();
    clearInterval(MatchingApp.interval);
    MatchingApp.GoToTop();
};
/**
 * Finds the correct answer for each draggable item.
 *
 * @method findCorrectAnswers
 */
MatchingApp.findCorrectAnswers = function () {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        for (j = 0; j < MatchingApp.AnsSlotData.length; j++) {
            if (MatchingApp.questionData[i].answer === MatchingApp.AnsSlotData[j].key) {
                MatchingApp.savedCorrectAnswers.push(MatchingApp.AnsSlotData[j].title);
            }
        }
    }
};
/**
 * Changes whether the instructions text is visible or not.
 *
 * @method toggleInstructions
 */
MatchingApp.toggleInstructions = function () {
    // if ($('#MAT_iToggle').hasClass('iUp') === true) {
    //     $('#MAT_iToggle').removeClass('iUp');
    //     $('#MAT_iToggle').addClass('iDown');
    //     $('#MAT_activityText').slideDown(500);
    //     $('#MAT_iToggle').innerHTML = '&#9650;';
    // } else {
    //     $('#MAT_iToggle').removeClass('iDown');
    //     $('#MAT_iToggle').addClass('iUp');
    //     $('#MAT_activityText').slideUp(500);
    //     $('#MAT_iToggle').innerHTML = '&#9660;';
    // }
};
/**
 * Builds the scroll zones for dragging items
 *
 * @method buildScrollZones
 */
MatchingApp.buildScrollZones = function () {
    var MAT_upperScrollZone = document.createElement('div');
    MAT_upperScrollZone.id = 'MAT_upperScrollZone';
    MAT_upperScrollZone.className = 'MAT_scrollZone';
    MAT_upperScrollZone.innerHTML = "<p id='MAT_upperScrollZoneLabel'>Drag element here to scroll up</p>";
    //MAT_upperScrollZone.setAttribute('ondragover', "MatchingApp.ScrollZoneScroll('up')");
    $(MAT_upperScrollZone).hide().insertBefore($('#MAT_qColContainer'));
    var MAT_lowerScrollZone = document.createElement('div');
    MAT_lowerScrollZone.id = 'MAT_lowerScrollZone';
    MAT_lowerScrollZone.className = 'MAT_scrollZone';
    MAT_lowerScrollZone.innerHTML = "<p id='MAT_lowerScrollZoneLabel'>Drag element here to scroll down</p>";
    $(MAT_lowerScrollZone).hide().appendTo($('#MAT_appContainer'));
};
MatchingApp.ShowScrollZones = function (targ) {
    if (window.top.location.href.indexOf('viewContent') > -1) {
        var iFrmPos = window.parent.document.getElementsByTagName('iframe')[0].offsetTop; // may want to do a source match here
        if (window.top.scrollY - iFrmPos > 0) {
            $('#MAT_upperScrollZone').css('top', window.top.scrollY - iFrmPos);
        } else {
            $('#MAT_upperScrollZone').css('top', 0);
        }
        if (parseInt(targ.style.top) + targ.offsetHeight / 2 < $('#MAT_content').height()) {
            $('#MAT_lowerScrollZone').css('top', window.top.innerHeight - iFrmPos - $('#MAT_lowerScrollZone').height() + window.top.scrollY);
        } else {
            $('#MAT_lowerScrollZone').css('top', $('#MAT_content').height() - $('#MAT_lowerScrollZone').height());
        }
        $('#MAT_upperScrollZone').fadeIn(200);
        $('#MAT_lowerScrollZone').fadeIn(200);
    }
};
MatchingApp.HideScrollZones = function () {
    $('#MAT_upperScrollZone').fadeOut(200);
    $('#MAT_lowerScrollZone').fadeOut(200);
};
MatchingApp.StartScrollZoneScroll = function (dir) {
    if (!MatchingApp.ZoneScrolling) {
        var speed;

        $('#MAT_lowerScrollZone').innerHTML = 'active';
        if (dir === 'up') {
            speed = -10;
        } else {
            speed = 10;
        }
        //console.log('Scroll start')
        window.clearInterval(MatchingApp.ScrollTimer);
        MatchingApp.ZoneScrolling = true;
        MatchingApp.ScrollTimer = window.setInterval(function () {
            if (window.top.scrollY + speed < $(document).height()) {
                window.top.scrollTo(0, window.top.scrollY + speed);
            }
        }, 50);
    }
};
MatchingApp.EndScrollZoneScroll = function () {
    if (MatchingApp.ZoneScrolling) {
        window.clearInterval(MatchingApp.ScrollTimer);
        MatchingApp.ZoneScrolling = false;
    }
};
/**
 * Builds the designated amount of question columns and populates them with draggable items.
 *
 * @method buildQuestionCols
 */
MatchingApp.buildQuestionCols = function () {
    var MAT_qColContainer = document.createElement('div');
    MAT_qColContainer.id = 'MAT_qColContainer';
    MAT_qColContainer.className = 'MAT_questions';
    MAT_qColContainer.setAttribute('ondrop', 'MatchingApp.revert(event);');
    MAT_qColContainer.setAttribute('ondragover', 'MatchingApp.allowRevert(event);');
    if (MatchingApp.AppData.Advanced.HorizontalAlignment === true) {
        $(MAT_qColContainer).css('width', '48%');
        $(MAT_qColContainer).css('float', 'left');
        $(MAT_qColContainer).css('display', 'block');
    }
    $(MAT_qColContainer).hide().appendTo(MAT_appContainer).fadeIn(500);
    for (c = 0; c < MatchingApp.qCols; c++) {
        var tempContDiv = $('<div/>', {
            id: 'qColum_' + (c + 1),
            style: 'width: ' + 100 / MatchingApp.qCols + '%;',
            class: 'MI_qColum'
        });
        $('<div/>', {
            id: 'unsorted_' + (c + 1),
            class: 'MAT_qCol'
        }).appendTo(tempContDiv);
        $('#MAT_qColContainer').append(tempContDiv);
    }
    tempArr = [];
    var classInfo;
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        if (MatchingApp.questionData[i].type === 'text') {
            if (MatchingApp.questionData[i].question === '') {
                MatchingApp.questionData[i].question = 'Sample Drag Item';
            }

            if (MatchingApp.questionData[i].centerText) {
                classInfo = ' class="draggableTextNode centerAlign"';
            } else {
                classInfo = ' class="draggableTextNode"';
            }
            if (MatchingApp.mobileDevice === true) {
                tempArr[i] = '<div id="drag' + i + '" "' + classInfo + '" >' + MatchingApp.questionData[i].question + '</div>';
            } else {
                tempArr[i] =
                    '<div id="drag' +
                    i +
                    '" draggable="true" aria-hidden="false" aria-grabbed="false"' +
                    ' ondragstart="MatchingApp.drag(event);" ondrop="MatchingApp.drop(event);"' +
                    ' onmousedown="MatchingApp.autoSelect(this);"' +
                    ' onmouseover="MatchingApp.hLightEffect(this, true)"' +
                    ' onmouseout="MatchingApp.hLightEffect(this, false)"' +
                    ' onfocus="MatchingApp.hLightEffect(this, true)"' +
                    ' onblur="MatchingApp.hLightEffect(this, false)"' +
                    classInfo +
                    '" >' +
                    MatchingApp.questionData[i].question +
                    '</div>';
            }
        }
        if (MatchingApp.questionData[i].type === 'image') {
            if (MatchingApp.questionData[i].centerText) {
                classInfo += ' class="draggableTextNode centerAlign"';
            } else {
                classInfo += ' class="draggableTextNode"';
            }
            if (MatchingApp.mobileDevice === true) {
                tempArr[i] =
                    '<div id="drag' +
                    i +
                    '" ontouchmove="MatchingApp.touchDrag(event);"' +
                    classInfo +
                    '" ><img class="draggableImage" src="' +
                    MatchingApp.questionData[i].src +
                    '" alt="' +
                    MatchingApp.questionData[i].alt +
                    '"/></div>';
            } else {
                tempArr[i] =
                    '<div id="drag' +
                    i +
                    '" draggable="true" aria-hidden="false" aria-grabbed="false"' +
                    ' ondragstart="MatchingApp.drag(event);" ondrop="MatchingApp.drop(event);"' +
                    ' onmousedown="MatchingApp.autoSelect(this);"' +
                    ' onmouseover="MatchingApp.hLightEffect(this, true)"' +
                    ' onmouseout="MatchingApp.hLightEffect(this, false)"' +
                    ' onfocus="MatchingApp.hLightEffect(this, true)"' +
                    ' onblur="MatchingApp.hLightEffect(this, false)"' +
                    classInfo +
                    '" >' +
                    ' <img class="draggableImage" src="' +
                    MatchingApp.questionData[i].src +
                    '" alt="' +
                    MatchingApp.questionData[i].alt +
                    '"/></div>';
            }
        }
        if (MatchingApp.questionData[i].type === 'both') {
            if (MatchingApp.mobileDevice === true) {
                tempArr[i] =
                    '<div id="drag' +
                    i +
                    '" "' +
                    ' class="draggableTextNode centerAlign" >' +
                    ' <img class="draggableImage" src="' +
                    MatchingApp.questionData[i].img.src +
                    '" alt="' +
                    MatchingApp.questionData[i].img.alt +
                    '"/>' +
                    '<p>' +
                    MatchingApp.questionData[i].question +
                    '</p></div>';
            } else {
                tempArr[i] =
                    '<div id="drag' +
                    i +
                    '" draggable="true" aria-hidden="false" aria-grabbed="false"' +
                    ' ondragstart="MatchingApp.drag(event);" ondrop="MatchingApp.drop(event);"' +
                    ' onmousedown="MatchingApp.autoSelect(this);"' +
                    ' onmouseover="MatchingApp.hLightEffect(this, true)"' +
                    ' onmouseout="MatchingApp.hLightEffect(this, false)"' +
                    ' onfocus="MatchingApp.hLightEffect(this, true)"' +
                    ' onblur="MatchingApp.hLightEffect(this, false)" class="draggableTextNode centerAlign';
                tempArr[i] += '" >' + ' <img class="draggableImage" src="' + MatchingApp.questionData[i].img.src + '" alt="' + MatchingApp.questionData[i].img.alt + '"/>' + '<p';
                if (MatchingApp.questionData[i].centerText) {
                    tempArr[i] += ' class="centerAlign"';
                } else {
                    tempArr[i] += ' class="leftAlign"';
                }
                tempArr[i] += '>' + MatchingApp.questionData[i].question + '</p></div>';
            }
        }
        if (MatchingApp.questionData[i].color !== null && MatchingApp.questionData[i].color !== undefined && MatchingApp.questionData[i].color !== 'none' && MatchingApp.questionData[i].color !== '') {
            if (MatchingApp.questionData[i].color === 'default') {
                slotBackground = MatchingApp.AppData.DefaultColor;
                MatchingApp.savedBackgroundColors.splice(i, 1, slotBackground);
            } else {
                slotBackground = MatchingApp.AppData.DefaultColor;
                MatchingApp.savedBackgroundColors.splice(i, 1, slotBackground);
            }
        } else {
            slotBackground = MatchingApp.AppData.DefaultColor;
            MatchingApp.savedBackgroundColors.splice(i, 1, slotBackground);
        }
    }
    if (MatchingApp.AppData.Randomize === true) {
        tempArr.sort(function () {
            return 0.5 - Math.random();
        });
    }
    for (j = 0; j < MatchingApp.questionData.length; j++) {
        if (MatchingApp.curQCol > MatchingApp.qCols) {
            MatchingApp.curQCol = 1;
        }
        $('#unsorted_' + MatchingApp.curQCol).append(tempArr[j]);
        MatchingApp.curQCol++;
    }
    $('.draggableTextNode').each(function () {
        this.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
        idNum = parseInt(this.id.substr(4));
        // $(this).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
    });
    MatchingApp.curQCol = 1;
};
/**
 * Builds the designated amount of answer columns and populates them with drop zones.
 *
 * @method buildAnswerSlots
 */
MatchingApp.buildAnswerSlots = function () {
    var MAT_ansSlotContainer = document.createElement('div');
    MAT_ansSlotContainer.id = 'MAT_ansSlotContainer';
    MAT_ansSlotContainer.className = 'MAT_answers';
    if (MatchingApp.AppData.Advanced.HorizontalAlignment === true) {
        $(MAT_ansSlotContainer).css('width', '50%');
        $(MAT_ansSlotContainer).css('float', 'right');
        $(MAT_ansSlotContainer).css('display', 'block');
    }
    $(MAT_ansSlotContainer).hide().appendTo(MAT_appContainer).fadeIn(500);
    //MAT_appContainer.appendChild(MAT_ansSlotContainer);
    for (c = 0; c < MatchingApp.AnsSlotData.length; c++) {
        if (MatchingApp.matchAmount[c] > 0) {
            var slotColor;
            var style;
            if (MatchingApp.AnsSlotData[c].color === 'default') {
                slotColor = '#9EA5A9';
            } else {
                slotColor = '#9EA5A9';
            }
            if (MatchingApp.AnsSlotData[c].src !== 'none' && MatchingApp.AnsSlotData[c].src !== null && MatchingApp.AnsSlotData[c].src !== undefined && MatchingApp.AnsSlotData[c].src !== '') {
                slotBackground = MatchingApp.AnsSlotData[c].src;
                MatchingApp.savedBackgrounds[c] = slotBackground;
                //style = 'border: ' + slotColor + ' 1px solid; border-top: none; background: url(' + slotBackground + ') repeat;';
                style = 'background: url(' + slotBackground + ') repeat;';
            } else {
                MatchingApp.savedBackgrounds[c] = 'none';
                //style = 'border: ' + slotColor + ' 1px solid;border-top: none; ';
                style = '';
            }
            var tempContDiv = $('<div/>', {
                id: 'aSlotCont_' + c,
                class: 'MI_aSlot',
                ondrop: 'MatchingApp.drop(event)',
                ondragover: 'MatchingApp.allowDrop(event)'
                // ondragleave: 'MatchingApp.dragOut(event)'
            });
            var tempTitleContDiv = $('<div/>', {
                id: MatchingApp.AnsSlotData[c].key + '_title',
                class: 'dzTitle'
                // style: 'background-color: ' + slotColor + ';'
            }).appendTo(tempContDiv);

            if (MatchingApp.AnsSlotData[c].title === '') {
                MatchingApp.AnsSlotData[c].title = 'Sample Dropzone';
            }

            if (MatchingApp.ActivityType === 'sort') {
                $('<h' + (MatchingApp.headingLevel + 1) + '/>')
                    .html(MatchingApp.AnsSlotData[c].title + ' (' + MatchingApp.matchAmount[c] + ')')
                    .appendTo(tempTitleContDiv);
            } else {
                $('<h' + (MatchingApp.headingLevel + 1) + '/>')
                    .html(MatchingApp.AnsSlotData[c].title)
                    .appendTo(tempTitleContDiv);
            }
            $('<div/>', {
                id: MatchingApp.AnsSlotData[c].key,
                class: 'connect_box dropzone',
                title: MatchingApp.AnsSlotData[c].title + ' dropzone',
                style: style
            }).appendTo(tempContDiv);
            $('#MAT_ansSlotContainer').append(tempContDiv);
            // ** START OF NEW FEATURE **
            // Grabs the initial values of dropzone height and background and assigns them to global variables
            const originalDropzoneHeight = document.querySelector('.dropzone').offsetHeight;
            const originalDropzoneBackground = window.getComputedStyle(document.querySelector('.dropzone'), null).getPropertyValue('background');
            MatchingApp.dropzoneHeight = originalDropzoneHeight;
            MatchingApp.dropzoneBackground = originalDropzoneBackground;
            // ** END OF NEW FEATURE **
            if (MatchingApp.mobileDevice === true) {
                $('.dropzone').each(function () {
                    this.setAttribute('onclick', 'MatchingApp.HandleMobileDrop(this)');
                });
            }
        }
    }
    if (MatchingApp.AppData.Advanced.HorizontalAlignment === true) {
        $('.MI_aSlot').css('width', '100%');
    }
};
/**
 * Builds the correct instructions based on the type of activity, and whether or not it is being accessed on a mobile device.
 *
 * @method buildInstructions
 */
MatchingApp.buildInstructions = function () {
    var instructions;
    var MAT_activityText = document.createElement('div');
    MAT_activityText.id = 'MAT_activityText';
    if (MatchingApp.mobileDevice === true) {
        if (MatchingApp.ActivityType === 'match') {
            if (MatchingApp.AppData.FeedbackType === 'report') {
                instructions = 'Match each item to the appropriate category. ' + 'Tap on "Check Answers" to see your results.';
            } else {
                instructions = 'Match each item to the appropriate category. ' + 'Tap on "Check Answers" to see your progress.';
            }
        } else {
            if (MatchingApp.AppData.FeedbackType === 'report') {
                instructions = 'Sort each item into the appropriate category. ' + 'Tap on "Check Answers" to see your results.';
            } else {
                instructions = 'Sort each item into to the appropriate category. ' + 'Tap on "Check Answers" to see your progress.';
            }
        }
    } else {
        if (MatchingApp.ActivityType === 'match') {
            if (MatchingApp.AppData.FeedbackType === 'report') {
                instructions =
                    '<span class="MAT_instructionText">Sort each item into the appropriate category by dragging the option into the dropzone (computer users) or by selecting the option and then selecting the dropzone (users on smaller screens or mobile). For keyboard only users, use the tab key to select an option from the list and use the enter key to select it. Use tab again to select the correct dropzone and then hit the enter key to place the option in that dropzone. Select an option and hit the delete key to return it to its original position. Use the "Check Answers" button to get your results.</span>';
            } else {
                instructions =
                    '<span class="MAT_instructionText">Sort each item into the appropriate category by dragging the option into the dropzone (computer users) or by selecting the option and then selecting the dropzone (users on smaller screens or mobile). For keyboard only users, use the tab key to select an option from the list and use the enter key to select it. Use tab again to select the correct dropzone and then hit the enter key to place the option in that dropzone. Select an option and hit the delete key to return it to its original position. Use the "Check Answers" button to get your results.</span>';
            }
        } else {
            if (MatchingApp.AppData.FeedbackType === 'report') {
                instructions =
                    '<span class="MAT_instructionText">Sort each item into the appropriate category by dragging the option into the dropzone (computer users) or by selecting the option and then selecting the dropzone (users on smaller screens or mobile). For keyboard only users, use the tab key to select an option from the list and use the enter key to select it. Use tab again to select the correct dropzone and then hit the enter key to place the option in that dropzone. Select an option and hit the delete key to return it to its original position. Use the "Check Answers" button to get your results.</span>';
            } else {
                instructions =
                    '<span class="MAT_instructionText">Sort each item into the appropriate category by dragging the option into the dropzone (computer users) or by selecting the option and then selecting the dropzone (users on smaller screens or mobile). For keyboard only users, use the tab key to select an option from the list and use the enter key to select it. Use tab again to select the correct dropzone and then hit the enter key to place the option in that dropzone. Select an option and hit the delete key to return it to its original position. Use the "Check Answers" button to get your results.</span>';
            }
        }
    }
    if (MatchingApp.AppData.Instructions !== 'none' && MatchingApp.AppData.Instructions !== null && MatchingApp.AppData.Instructions !== undefined && MatchingApp.AppData.Instructions !== '') {
        instructions = MatchingApp.AppData.Instructions + '' + instructions;
    }
    var MAT_iToggle = document.createElement('span');
    MAT_iToggle.id = 'MAT_iToggle';
    MAT_iToggle.setAttribute('tabindex', '0');
    $(MAT_iToggle).addClass('iDown');
    MAT_iToggle.innerHTML = '&#9650;<span class="sr-only">Collapse instructions</span>';
    $(MAT_iToggle).click(function () {
        if ($(this).hasClass('iDown') === true) {
            $(this).removeClass('iDown');
            $(this).addClass('iUp');
            $('#MAT_activityText').slideUp(500);
            this.innerHTML = '&#9660;<span class="sr-only">Collapse instructions</span>';
        } else {
            $(this).addClass('iDown');
            $(this).removeClass('iUp');
            $('#MAT_activityText').slideDown(500);
            this.innerHTML = '&#9650;<span class="sr-only">Collapse instructions</span>';
        }
    });
    $(MAT_iToggle).keyup(function (e) {
        if (e.key === 13) {
            $(this).click();
        }
    });
    // var MAT_instructions = document.createElement('div');
    // MAT_instructions.id = 'MAT_instructions';
    // MAT_instructions.setAttribute('class', 'toggledOff');
    // MAT_appContainer.appendChild(MAT_instructions);
    // var MAT_instructionText = document.createElement('p');
    // MAT_instructionText.id = 'MAT_instructionText';
    // $(MAT_instructionText).css('padding', '10px');
    // $(MAT_instructionText).css('text-align', 'center');
    // MAT_instructionText.innerHTML = instructions;
    // MAT_appContainer.appendChild(MAT_instructionText);
    MAT_activityText.innerHTML = instructions;
    $(MAT_activityText).hide().appendTo(MAT_appContainer).fadeIn();
    $(MAT_iToggle).hide().appendTo(MAT_appContainer).fadeIn();
    // $('#MAT_instructions').toggle();
};

/**
 * Resets styles of the source (original) dropzone after reverting/dragging away some/all draggable items.
 *
 * @method resetDropzoneStyles
 * @param {Object} parent parent dropzone from which the item is dragged away
 * @param {Object} draggable draggable item that is being reverted/dragged away
 */
MatchingApp.resetDropzoneStyles = function (parent, draggable) {
    //  if parent does not have a class 'dropzone' (e.g. answers column), resets its min height so that there is no gap between questions and answers on mobile
    if (!parent.classList.contains('dropzone') && parent.classList.contains('MAT_qCol')) {
        const newParentHeight = parent.offsetHeight - draggable.offsetHeight;
        const grandParent = document.getElementById(parent.parentNode.parentNode.id);
        grandParent.style.minHeight = `${newParentHeight}px`;
    } else {
        let draggableCollapsedHeight;
        if (!draggable.classList.contains('collapsed')) {
            draggable.classList.add('collapsed');
            draggableCollapsedHeight = draggable.offsetHeight;
            draggable.classList.remove('collapsed');
        } else {
            draggableCollapsedHeight = draggable.offsetHeight;
        }

        if (parent.children.length === 1) {
            parent.style.background = MatchingApp.dropzoneBackground;
            parent.style.minHeight = `${MatchingApp.dropzoneHeight}px`;
        } else if (parent.children.length >= 2) {
            // Adjusts the dropzone min height and background if there is one item or more after reverting
            parent.style.background = MatchingApp.dropzoneBackground;
            const newDropZoneHeight = MatchingApp.dropzoneHeight + (draggableCollapsedHeight + 5) * (parent.children.length - 1);
            parent.style.minHeight = `${newDropZoneHeight}px`;
            if (parent.children.length === 2) {
                parent.style.backgroundPositionY = `calc(100% - (${parent.style.minHeight} - 10px - ${draggableCollapsedHeight}px - 1.25rem) / 2)`;
            } else {
                const childrenHeight = (draggableCollapsedHeight + 5) * (parent.children.length - 1);
                parent.style.backgroundPositionY = `calc(100% - (${parent.style.minHeight} + 5px - 10px - ${childrenHeight}px - 1.25rem) / 2)`;
            }
        }
    }
};

/**
 * Saves each draggable item's starting column.
 *
 * @method assignOrigPos
 */
MatchingApp.assignOrigPos = function () {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        temp = document.getElementById('drag' + i);
        var tempPos = temp.parentNode;
        MatchingApp.origPos.splice(i, 1, tempPos);
    }
};
/**
 * Applies or removes the hover/focus effect to a draggable item.
 *
 * @method hLightEffect
 * @param {Object} target
 * @param {Boolean} on
 * @return {Boolean} Returns false
 */
MatchingApp.hLightEffect = function (target, on) {
    if ($(target).hasClass('dropped') === false) {
        if (MatchingApp.hLightingEffect === true) {
            if (MatchingApp.alreadySelected !== true) {
                if (on) {
                    $('#' + target.id).addClass('hover');
                } else {
                    idNum = parseInt(target.id.substr(4));
                    $('#' + target.id).removeClass('hover');
                }
            }
        }
    }
    return false;
};
/**
 * Allows a draggable item to be dropped.
 *
 * @method allowDrop
 * @param {Object} ev
 */
MatchingApp.allowDrop = function (ev) {
    ev.preventDefault();
};
MatchingApp.allowRevert = function (ev) {
    ev.preventDefault();
};
/**
 * Checks if the target is a drop zone.
 *
 * @method checkDropzone
 * @param {Object} target
 * @return {Boolean} Returns true if target has 'dropzone' as a class
 */
MatchingApp.checkDropzone = function (target) {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        if (target.className.search('dropzone') !== -1) {
            return true;
        }
    }
};
/**
 * Checks if the target is inside of a drop zone.
 *
 * @method checkParentDropzone
 * @param {Object} target
 * @return {Boolean} Returns true if target's parent has 'dropzone' as a class
 */
MatchingApp.checkParentDropzone = function (target) {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        if (target.parentNode.className.search('dropzone') !== -1) {
            return true;
        }
    }
};
MatchingApp.checkChildDropzone = function (target) {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        if (target.lastChild.className.search('dropzone') !== -1) {
            return true;
        }
    }
};
MatchingApp.checkSiblingDropzone = function (target) {
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        if (target.parentNode.parentNode.lastChild.className.search('dropzone') !== -1) {
            return true;
        }
    }
};
/**
 * Handles dragging an item with the mouse.
 *
 * @method drag
 * @param {Object} ev
 */
MatchingApp.drag = function (ev) {
    if (MatchingApp.disableDragging === false) {
        if (MatchingApp.notifications === true) {
            PNotify.removeAll();
        }
        var currentTarget;
        if (MatchingApp.mobileDevice === true) {
            MatchingApp.setHeight();
        }
        if ($(ev.target).hasClass('draggableImage') === true) {
            currentTarget = ev.target.parentNode;
        } else {
            currentTarget = ev.target;
        }
        currentTarget.setAttribute('ondrop', 'MatchingApp.drop(event);');
        if ($(ev.target).hasClass('dropped') === false) {
            var browserName = navigator.appName;
            if (browserName === 'Microsoft Internet Explorer') {
                ev.dataTransfer.setData('text', currentTarget.id);
            } else {
                ev.dataTransfer.setData('Text', currentTarget.id);
            }
            currentTarget.setAttribute('aria-grabbed', 'true');
            currentTarget.setAttribute('aria-dropeffect', 'move');
        }
    }
};
/**
 * Handles dropping an item into a drop zone with the mouse.
 *
 * @method drop
 * @param {Object} ev
 */
MatchingApp.drop = function (ev) {
    if (MatchingApp.disableDragging === false) {
        var browserName = navigator.appName;
        if (browserName === 'Microsoft Internet Explorer') {
            data = ev.dataTransfer.getData('text');
        } else {
            data = ev.dataTransfer.getData('Text');
        }
        var dropItem = document.getElementById(data);
        var dropParId;
        var dropItemID = dropItem.id;
        var dropIndex = dropItemID.substr(4, dropItemID.length);
        var numCheck;
        var numElements;
        var $_this;
        const inDropItemScrollHeight = dropItem.scrollHeight;
        ev.preventDefault();
        if (MatchingApp.checkDropzone(ev.target) && data.substr(0, 4) === 'drag') {
            $_this = ev.target;
            dropParId = ev.target.parentNode.id;
        } else if (MatchingApp.checkParentDropzone(ev.target) && data.substr(0, 4) === 'drag') {
            $_this = ev.target.parentNode;
            dropParId = ev.target.parentNode.parentNode.id;
        } else if (MatchingApp.checkSiblingDropzone(ev.target) && data.substr(0, 4) === 'drag') {
            $_this = ev.target.parentNode.parentNode.lastChild;
            dropParId = ev.target.parentNode.parentNode.id;
        } else if (MatchingApp.checkChildDropzone(ev.target) && data.substr(0, 4) === 'drag') {
            $_this = ev.target.lastChild;
            dropParId = ev.target.id;
        }

        var ids = [];
        $.each($('#' + dropParId + ' .draggableTextNode'), function (mac, cheese) {
            ids.push(cheese.getAttribute('id'));
        });
        if ($.inArray(dropItem.getAttribute('id'), ids) > -1) return false;
        if (typeof dropParId !== 'undefined') {
            idNum = parseInt(dropParId.substr(10));
            numCheck = MatchingApp.matchAmount[idNum];
            numElements = $($_this).children().length + 1;
            dropItem.setAttribute('aria-grabbed', 'false');
            dropItem.removeAttribute('aria-dropeffect');
            dropItem.removeAttribute('ondrop');
            if (numElements > numCheck) {
                if (MatchingApp.notifications === true) {
                    new PNotify({
                        text: $($_this).attr('title') + ' is full',
                        type: 'info'
                    });
                }
            }
            if (MatchingApp.ActivityType === 'match') {
                if ($($_this).is(':empty')) {
                    if (MatchingApp.questionData[dropIndex].type === 'text') {
                        if ($(dropItem).hasClass('collapsed') === true) {
                            $(dropItem).removeClass('collapsed');
                        }
                        if (dropItem.scrollHeight > MatchingApp.lineHeightNoBorders && dropItem.scrollHeight <= MatchingApp.lineHeightWithBorders) {
                            $(dropItem).addClass('fullExpand');
                        }
                    }
                    if (MatchingApp.SCORMEnabled) {
                        MatchingApp.sendDropEvent(dropItem, $('#' + dropParId)[0]);
                    }
                    $_this.appendChild(dropItem);
                    MatchingApp.HandleMobileDrop();
                }
            } else {
                if (numElements <= numCheck) {
                    if (MatchingApp.questionData[dropIndex].type === 'text') {
                        if ($(dropItem).hasClass('collapsed') === true) {
                            $(dropItem).removeClass('collapsed');
                        }
                        if (dropItem.scrollHeight > MatchingApp.lineHeightNoBorders && dropItem.scrollHeight <= MatchingApp.lineHeightWithBorders) {
                            $(dropItem).addClass('fullExpand');
                        }
                    }
                    if (MatchingApp.SCORMEnabled) {
                        MatchingApp.sendDropEvent(dropItem, $('#' + dropParId)[0]);
                    }
                    // ** START OF NEW FEATURE **
                    // Evaluates whether there are more items that need to be dropped in the dropzone.
                    // If there are none, resets the dropzone background styles to none so that the "plus" does not appear behind the dropped items.
                    if (numElements === numCheck) {
                        $_this.style.background = 'none';
                    } else if (numElements < numCheck) {
                        // Checks if there are more items that need to be dropped in the dropzone
                        // If so, increases the dropzone height (clickable area) by the height of a dropped item plus 10px padding  and
                        // resets the background position for the "plus" sign to appear at the bottom
                        // Measures collapsed dropItem offsetHeight to be used for calculations
                        let dropItemCollapsedHeight;
                        if (!dropItem.classList.contains('collapsed')) {
                            dropItem.classList.add('collapsed');
                            dropItemCollapsedHeight = dropItem.offsetHeight;
                            dropItem.classList.remove('collapsed');
                        } else {
                            dropItemCollapsedHeight = dropItem.offsetHeight;
                        }

                        const newDropZoneHeight = dropItemCollapsedHeight + $_this.offsetHeight + 5;
                        $_this.style.minHeight = `${newDropZoneHeight}px`;
                        //calculates new background position where 10px is padding top of the container and 1.25rem background size (plus sign size)
                        if ($_this.children.length < 1) {
                            $_this.style.backgroundPositionY = `calc(100% - (${$_this.offsetHeight}px - ${dropItemCollapsedHeight}px - 10px - 1.25rem) / 2)`;
                        } else if ($_this.children.length >= 1) {
                            const childrenHeight = (dropItemCollapsedHeight + 5) * ($_this.children.length + 1);
                            $_this.style.backgroundPositionY = `calc(100% - (${$_this.offsetHeight}px + 5px - 10px - ${childrenHeight}px - 1.25rem) / 2)`;
                        }
                    }
                    // Intial parent node - relevant dropzone
                    const initialParent = document.getElementById(dropItem.parentNode.id);
                    MatchingApp.resetDropzoneStyles(initialParent, dropItem);
                    // ** END OF NEW FEATURE **
                    $_this.appendChild(dropItem);
                    // MatchingApp.HandleMobileDrop();
                    // MatchingApp.checkForCollapse();
                }
            }
        }
        // MatchingApp.checkAnswerInterval = setInterval('MatchingApp.checkAllAnswered();', 1000);
        MatchingApp.checkAllAnswered();
        /*
      if ($("#MAT_iToggle").hasClass('iDown') === true) {
         $("#MAT_iToggle").click();
      }
      */
        // ** START OF NEW FEATURE  - handling expand/collapse - for the sake of consistency
        if (dropItem.classList.contains('collapsed')) {
            dropItem.classList.remove('collapsed');
        }
        // adding full expand to short answers
        if (dropItem.scrollHeight > MatchingApp.lineHeightNoBorders && dropItem.scrollHeight <= MatchingApp.lineHeightWithBorders) {
            dropItem.classList.add('fullExpand');
        }
        MatchingApp.checkForCollapse();
        // ** END OF NEW FEATURE
        dropItem.classList.remove('hover');
    }
};
/**
 * Reverts a draggable item back to it's original position with the mouse.
 *
 * @method revert
 * @param {Object} ev
 */
MatchingApp.revert = function (ev) {
    if (MatchingApp.disableDragging === false) {
        data = ev.dataTransfer.getData('Text');
        var revert = parseInt(data.substr(4, data.length));
        var revertPos = MatchingApp.origPos[revert];
        ev.preventDefault();
        // draggable = element that is being reverted (dragged away)
        const draggable = document.getElementById(data);
        if ($(draggable).hasClass('collapsed') === true) {
            $(draggable).removeClass('collapsed');
        }
        if ($(draggable.firstChild).hasClass('MAT_expand') === true) {
            $(draggable.firstChild).remove();
        }
        draggable.setAttribute('aria-grabbed', 'false');
        draggable.removeAttribute('aria-dropeffect');
        // ** START OF NEW FEATURE **
        // Parent of the element that is being reverted (dragged back) - relevant dropzone
        const dragElParent = document.getElementById(draggable.parentNode.id);
        MatchingApp.resetDropzoneStyles(dragElParent, draggable);
        // ** END OF NEW FEATURE **
        revertPos.appendChild(draggable);
        MatchingApp.checkAllAnswered();
    }
};
/**
 * Reverts a draggable item back to it's original position with the keyboard.
 *
 * @method revertKeyboard
 * @param {Object} target
 */
MatchingApp.revertKeyboard = function (target) {
    if (MatchingApp.disableDragging === false) {
        var id = target.id;
        var revert = parseInt(id.substr(4, id.length));
        var revertPos = MatchingApp.origPos[revert];
        if ($(target).hasClass('collapsed') === true) {
            $(target).removeClass('collapsed');
        }
        if ($(target.firstChild).hasClass('MAT_expand') === true) {
            $(target.firstChild).remove();
        }
        target.setAttribute('aria-grabbed', 'false');
        target.removeAttribute('aria-dropeffect');
        // ** START OF NEW FEATURE **
        // parent node - relevant dropzone
        const parent = document.getElementById(target.parentNode.id);
        MatchingApp.resetDropzoneStyles(parent, target);
        // ** END OF NEW FEATURE **
        $(target).hide().appendTo(revertPos).fadeIn(500);
        // revertPos.appendChild(target);
        $('#screenAlert')
            .html('Returned ' + target.innerHTML + ' to original position.')
            .focus();
        setTimeout(function () {
            $('#screenAlert').html('');
        }, 3000);
        MatchingApp.ExitAccessDropMode();
        MatchingApp.checkAllAnswered();
    }
};
/**
 * Evaluates whether each draggable item was placed correctly or incorrectly.
 *
 * @method evaluateScore
 */
MatchingApp.evaluateScore = function () {
    var correct =
        '<img class="correct" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAANCAYAAACgu+4kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Njk0QjdFOUFFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Njk0QjdFOUJFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5OEVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2OTRCN0U5OUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PllHhcQAAACASURBVHjaYmIgB2zx7wBjIGAhSzMDQzmUzcBEtmYI4GeiQPMMIM5iokQzg8/G/0xQBYzkaAZxmKCap8FClRTNEANAmhkYMsAKkQ0hQjMsGj8i8UGGINgENIMAIw7bGIjRDPMCA1CyAkh2kqoZYQB2QwhqRngBM+T5idEMAgABBgBezD9OGUJHCwAAAABJRU5ErkJggg==" alt="right check mark" />';
    var wrong =
        '<img class="wrong" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAANCAYAAACgu+4kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6REI5RDZEMTdFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6REI5RDZEMThFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5Q0VBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEQjlENkQxNkVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuBTV64AAAC/SURBVHjahJPRDcIwDETtCLEAjARSv/iL0hXoQGUFoi5QCUaCBfgJDnJQmubSSlak691zaqscQqA3n/dENEnNR3reCDwvOl3l6KTsITw+UTP6LoYvUqOaUHhU35T0BJgz7wqShan0/wB67aEGqYSH/DM5zoCZUScv5WrhmFsBAKTaGQIUci86ewn3uScBDJi2K2SHtmM2pu1b21kAwLR7tJ0FoLWq1orzG3Ro2gDy9+/0tFv/QtSlcwrbpH8FGAC2umDxE/BZxwAAAABJRU5ErkJggg==" alt="wrong x" />';

    if (MatchingApp.AppData.FeedbackType === 'continuous') {
        $('.correct').remove();
        $('.wrong').remove();
    }
    if (MatchingApp.AppData.FeedbackType === 'continuous') {
        for (i = 0; i < MatchingApp.questionData.length; i++) {
            temp = document.getElementById('drag' + i);
            tempPar = temp.parentNode.parentNode;
            tempComp = tempPar.id;
            ans = parseInt(tempComp.substr(10));
            if (tempPar.getAttribute('class') === 'MI_aSlot') {
                if (MatchingApp.qMatch[i] === MatchingApp.aMatch[ans]) {
                    MatchingApp.scoreEval.push(1);
                    if ($(temp.firstChild).hasClass('MAT_expand') === true) {
                        $(temp.firstChild).remove();
                    }
                    if (temp.classList.contains('collapsed')) {
                        temp.classList.remove('collapsed');
                    }
                    if (!temp.classList.contains('fullExpand')) {
                        temp.classList.add('fullExpand');
                    }
                    $(temp).prepend(correct);
                    $(temp).css('background-color', '#EFE');
                    $(temp).disabled = true;
                    if ($(temp).hasClass('dropped') === false) {
                        $(temp).toggleClass('dropped');
                    }
                } else {
                    MatchingApp.scoreEval.push(0);
                    if ($(temp.firstChild).hasClass('MAT_expand') === true) {
                        $(temp.firstChild).remove();
                    }
                    if (temp.classList.contains('collapsed')) {
                        temp.classList.remove('collapsed');
                    }
                    if (!temp.classList.contains('fullExpand')) {
                        temp.classList.add('fullExpand');
                    }
                    $(temp).prepend(wrong);
                }
            }
        }
    } else {
        for (i = 0; i < MatchingApp.questionData.length; i++) {
            temp = document.getElementById('drag' + i);
            tempPar = temp.parentNode.parentNode;
            tempComp = tempPar.id;
            ans = parseInt(tempComp.substr(10));
            MatchingApp.savedElements.push(temp.innerHTML);
            MatchingApp.savedAnswers.push(temp.parentNode.id);
            if (temp.classList.contains('collapsed')) {
                temp.classList.remove('collapsed');
            }
            if (!temp.classList.contains('fullExpand')) {
                temp.classList.add('fullExpand');
            }
            /* Remove if statement to Remove Check and X from appearing in Drop table*/
            if (MatchingApp.qMatch[i] === MatchingApp.aMatch[ans]) {
                MatchingApp.scoreEval.push(1);
                $(temp).prepend(correct);
            } else {
                MatchingApp.scoreEval.push(0);
                //     if ($(temp).hasClass('collapsed') === true) {
                //       $(temp).removeClass('collapsed');
                //   }
                //   if ($(temp).hasClass('fullExpand') === false) {
                //    $(temp).addClass('fullExpand');
                //  }
                $(temp).prepend(wrong);
            }
            /*Stop Remove lines*/
        }

        $('#MAT_buttonSet').hide();
        MatchingApp.buildReport();
    }
};
/**
 * Score gets calculated based on each draggable item's determined correctness.
 *
 * @method calculateScore
 * @return {Integer} Returns score
 */
MatchingApp.calculateScore = function () {
    var score = 0;
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        switch (MatchingApp.scoreEval[i]) {
            case 1:
                score += 1;
                break;
            default:
                score = score;
                break;
        }
    }
    return score;
};
/**
 * Checks the users answers and makes adjustments to the activity's buttons based on the activity type.
 *
 * @method checkAnswers
 */
MatchingApp.checkAnswers = function () {
    $('.correct').remove();
    $('.wrong').remove();
    if (MatchingApp.scoreEval.length > 0) {
        MatchingApp.disableDragging = true;
    }

    if (MatchingApp.notifications === true) {
        PNotify.removeAll();
    }
    MatchingApp.evaluateScore();
    if (MatchingApp.mobileDevice === false) {
        //  MatchingApp.checkCollapse = setInterval(MatchingApp.checkForCollapse, 100);
    }
    var score = MatchingApp.calculateScore();
    var wrongAnswers = $('.wrong');

    $('#MAT_progress').html('You currently have ' + score + ' items in the correct category.');
    $('#MAT_progress').css('color', 'red');
    var total = 0;
    for (var i = 0; i < MatchingApp.matchAmount.length; i++) {
        total += MatchingApp.matchAmount[i];
    }
    if (score === total) {
        MatchingApp.finishedQuiz = true;
        if (MatchingApp.AppData.FeedbackType === 'continuous') {
            $('#MAT_resetWrongButton').remove();

            if (window.startLocation === undefined && MatchingApp.AppData.IncludePostPage) {
                $(MatchingApp.postQuizButton).hide().appendTo($('#MAT_buttonSet')).fadeIn(500);
            } else {
                $('#MAT_buttonSet').append(MatchingApp.restartButton).fadeIn(500);
                document.getElementById('MAT_checkButton').disabled = true;
            }
        }
        $('#MAT_progress').html(
            'Congratulations, you have successfully matched all ' +
                MatchingApp.questionData.length +
                ' scenarios with their correct approach. ' +
                'You are ready to proceed to the next topic in the course.'
        );
    }
    MatchingApp.scoreEval = [];
    if (MatchingApp.finishedQuiz === false) {
        if (MatchingApp.AppData.FeedbackType === 'continuous') {
            if (wrongAnswers.length > 0) {
                document.getElementById('MAT_resetWrongButton').disabled = false;
                $('#MAT_resetWrongButton').fadeIn(500);
            }
        }
    }

    MatchingApp.score = score;
    MatchingApp.disableDragging = true;
    MatchingApp.onComplete();
};
/**
 * Determines if all the draggable items have been placed in a drop zone.
 *
 * @method checkAllAnswered
 */
MatchingApp.checkAllAnswered = function () {
    if (MatchingApp.AppData.FeedbackType === 'report') {
        if (typeof document.getElementById('MAT_checkButton') !== 'undefined') {
            var total = 0;
            for (var i = 0; i < MatchingApp.matchAmount.length; i++) {
                total += MatchingApp.matchAmount[i];
            }
            var answered = $('.dropzone .draggableTextNode').length;
            if (answered >= total) {
                document.getElementById('MAT_checkButton').disabled = false;
                $('#MAT_checkButton').fadeIn(500);
            } else {
                document.getElementById('MAT_checkButton').disabled = true;
                $('#MAT_checkButton').fadeOut(500);
            }
        }
    }
};
MatchingApp.checkForCollapse = function () {
    $('.draggableTextNode').each(function () {
        var dropItemID = this.id;
        var dropIndex = dropItemID.substr(4, dropItemID.length);
        if (MatchingApp.questionData[dropIndex].type === 'text') {
            if ($(this.parentNode).hasClass('dropzone') === true) {
                if ($(this.firstChild).hasClass('MAT_expand') === true) {
                    if ($(this)[0].scrollWidth === parseInt($(this).innerWidth())) {
                        if ($(this).hasClass('collapsed') === true) {
                            $(this.firstChild).remove();
                            $(this).removeClass('collapsed');
                            $(this).addClass('fullExpand');
                        }
                    }
                } else {
                    if ($(this)[0].scrollWidth > parseInt($(this).innerWidth()) || this.scrollHeight > MatchingApp.lineHeightWithBorders) {
                        var cToggle = document.createElement('span');
                        cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
                        $(cToggle).addClass('MAT_expand');
                        $(cToggle).click(function () {
                            if ($(this.parentNode).hasClass('collapsed') === true) {
                                $(this.parentNode).removeClass('collapsed');
                                $(cToggle).addClass('expanded');
                                cToggle.innerHTML = '&#9660;<span class="sr-only">Collapse drag item</span>';
                            } else {
                                $(this.parentNode).addClass('collapsed');
                                $(cToggle).removeClass('expanded');
                                cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
                            }
                        });
                        $(cToggle).keyup(function (e) {
                            if (e.key === 13) {
                                if ($(this.parentNode).hasClass('collapsed') === true) {
                                    $(this.parentNode).removeClass('collapsed');
                                    $(cToggle).addClass('expanded');
                                    cToggle.innerHTML = '&#9660;<span class="sr-only">Collapse drag item</span>';
                                } else {
                                    $(this.parentNode).addClass('collapsed');
                                    $(cToggle).removeClass('expanded');
                                    cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
                                }
                            }
                        });
                        $(this).prepend(cToggle);
                        if ($(this).hasClass('fullExpand') === true) {
                            $(this).removeClass('fullExpand');
                        }
                    }
                }
                if (this.scrollHeight > MatchingApp.lineHeightWithBorders && $(this.firstChild).hasClass('expanded') === false) {
                    $(this).addClass('collapsed');
                }
            }
        }
        if ($(this.firstChild).hasClass('MAT_expand') === false) {
            $(this).addClass('fullExpand');
        }
    });
};
/**
 * Resets all of the draggable items to their original columns.
 *
 * @method reset
 */
MatchingApp.reset = function () {
    // Selects all dropzones and resets their styles to default as defined on initial build
    document.querySelectorAll('.dropzone').forEach((dropzone) => {
        // Resets the dropzone min height (40px)
        dropzone.style.minHeight = `${MatchingApp.dropzoneHeight}px`;
        // Resets the dropzone original background styles (adding "plus" sign in the centre)
        dropzone.style.background = MatchingApp.dropzoneBackground;
    });

    if (MatchingApp.notifications === true) {
        PNotify.removeAll();
    }
    MatchingApp.ti = 0;
    $('.correct').remove();
    $('.wrong').remove();
    MatchingApp.scoreEval = [];
    for (i = 0; i < MatchingApp.questionData.length; i++) {
        temp = document.getElementById('drag' + i);
        if ($(temp).hasClass('dropped') === true) {
            $(temp).toggleClass('dropped');
            $(temp).css('background-color', 'none');
        }
        if ($(temp).hasClass('collapsed') === true) {
            $(temp).removeClass('collapsed');
        }
        if ($(temp.firstChild).hasClass('MAT_expand') === true) {
            $(temp.firstChild).remove();
        }
        $(temp).hide().appendTo(MatchingApp.origPos[i]).fadeIn(500);
        // MatchingApp.origPos[i].appendChild(temp);
    }
    $('.draggableTextNode').each(function () {
        this.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    });
    $('#MAT_progress').html('Click the "Check Answers" button to check your progress.');
    $('#MAT_progress').css('color', 'black');
    MatchingApp.HandleMobileDrop();
    if (MatchingApp.AppData.FeedbackType === 'continuous') {
        MatchingApp.finishedQuiz = false;
        $('#MAT_resetButton').fadeOut(500, function () {
            $('#MAT_resetButton').remove();
        });
        $('#MAT_buttonSet').append(MatchingApp.resetWrongButton);
        MatchingApp.sessionTimer = 0;
        MatchingApp.currentAttempts++;
        MatchingApp.onComplete();
    }
    if (MatchingApp.AppData.Randomize === true) {
        //re-shuffle items
        $('.MAT_qCol').each(function () {
            var draggableTextNode = $(this).find('.draggableTextNode');
            for (var i = 0; i < draggableTextNode.length; i++) $(draggableTextNode[i]).remove();
            var i = draggableTextNode.length;
            if (i == 0) return false;
            while (--i) {
                var j = Math.floor(Math.random() * (i + 1));
                var tempi = draggableTextNode[i];
                var tempj = draggableTextNode[j];
                draggableTextNode[i] = tempj;
                draggableTextNode[j] = tempi;
            }
            for (var i = 0; i < draggableTextNode.length; i++) $(draggableTextNode[i]).appendTo(this);
        });
    }
    MatchingApp.initAccMAT();
    MatchingApp.GoToTop();
};
/**
 * Resets only the incorrectly placed draggable items to their original columns.
 *
 * @method resetWrong
 */
MatchingApp.resetWrong = function () {
    MatchingApp.ti = 0;
    MatchingApp.scoreEval = [];

    $.each($('.wrong'), function () {
        var el = this.parentNode;
        var id = el.id.substr(4);

        if ($(el.firstChild).hasClass('MAT_expand') === true) {
            $(el.firstChild).remove();
            $(el).removeClass('collapsed');
            $(el).addClass('fullExpand');
        }
        $(el).hide().appendTo(MatchingApp.origPos[id]).fadeIn(500);
    });

    $('.draggableTextNode').each(function () {
        this.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    });
    $('.wrong').remove();
    document.getElementById('MAT_resetWrongButton').disabled = true;
    $('#MAT_resetWrongButton').fadeOut(500);
    $('#MAT_progress').html('Click the "Check Answers" button to check your progress');
    $('#MAT_progress').css('color', 'black');
    MatchingApp.HandleMobileDrop();
    MatchingApp.GoToTop();
};
/**
 * Handles the selecting of a draggable item with a click, touch, or the keyboard.
 *
 * @method setMobileSelect
 * @param {Object} event
 */
MatchingApp.setMobileSelect = function (event) {
    if (MatchingApp.disableDragging === false) {
        var target;
        if (MatchingApp.notifications === true) {
            PNotify.removeAll();
        }
        if ($(event.target.parentNode).hasClass('draggableTextNode')) {
            target = event.target.parentNode;
        } else {
            target = event.target;
        }
        if ($(target.parentNode).hasClass('dropzone')) {
            event.stopPropagation();
        } else {
            MatchingApp.EnterAccessDropMode();
            if (MatchingApp.mobileDevice === true) {
                MatchingApp.setHeight();
            }
            if (MatchingApp.alreadySelected === false) {
                MatchingApp.alreadySelected = true;
                $(target).addClass('dragMe');
                $(target).css('border', 'thin dashed #D3D9E3');
                if (
                    MatchingApp.AppData.DefaultSelectColor !== null &&
                    MatchingApp.AppData.DefaultSelectColor !== undefined &&
                    MatchingApp.AppData.DefaultSelectColor !== 'none' &&
                    MatchingApp.AppData.DefaultSelectColor !== ''
                ) {
                    // $(target).css('background-color', MatchingApp.AppData.DefaultSelectColor);
                } else {
                    // $(target).css('background-color', '#b7e5e5');
                }
                target.setAttribute('aria-grabbed', 'true');
                MatchingApp.initMobileSelect(target);
            } else {
                if ($(target).hasClass('dragMe') === true) {
                    $(target).removeClass('dragMe');
                    $(target).css('border', 'thin solid #D3D9E3');
                    idNum = parseInt(target.id.substr(4));
                    //$(target).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
                    target.setAttribute('aria-grabbed', 'false');
                    MatchingApp.alreadySelected = false;
                    MatchingApp.HandleMobileDrop();
                    MatchingApp.ExitAccessDropMode();
                } else {
                    MatchingApp.HandleMobileDrop();
                    MatchingApp.alreadySelected = false;
                    $(target).addClass('dragMe');
                    $(target).css('border', 'thin dashed #D3D9E3');
                    idNum = parseInt(target.id.substr(4));
                    //$(target).css('background-color', MatchingApp.AppData.DefaultSelectColor);
                    target.setAttribute('aria-grabbed', 'true');
                    MatchingApp.alreadySelected = true;
                    MatchingApp.initMobileSelect(target);
                }
            }
        }
    }
};
/**
 * Displays which element has been selected.
 *
 * @method initMobileSelect
 * @param {Object} target
 */
MatchingApp.initMobileSelect = function (target) {
    temp = target.innerHTML;
    var temp2 = target.lastChild.alt;
    var accessMsg = '';
    var message = '';
    MatchingApp.selectedElements.push(temp);
    message = MatchingApp.selectedElements[0];
    accessMsg = MatchingApp.selectedElements[0];
    MatchingApp.droppedItem = accessMsg;
    if (temp2 !== undefined) {
        accessMsg = temp2;
        MatchingApp.droppedItem = accessMsg;
    }
    if (document.getElementById('screenAlert') === null) {
        var screenAlert = document.createElement('div');
        screenAlert.id = 'screenAlert';
        screenAlert.setAttribute('aria-live', 'assertive');
        MatchingApp.containerRef.appendChild(screenAlert);
    }
    MatchingApp.ShowAccMessage('Selected: ' + message);
    $('#screenAlert')
        .html('Selected: ' + accessMsg)
        .focus();
    setTimeout(function () {
        $('#screenAlert').html('');
    }, 3000);
};
/**
 * Drops a selected draggable item into a specified drop zone.
 *
 * @method HandleMobileDrop
 * @param {Object} target
 */
MatchingApp.HandleMobileDrop = function (target) {
    var message = '';
    var alert = '';
    for (i = 0; i < MatchingApp.selectedElements.length; i++) {
        if (i > 0) {
            message += ', ' + MatchingApp.selectedElements[i];
        } else {
            message += MatchingApp.selectedElements[i];
        }
    }
    if (message === '') {
        message = 'none';
    }
    if ($(target).hasClass('dropzone')) {
        alert = 'Dropped: ' + MatchingApp.droppedItem + ' into ' + target.parentNode.firstChild.firstChild.innerHTML + ' dropzone';
    } else {
        alert = 'Dropped: ' + MatchingApp.droppedItem;
    }
    $('#screenAlert').html(alert).focus();
    setTimeout(function () {
        $('#screenAlert').html('');
    }, 3000);
    MatchingApp.selectedElements = [];
    var dropItem = $('.dragMe')[0];
    var dropParId;
    var numCheck;
    var numElements;
    if (target !== null && target !== undefined) {
        dropParId = target.parentNode.id;
        idNum = parseInt(dropParId.substr(10));
        numCheck = MatchingApp.matchAmount[idNum];
        numElements = $(target).children().length + 1;
    }
    var ids = [];
    $.each($('#' + dropParId + ' .draggableTextNode'), function (mac, cheese) {
        ids.push(cheese.getAttribute('id'));
    });
    if (typeof dropItem !== 'undefined') {
        if ($.inArray(dropItem.getAttribute('id'), ids) > -1) return false;
    }
    if (MatchingApp.ActivityType === 'match') {
        if ($(target).is(':empty')) {
            if (MatchingApp.SCORMEnabled) {
                MatchingApp.sendDropEvent(dropItem, $('#' + dropParId)[0]);
            }
            $(target).append($(dropItem));
            MatchingApp.ExitAccessDropMode();
        }
    } else {
        if (numElements <= numCheck) {
            // ** START OF NEW FEATURE **
            // Mobile Drop Feature + Keyboard Control Drop Feature
            // Evaluates whether there are more items that need to be dropped in the dropzone.
            // If so, increases the dropzone height (clickable area) by the height of a dropped item and
            // resets the background position for the "plus" sign to appear at the bottom
            if (numElements < numCheck) {
                dropItem.classList.add('collapsed');
                let dropItemCollapsedHeight = dropItem.offsetHeight;
                dropItem.classList.remove('collapsed');

                const newDropZoneHeight = dropItemCollapsedHeight + target.offsetHeight + 5;
                target.style.minHeight = `${newDropZoneHeight}px`;
                //calculates new background position where 10px is padding top of the container and 1.25rem background size (plus sign size)
                if (target.children.length < 1) {
                    target.style.backgroundPositionY = `calc(100% - (${target.offsetHeight}px - ${dropItemCollapsedHeight}px - 10px - 1.25rem) / 2)`;
                } else if (target.children.length >= 1) {
                    const childrenHeight = (dropItemCollapsedHeight + 5) * (target.children.length + 1);
                    target.style.backgroundPositionY = `calc(100% - (${target.offsetHeight}px + 5px - 10px - ${childrenHeight}px - 1.25rem) / 2)`;
                }
                // If there are no more items to be dropped in the dropzone, resets the dropzone background styles to none so that the "plus" does not appear behind the dropped items.
                // Also checks if the dropItem is not undefined to prevent a bug on mobile where a click on a drag item in one dropzone followed by a click on another dropzone leads to background being reset to none
            } else if (numElements === numCheck && !!dropItem) {
                target.style.background = 'none';
            }
            // ** END OF NEW FEATURE **
            if (MatchingApp.SCORMEnabled) {
                MatchingApp.sendDropEvent(dropItem, $('#' + dropParId)[0]);
            }
            // ** START OF NEW FEATURE **
            // Intial parent node - relevant dropzone
            const initialParent = document.getElementById(dropItem.parentNode.id);
            MatchingApp.resetDropzoneStyles(initialParent, dropItem);
            // ** END OF NEW FEATURE **
            $(target).append($(dropItem));
            MatchingApp.ExitAccessDropMode();
        }
    }
    if (numElements > numCheck) {
        if (MatchingApp.notifications === true) {
            new PNotify({
                text: $(target).attr('title') + ' is full',
                type: 'info'
            });
        }
    }
    $(dropItem).removeClass('dragMe');
    $(dropItem).removeClass('hover');
    $(dropItem).css('border', 'thin solid #D3D9E3');
    if (dropItem !== null && dropItem !== undefined) {
        idNum = parseInt(dropItem.id.substr(4));
        // $(dropItem).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
        $(dropItem).attr('aria-grabbed', 'false');
        // if ($(dropItem.firstChild).hasClass('MAT_expand') === false) {
        //     var cToggle = document.createElement('span');
        //     cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
        //     $(cToggle).addClass('MAT_expand');
        //     $(cToggle).click(function() {
        //         if ($(this.parentNode).hasClass('collapsed') === true) {
        //             $(this.parentNode).removeClass('collapsed');
        //             $(cToggle).addClass('expanded');
        //             cToggle.innerHTML = '&#9660;<span class="sr-only">Collapse drag item</span>';
        //         } else {
        //             $(this.parentNode).addClass('collapsed');
        //             $(cToggle).removeClass('expanded');
        //             cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
        //         }
        //     });
        //     $(cToggle).keyup(function(event) {
        //         if (event.keyCode === 13) {
        //             $(this).click();
        //         }
        //     });
        //     $(dropItem).prepend(cToggle);
        // }
        // $(dropItem).addClass('collapsed');
        dropItem.removeAttribute('ondrop');
    }
    // ** START OF NEW FEATURE **
    MatchingApp.checkForCollapse();
    // ** END OF NEW FEATURE **
    MatchingApp.HideAccMessage();
    MatchingApp.alreadySelected = false;
    MatchingApp.checkAllAnswered();
};
/**
 * Handles the selecting or reverting of a draggable item with the keyboard.
 *
 * @method initAccMAT
 */
MatchingApp.initAccMAT = function () {
    if (MatchingApp.disableDragging === false) {
        const containers = $(MatchingApp.accMATCont + '.draggableTextNode');
        // Selects a draggable item on click/touch (on desktop and mobile)
        containers.click(function (ev) {
            if ($(ev.target).hasClass('dropped')) {
                //ev.preventDefault();
            } else {
                MatchingApp.setMobileSelect(ev);
            }
        });
        // Selects or reverts a draggable item with the keyboard.
        containers.keydown(function (ev) {
            if ($(ev.target).hasClass('dropped')) {
                //ev.preventDefault();
            } else {
                if (ev.which === 13) {
                    // enter/return key
                    MatchingApp.setMobileSelect(ev);
                } else if (ev.which === 46 || ev.which === 8) {
                    // delete and backspace key
                    MatchingApp.revertKeyboard(this);
                }
            }
        });
    }
};
/**
 * Displays the currently selected draggable item.
 *
 * @method ShowAccMessage
 * @param {String} message
 */
MatchingApp.ShowAccMessage = function (message) {
    $('#AccMessageDisp').html(message);
    $('#AccMessageDisp').css('visibility', 'visible');
};
/**
 * Hides the currently selected draggable item.
 *
 * @method HideAccMessage
 */
MatchingApp.HideAccMessage = function () {
    $('#AccMessageDisp').html('');
    $('#AccMessageDisp').css('visibility', 'hidden');
};
/**
 * Makes the drop zones accessible by keyboard, and the draggable items inaccessible, once an item has been selected.
 *
 * @method EnterAccessDropMode
 */
MatchingApp.EnterAccessDropMode = function () {
    if (MatchingApp.mobileDevice === true) {
        MatchingApp.setHeight();
    }
    $('.draggableTextNode').each(function () {
        if ($(this.firstChild).hasClass('MAT_expand') === true) {
            this.firstChild.setAttribute('tabindex', '-1');
            this.firstChild.setAttribute('aria-hidden', 'true');
        }
        this.setAttribute('tabindex', '-1');
        this.setAttribute('aria-hidden', 'true');
    });
    $('.MAT_button').each(function () {
        this.setAttribute('tabindex', '-1');
        this.setAttribute('aria-hidden', 'true');
    });
    ti = 1;
    $('.dropzone').each(function () {
        this.setAttribute('tabindex', ti);
        ti++;
    });
    $('.dropzone').focus(MatchingApp.HandleAccessDropzoneFocus);
    $('.dropzone').blur(MatchingApp.HandleAccessDropzoneBlur);
};
/**
 * Reverts a drop zone's original styling after it loses focus.
 *
 * @method HandleAccessDropzoneBlur
 */
MatchingApp.HandleAccessDropzoneBlur = function () {
    ansId = parseInt(this.parentNode.id.substr(10));
    if (MatchingApp.savedBackgrounds[ansId] === 'none') {
        // $(this).css('background-color', '#FFFFFF');
    } else {
        // $(this).css('background-image', 'url(' + MatchingApp.savedBackgrounds[ansId] + ')');
        // $(this).css('background-repeat', 'repeat');
    }
    $(this).unbind('keyup', MatchingApp.HandleAccessDropRequest);
};
/**
 * Highlights the drop zone that currently has focus.
 *
 * @method HandleAccessDropzoneFocus
 */
MatchingApp.HandleAccessDropzoneFocus = function () {
    ansId = parseInt(this.parentNode.id.substr(10));
    if (MatchingApp.savedBackgrounds[ansId] === 'none') {
        // $(this).css('background-color', '#f9f9f9');
    } else {
        // $(this).css('background-color', '#f9f9f9');
        // $(this).css('background-image', 'none');
    }
    $(this).keyup(MatchingApp.HandleAccessDropRequest);
    this.setAttribute('onclick', 'MatchingApp.HandleMobileDrop(this)');
};
/**
 * Handles the dropping of an element into a drop zone with the keyboard.
 *
 * @method HandleAccessDropRequest
 * @param {Object} ev
 */
MatchingApp.HandleAccessDropRequest = function (ev) {
    //Simply adjusts the select size to reflect the number of listed items after each keypress.
    if (ev.which === 13) {
        $(this).click();
        setTimeout(function () {
            MatchingApp.ExitAccessDropMode();
        }, 200);
    }
};
/**
 * Makes the drop zones inaccessible by keyboard, and the draggable items accessible, once an item has been dropped.
 *
 * @method ExitAccessDropMode
 */
MatchingApp.ExitAccessDropMode = function () {
    MatchingApp.ti = 0;
    $('.draggableTextNode').each(function () {
        if ($(this.firstChild).hasClass('MAT_expand') === true) {
            this.firstChild.setAttribute('tabindex', MatchingApp.ti);
            this.firstChild.setAttribute('aria-hidden', 'false');
            //MatchingApp.ti++;
        }
        this.setAttribute('tabindex', MatchingApp.ti);
        this.setAttribute('aria-hidden', 'false');
        //MatchingApp.ti++;
    });
    // MatchingApp.instructionButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
    MatchingApp.checkAnswersButton.setAttribute('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
    if (MatchingApp.AppData.FeedbackType === 'continuous') {
        MatchingApp.resetWrongButton.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    } else {
        MatchingApp.resetButton.setAttribute('tabindex', MatchingApp.ti);
        //MatchingApp.ti++;
    }
    $('#MAT_instructions').attr('tabindex', MatchingApp.ti);
    //MatchingApp.ti++;
    $('.MAT_button').each(function () {
        this.setAttribute('aria-hidden', 'false');
    });
    $('.dropzone').unbind('focus', MatchingApp.HandleAccessDropzoneFocus);
    $('.dropzone').unbind('blur', MatchingApp.HandleAccessDropzoneBlur);
    $('.dropzone').each(function () {
        if (MatchingApp.mobileDevice === false) {
            this.removeAttribute('onclick');
        }
        ansId = parseInt(this.parentNode.id.substr(10));
        this.setAttribute('tabindex', -1);
        if (MatchingApp.savedBackgrounds[ansId] === 'none') {
            // $(this).css('background-color', '#FFFFFF');
        } else {
            // $(this).css('background-image', 'url(' + MatchingApp.savedBackgrounds[ansId] + ')');
        }
        $(this).unbind('keyup', MatchingApp.HandleAccessDropRequest);
        this.blur();
    });
    MatchingApp.HideAccMessage();
    setTimeout(function () {
        MatchingApp.GoToTop();
    }, 100);
};
/**
 * Handles the dragging and dropping of a draggable item on a mobile/touch screen device.
 *
 * @method touchDrag
 * @param {Object} evt
 */
MatchingApp.touchDrag = function (evt) {
    if (MatchingApp.mobileDevice === true) {
        MatchingApp.setHeight();
    }
    var draggable = evt.target;
    var revertPos = draggable.id;
    var revert = parseInt(revertPos.substr(4, revertPos.length));
    var wrapper = MatchingApp.origPos[revert];
    // Make the element draggable by giving it an absolute position and modifying the x and y coordinates
    $(draggable).addClass('absolute');
    // Put the draggable into the wrapper, because otherwise the position will be relative of the parent element
    wrapper.appendChild(draggable);
    var touch = evt.targetTouches[0];
    // Place element where the finger is
    if (touch.pageX < $('#MAT_content').width() - $(draggable).width()) {
        draggable.style.left = touch.pageX - $(draggable).width() / 2 + 'px';
    } else {
        draggable.style.left = $('#MAT_content').width() - $(draggable).width() + 'px';
    }
    if (touch.pageY < $('#MAT_content').height() - $(draggable).height()) {
        draggable.style.top = touch.pageY - $(draggable).height() / 2 + 'px';
    } else {
        draggable.style.top = $('#MAT_content').height() - $(draggable).height() + 'px';
    }
    evt.preventDefault();
    var offsetX = $('body').scrollLeft();
    var offsetY = $('body').scrollTop();
    var touchedElm = document.elementFromPoint(touch.pageX - offsetX, touch.pageY - offsetY);
    if (touchedElm && touchedElm.id) {
        if (touchedElm.id === 'MAT_lowerScrollZone' || touchedElm.id === 'MAT_lowerScrollZoneLabel') {
            MatchingApp.StartScrollZoneScroll('down', evt.target);
        } else if (touchedElm.id === 'MAT_upperScrollZone' || touchedElm.id === 'MAT_upperScrollZoneLabel') {
            MatchingApp.StartScrollZoneScroll('up', evt.target);
        } else {
            MatchingApp.EndScrollZoneScroll();
        }
    } else {
        MatchingApp.EndScrollZoneScroll();
    }

    if (MatchingApp.mobileDragging === false) {
        MatchingApp.mobileDragging = true;
        draggable.addEventListener('touchend', function (event) {
            var dropParId;
            var numCheck;
            var numElements;

            MatchingApp.EndScrollZoneScroll();
            // Find the element on the last draggable position
            $(event.target).css('display', 'none');
            var endTarget = document.elementFromPoint(event.changedTouches[0].pageX - offsetX, event.changedTouches[0].pageY - offsetY);
            // Position it relative again and remove the inline styles that aren't needed anymore
            $(draggable).removeClass('absolute');
            draggable.removeAttribute('style');
            // Put the draggable into it's new home
            if (endTarget) {
                var className = document.getElementById(endTarget.id);
                if (className) {
                    if (className.className === 'connect_box dropzone') {
                        dropParId = endTarget.parentNode.id;
                        idNum = parseInt(dropParId.substr(10));
                        numCheck = MatchingApp.matchAmount[idNum];
                        numElements = $(endTarget).children().length + 1;
                        if (MatchingApp.ActivityType === 'match') {
                            if ($(className).is(':empty')) {
                                endTarget.appendChild(draggable);
                                if (MatchingApp.SCORMEnabled) {
                                    MatchingApp.sendDropEvent(draggable, $('#' + dropParId)[0]);
                                }
                                // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                                $(draggable).addClass('fullExpand');
                                // }
                                idNum = parseInt(draggable.id.substr(4));
                                // $(draggable).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
                            }
                        } else {
                            if (numElements <= numCheck) {
                                if (MatchingApp.SCORMEnabled) {
                                    MatchingApp.sendDropEvent(draggable, $('#' + dropParId)[0]);
                                }
                                endTarget.appendChild(draggable);
                                // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                                $(draggable).addClass('fullExpand');
                                // }
                                idNum = parseInt(draggable.id.substr(4));
                                // $(draggable).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
                            }
                        }
                    } else if (className.parentNode.className === 'connect_box dropzone') {
                        dropParId = endTarget.parentNode.parentNode.id;
                        idNum = parseInt(dropParId.substr(10));
                        numCheck = MatchingApp.matchAmount[idNum];
                        numElements = $(endTarget.parentNode).children().length + 1;
                        if (MatchingApp.ActivityType === 'match') {
                            if ($(className.parentNode).is(':empty')) {
                                endTarget.parentNode.appendChild(draggable);
                                if (MatchingApp.SCORMEnabled) {
                                    MatchingApp.sendDropEvent(draggable, $('#' + dropParId)[0]);
                                }
                                // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                                $(draggable).addClass('fullExpand');
                                // }
                                idNum = parseInt(draggable.id.substr(4));
                                // $(draggable).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
                            }
                        } else {
                            if (numElements <= numCheck) {
                                endTarget.parentNode.appendChild(draggable);
                                if (MatchingApp.SCORMEnabled) {
                                    MatchingApp.sendDropEvent(draggable, $('#' + dropParId)[0]);
                                }
                                // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                                $(draggable).addClass('fullExpand');
                                // }
                                idNum = parseInt(draggable.id.substr(4));
                                // $(draggable).css('background-color', MatchingApp.savedBackgroundColors[idNum]);
                            }
                        }
                    }
                    // else {
                    //    $(draggable).removeClass('collapsed');
                    // }
                }
            }
            if ($('#MAT_iToggle').hasClass('iDown') === true) {
                $('#MAT_iToggle').click();
            }

            MatchingApp.checkAllAnswered();
            MatchingApp.HideScrollZones();

            MatchingApp.mobileDragging = false;
        });
    }

    MatchingApp.ShowScrollZones(evt.target);
};
/**
 * Takes the passed object data and embeds it based on type.
 *
 * @method EmbedMedia
 * @param {String} containerRef
 * @param {Object} mediaData
 * @return
 */
MatchingApp.EmbedMedia = function (containerRef, mediaData) {
    var mediaDomObj = document.createElement('div');
    var mediaDomLink, mediaDomContent;
    mediaDomObj.setAttribute('class', 'MAT_Media');
    switch (mediaData.type) {
        case 'link':
            mediaDomContent = document.createElement('a');
            mediaDomContent.setAttribute('class', 'MAT_MediaLink');
            mediaDomContent.setAttribute('href', mediaData.src);
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.setAttribute('tabindex', MatchingApp.ti);
            //MatchingApp.ti++;
            if (mediaData.description) {
                mediaDomContent.innerHTML = mediaData.description;
            } else {
                mediaDomContent.innerHTML = 'Link';
            }
            mediaDomObj.appendChild(mediaDomContent);
            break;
        case 'image':
            if (mediaData.mediaLink !== 'none' && mediaData.mediaLink !== null && mediaData.mediaLink !== undefined && mediaData.mediaLink !== '') {
                mediaDomLink = document.createElement('a');
                mediaDomLink.setAttribute('class', 'MAT_MediaImage');
                mediaDomLink.setAttribute('href', mediaData.mediaLink);
                mediaDomLink.setAttribute('tabindex', MatchingApp.ti);
                //MatchingApp.ti++;
                mediaDomLink.setAttribute('target', '_blank');
            }
            mediaDomContent = document.createElement('img');
            if (mediaData.mediaLink === 'none' || mediaData.mediaLink === null || mediaData.mediaLink === undefined || mediaData.mediaLink === '') {
                mediaDomContent.setAttribute('class', 'MAT_MediaImage');
            }
            mediaDomContent.setAttribute('src', mediaData.src);
            if (mediaData.width !== 'none' && mediaData.width !== null && mediaData.width !== undefined && mediaData.width !== '') {
                mediaDomContent.setAttribute('width', mediaData.width);
            } else {
                // mediaDomContent.setAttribute('width', '420');
            }
            if (mediaData.height !== 'none' && mediaData.height !== null && mediaData.height !== undefined && mediaData.height !== '') {
                mediaDomContent.setAttribute('height', mediaData.height);
            } else {
                // mediaDomContent.setAttribute('height', '315');
            }
            mediaDomObj.setAttribute('style', 'text-align:center;');
            if (mediaData.description) {
                mediaDomContent.setAttribute('alt', mediaData.description);
            }
            if (mediaData.mediaLink === 'none' || mediaData.mediaLink === null || mediaData.mediaLink === undefined || mediaData.mediaLink === '') {
                mediaDomObj.appendChild(mediaDomContent);
            } else {
                mediaDomLink.appendChild(mediaDomContent);
                mediaDomObj.appendChild(mediaDomLink);
            }
            break;
        case 'YouTubeVideo':
            validSrc = MatchingApp.validateYouTubeLink(mediaData.src);
            if (validSrc) {
                mediaDomContent = document.createElement('iframe');
                mediaDomContent.setAttribute('class', 'MAT_MediaEmbeddedVideo');
                if (mediaData.width !== 'none' && mediaData.width !== null && mediaData.width !== undefined && mediaData.width !== '') {
                    mediaDomContent.setAttribute('width', mediaData.width);
                } else {
                    mediaDomContent.setAttribute('width', '420');
                }
                if (mediaData.height !== 'none' && mediaData.height !== null && mediaData.height !== undefined && mediaData.height !== '') {
                    mediaDomContent.setAttribute('height', mediaData.height);
                } else {
                    mediaDomContent.setAttribute('height', '315');
                }
                mediaDomContent.setAttribute('frameborder', '0');
                mediaDomContent.setAttribute('allowfullscreen', 'true');
                mediaDomContent.setAttribute('src', validSrc);
                mediaDomObj.setAttribute('style', 'text-align:center;');
                if (mediaData.description) {
                    mediaDomContent.setAttribute('alt', mediaData.description);
                }
                mediaDomObj.appendChild(mediaDomContent);
                if (mediaData.altLink && mediaData.altLink !== 'none') {
                    mediaDomLink = document.createElement('a');
                    mediaDomLink.setAttribute('class', 'MAT_MediaAltLink');
                    mediaDomLink.setAttribute('href', mediaData.altLink);
                    mediaDomLink.setAttribute('tabindex', MatchingApp.ti);
                    //MatchingApp.ti++;
                    mediaDomLink.setAttribute('target', '_blank');
                    mediaDomLink.innerHTML = 'Alternate Link.';
                    mediaDomObj.appendChild(mediaDomLink);
                }
            }
            break;
        case 'text':
            mediaDomContent = document.createElement('p');
            mediaDomContent.setAttribute('class', 'MAT_MediaText');
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.innerHTML = mediaData.content;
            mediaDomObj.appendChild(mediaDomContent);
            break;
        case 'kaltura':
            mediaDomContent = document.createElement('p');
            mediaDomContent.setAttribute('class', 'MAT_MediaText');
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.innerHTML = mediaData.content;
            mediaDomObj.appendChild(mediaDomContent);
            break;
        default:
            break;
    }
    $(mediaDomObj).hide().appendTo(containerRef).fadeIn(500);
    // containerRef.appendChild(mediaDomObj);
};
/**
 * Takes a string and checks if it's a valid YouTube link.
 *
 * @method validateYouTubeLink
 * @param {String} src
 * @return {Boolean|String} Functioning YouTube link or False
 */
MatchingApp.validateYouTubeLink = function (src) {
    if (src.indexOf('www.youtube.com') !== -1) {
        if (src.indexOf('</iframe>') === -1) {
            if (src.indexOf('watch?v=') !== -1) {
                code = src.slice(src.indexOf('?v=') + 3);
                return 'https://www.youtube.com/embed/' + code;
            } else {
                return false;
            }
        } else {
            // They grabbed the embed code probably
            if (src.indexOf('https://www.youtube.com/embed/') !== -1) {
                return src.slice(src.indexOf('src') + 5, src.indexOf('"', src.indexOf('src') + 5));
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
};
/**
 * Increased the sessior timer.
 *
 * @method timer
 */
MatchingApp.timer = function () {
    MatchingApp.sessionTimer++;
};
/**
 * Sets the height of the question container to prevent collapsing.
 *
 * @method setHeight
 */
MatchingApp.setHeight = function () {
    if (MatchingApp.heightSet === false && MatchingApp.mobileDevice === true) {
        var minHeight = $('#qColum_1').height();
        $('#MAT_qColContainer').css('min-height', minHeight + 20 + 'px');
        MatchingApp.heightSet = true;
    }
};
/**
 * A custom function that gets called on activity completion.
 *
 * @method onComplete
 * @return
 */
MatchingApp.onComplete = function () {
    MatchingApp.currentAttempts++;

    if (MatchingApp.SCORMConnected) {
        var oldScore = pipwerks.SCORM.data.get('cmi.score.raw');
        var intOldScore = parseInt(oldScore);
        if ((oldScore !== '' && MatchingApp.score > intOldScore) || intOldScore === 0) {
            pipwerks.SCORM.data.set('cmi.score.raw', MatchingApp.score);
            pipwerks.SCORM.data.set('cmi.completion_status', 'completed');
            pipwerks.SCORM.data.set('cmi.success_status', 'passed');
            pipwerks.SCORM.data.save();
        }
    }
    MatchingApp.disableDragging = true;
};

/**
 * Maps legacy parameters to the new Advanced parameter.
 *
 * @method parseData
 */
MatchingApp.parseData = function () {
    if (!MatchingApp.AppData.Advanced) {
        MatchingApp.AppData.Advanced = {};

        MatchingApp.AppData.Advanced.HeadingLevel = MatchingApp.AppData.HeadingLevel;
        MatchingApp.AppData.Advanced.QuestionColumns = MatchingApp.AppData.QuestionColumns;
        MatchingApp.AppData.Advanced.HighlightEffect = MatchingApp.AppData.HighlightEffect;
        MatchingApp.AppData.Advanced.HorizontalAlignment = MatchingApp.AppData.HorizontalAlignment;
    }

    MatchingApp.AppData.Advanced.HeadingLevel = parseInt(MatchingApp.AppData.Advanced.HeadingLevel);
};

/**
 * Fallback text for pages that need to display before content exists.
 *
 * @method d2log
 * @param {string} m
 * @return {} Console logs m
 */
MatchingApp.editorFallback = function () {
    if (window.startLocation !== undefined) {
        if (window.startLocation === 0 || window.startLocation === 1) {
            if (
                MatchingApp.AppData.PreActivityText === 'none' ||
                MatchingApp.AppData.PreActivityText === null ||
                MatchingApp.AppData.PreActivityText === undefined ||
                MatchingApp.AppData.PreActivityText === ''
            ) {
                if (window.startLocation === 0) {
                    $(MAT_appContainer).empty();
                    MAT_preQuizText = document.createElement('p');
                    MAT_preQuizText.id = 'MAT_preQuizText';
                    $(MAT_preQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
                    MAT_preQuizText.innerHTML = 'Please begin building your activity.';
                } else {
                    if (
                        MatchingApp.AppData.PreActivityMedia === 'none' ||
                        MatchingApp.AppData.PreActivityMedia === null ||
                        MatchingApp.AppData.PreActivityMedia === undefined ||
                        MatchingApp.AppData.PreActivityMedia === ''
                    ) {
                        $('#MAT_buttonSet').remove();
                        MAT_preQuizText = document.createElement('p');
                        MAT_preQuizText.id = 'MAT_preQuizText';
                        $(MAT_preQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
                        MAT_preQuizText.innerHTML = 'No Pre-Activity content has been added.';
                    }
                }
            }
        }

        if (window.startLocation === 3) {
            if (
                MatchingApp.AppData.PostActivityText === 'none' ||
                MatchingApp.AppData.PostActivityText === null ||
                MatchingApp.AppData.PostActivityText === undefined ||
                MatchingApp.AppData.PostActivityText === ''
            ) {
                if (
                    MatchingApp.AppData.PostActivityMedia === 'none' ||
                    MatchingApp.AppData.PostActivityMedia === null ||
                    MatchingApp.AppData.PostActivityMedia === undefined ||
                    MatchingApp.AppData.PostActivityMedia === ''
                ) {
                    MAT_postQuizText.innerHTML = 'No Post-Activity content has been added.';
                    $(MAT_postQuizText).hide().appendTo(MAT_appContainer).fadeIn(500);
                } else {
                    $(MAT_postQuizText).remove();
                }
            }
        }

        $('#MAT_buttonSet').empty();
    }
};

MatchingApp.establishScorm = function () {
    console.log('Getting SCORM API...');
    $.getScript('../../../facilitator_tools/Matching/thirdpartylib/SCORM_API_wrapper.js')
        .done(function () {
            console.log('SCORM API successfully loaded.');
            MatchingApp.SCORMConnectionInterval = setInterval(MatchingApp.connectionAttempt, 100);
        })
        .fail(function () {
            console.log('Unable to load SCORM API.');
            MatchingApp.SCORMEnabled = false;
            MatchingApp.startActivity();
        });
};

MatchingApp.connectionAttempt = function () {
    MatchingApp.SCORMConnectionAttempts++;

    if (!pipwerks.SCORM.connection.initialize()) {
        if (MatchingApp.SCORMConnectionAttempts > 9) {
            console.log('SCORM connection attempted ' + MatchingApp.SCORMConnectionAttempts + ' times. Aborting.');
            MatchingApp.SCORMConnected = false;
            MatchingApp.SCORMEnabled = false;

            MatchingApp.startActivity();

            clearInterval(MatchingApp.SCORMConnectionInterval);
        }
    } else {
        clearInterval(MatchingApp.SCORMConnectionInterval);
        console.log('SCORM connection made.');

        $.getScript('../../../facilitator_tools/Matching/thirdpartylib/SCORM_interactions.js')
            .done(function () {
                console.log('SCORM Interaction API successfully loaded.');
                MatchingApp.SCORMSession = new SCORMSession(MatchingApp.AppData.ActivityID);
                MatchingApp.SCORMInteraction = new SCORMInteraction(MatchingApp.SCORMSession);
                MatchingApp.sendButtonEvent('Started activity.');

                MatchingApp.startActivity();
            })
            .fail(function () {
                console.log('Unable to load SCORM Interaction API.');
                MatchingApp.SCORMEnabled = false;
                MatchingApp.startActivity();
            });

        pipwerks.SCORM.data.set('cmi.score.min', 0);

        var maxScore = 0;

        for (j = 0; j < MatchingApp.AnsSlotData.length; j++) {
            for (k = 0; k < MatchingApp.questionData.length; k++) {
                if (MatchingApp.questionData[k].answer === MatchingApp.AnsSlotData[j].key) {
                    maxScore++;
                }
            }
        }

        pipwerks.SCORM.data.set('cmi.score.max', maxScore);
        MatchingApp.SCORMConnected = true;

        $(window).bind('beforeunload', function () {
            pipwerks.SCORM.connection.terminate();
        });
    }
};

MatchingApp.sendDropEvent = function (target, parent) {
    var response = '';
    var result = 'incorrect';
    var qid = parseInt(target.id.substr(4));
    var aid = parseInt(parent.id.substr(10));

    if (MatchingApp.qMatch[qid] === MatchingApp.aMatch[aid]) {
        result = 'correct';
    }

    response = target.innerText + ' -> ' + parent.firstChild.firstChild.innerText;

    MatchingApp.SCORMInteraction.post(response, result);
    MatchingApp.SCORMInteraction = new SCORMInteraction(MatchingApp.SCORMSession);
};

MatchingApp.sendButtonEvent = function (response) {
    var result = 'neutral';

    MatchingApp.SCORMInteraction.post(response, result);
    MatchingApp.SCORMInteraction = new SCORMInteraction(MatchingApp.SCORMSession);
};
/**
 * Go To Top of Inline Quiz Container
 *
 * @method GoToTop
 */
MatchingApp.GoToTop = function () {
    console.log('go to top disabled');
    
   var scrollTargetID = MatchingApp.containerID;
   var scrollTarget = document.getElementById(scrollTargetID);
   var TargetID = '#'+ scrollTargetID;
   var scrollToTop = scrollTarget.scrollIntoView();

    if (window.top.location.href.indexOf('viewContent') > -1) {
    $('html, body', window.parent.document).scrollTop($(TargetID).offset().top + $('#ContentView', window.parent.document).offset().top);
 }
 else {
    scrollToTop;
 }
   
};
/**
 * Generic D2L logging method. Used to try and prevent large amounts of console logging in production.
 *
 * @method d2log
 * @param {string} m
 * @return {} Console logs m
 */
function d2log(m) {
    if (typeof D2LDEBUG !== 'undefined') {
        if (D2LDEBUG) {
            console.log(m);
        }
    }
}

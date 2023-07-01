/* eslint-disable */
/**
 * Contains all of the functionality for Tap Matching Vanilla.
 *
 * @class TapMatchingApp
 */
var TapMatchingApp = {
    mobileDevice: false,
    ActivityType: null,
    AppData: null,
    currentAttempts: 0,
    sessionTimer: 0,
    timerInterval: null,
    ti: 1,
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
    tappedItems: [],
    curQuestion: 0
};

var D2LDEBUG = true;
var TAP_appContainer, TAP_buttonIcon, TAP_postQuizText;
var slotBackground;
var temp, tempPar, tempComp, ans, ansId, data, code, questionFile, idNum, tempArr, ti, validSrc;
var c, i, j, k;

/**
 * Resets specified properties to their default values.
 *
 * @method resetQuizData
 */
TapMatchingApp.resetQuizData = function () {
    TapMatchingApp.sessionTimer = 0;
    TapMatchingApp.alreadySelected = false;
    TapMatchingApp.heightSet = false;
    TapMatchingApp.finishedQuiz = false;
    TapMatchingApp.allAnswered = false;
    TapMatchingApp.interval = null;
    TapMatchingApp.origPos = [];
    TapMatchingApp.aMatch = [];
    TapMatchingApp.qMatch = [];
    TapMatchingApp.matchAmount = [];
    TapMatchingApp.selectedElements = [];
    TapMatchingApp.scoreEval = [];
    TapMatchingApp.savedElements = [];
    TapMatchingApp.savedAnswers = [];
    TapMatchingApp.savedCorrectAnswers = [];
};

/**
 * Establishes the JSON text file path, the id of the container that houses the activity, and makes a call to get the activity data.
 *
 * @method setupApp
 * @param {String} file
 * @param {String} location
 */
TapMatchingApp.setupApp = function (file, location) {
    questionFile = file;

    if (document.getElementById(location) !== null) {
        TapMatchingApp.containerRef = document.getElementById(location);
        TapMatchingApp.getAppData(TapMatchingApp.buildApp);
    } else {
        d2log('ERROR: Missing specified DOM object in TapMatchingApp.setupApp().');
    }
};

/**
 * Retrieves the activity data from the JSON text file, passes that data to build the activity.
 *
 * @method getAppData
 * @param {Method} callback
 */
TapMatchingApp.getAppData = function (callback) {
    var jqxhr = $.getJSON(questionFile, function (data) {
        TapMatchingApp.AppData = data;
        callback(TapMatchingApp.AppData);
    });

    // If the json data fails inform the users ang give some data to developers using the debug console.
    jqxhr.fail(function (e) {
        d2log(
            'ERROR: Failed to load data from specified file. Ensure that the file path is correct' +
                ' and that JSON the JSON data is valid. (Use a validator like: http://jsonformatter.curiousconcept.com/ )'
        );
        d2log(e);
    });
};

/**
 * Checks if the activity is being accessed on a mobile device, sets up other necessary things for the entire activity.
 *
 * @method buildApp
 */
TapMatchingApp.buildApp = function () {
    /*if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      TapMatchingApp.mobileDevice = true;
   }*/
    TapMatchingApp.questionData = TapMatchingApp.AppData.Questions;
    TapMatchingApp.Options = TapMatchingApp.AppData.Options;
    TapMatchingApp.Groups = TapMatchingApp.AppData.Groups;
    TapMatchingApp.ActivityType = TapMatchingApp.AppData.ActivityType;

    for (var i = 0; i < TapMatchingApp.Groups.length; i++) {
        TapMatchingApp.Groups[i].options = [];
        for (var j = 0; j < TapMatchingApp.Options.length; j++) {
            if (TapMatchingApp.Options[j].group == TapMatchingApp.Groups[i].key) {
                TapMatchingApp.Groups[i].options.push(TapMatchingApp.Options[j]);
            }
        }
    }

    if (
        TapMatchingApp.AppData.DefaultColor === null ||
        TapMatchingApp.AppData.DefaultColor === undefined ||
        TapMatchingApp.AppData.DefaultColor === '' ||
        TapMatchingApp.AppData.DefaultColor === 'none'
    ) {
        TapMatchingApp.AppData.DefaultColor = '#FFFFFF';
    }
    if (
        TapMatchingApp.AppData.DefaultSelectColor === null ||
        TapMatchingApp.AppData.DefaultSelectColor === undefined ||
        TapMatchingApp.AppData.DefaultSelectColor === '' ||
        TapMatchingApp.AppData.DefaultSelectColor === 'none'
    ) {
        TapMatchingApp.AppData.DefaultSelectColor = '#B7E5E5';
    }
    if (
        TapMatchingApp.AppData.DefaultHighlightColor === null ||
        TapMatchingApp.AppData.DefaultHighlightColor === undefined ||
        TapMatchingApp.AppData.DefaultHighlightColor === '' ||
        TapMatchingApp.AppData.DefaultHighlightColor === 'none'
    ) {
        TapMatchingApp.AppData.DefaultHighlightColor = '#C6C8CA';
    }

    TapMatchingApp.AppData.DefaultColor = '#FFFFFF';

    //FORCED TRUE
    TapMatchingApp.hLightingEffect = true;

    TapMatchingApp.headingLevel = parseInt(TapMatchingApp.AppData.HeadingLevel);
    if (
        TapMatchingApp.headingLevel === null ||
        TapMatchingApp.headingLevel === undefined ||
        TapMatchingApp.headingLevel === 'none' ||
        isNaN(TapMatchingApp.headingLevel) ||
        TapMatchingApp.headingLevel === ''
    ) {
        TapMatchingApp.headingLevel = 1;
    } else if (TapMatchingApp.headingLevel > 3) {
        TapMatchingApp.headingLevel = 3;
    }

    TapMatchingApp.buildAppFrame();
    TapMatchingApp.loadButtons();

    if (
        TapMatchingApp.AppData.PreActivityText === 'none' ||
        TapMatchingApp.AppData.PreActivityText === null ||
        TapMatchingApp.AppData.PreActivityText === undefined ||
        TapMatchingApp.AppData.PreActivityText === ''
    ) {
        if (
            TapMatchingApp.AppData.PreActivityMedia === 'none' ||
            TapMatchingApp.AppData.PreActivityMedia === null ||
            TapMatchingApp.AppData.PreActivityMedia === undefined ||
            TapMatchingApp.AppData.PreActivityMedia === ''
        ) {
            TapMatchingApp.buildActivity();
        } else {
            TapMatchingApp.buildPreQuiz();
        }
    } else {
        TapMatchingApp.buildPreQuiz();
    }

    if (
        TapMatchingApp.AppData.PostActivityText !== 'none' &&
        TapMatchingApp.AppData.PostActivityText !== null &&
        TapMatchingApp.AppData.PostActivityText !== undefined &&
        TapMatchingApp.AppData.PostActivityText !== ''
    ) {
        if (
            TapMatchingApp.AppData.PostActivityMedia !== 'none' &&
            TapMatchingApp.AppData.PostActivityMedia !== null &&
            TapMatchingApp.AppData.PostActivityMedia !== undefined &&
            TapMatchingApp.AppData.PostActivityMedia !== ''
        ) {
            if (TapMatchingApp.IncludePostPage !== true) {
                TapMatchingApp.IncludePostPage = false;
            }
        }
    }

    $(TapMatchingApp.containerRef).addClass('rs_preserve');

    try {
        PNotify.removeAll();
    } catch (err) {
        TapMatchingApp.notifications = false;
    }
};

/**
 * Allows for dragging in Internet Explorer.
 *
 * @method autoSelect
 * @param {Object} selectTarget
 */
TapMatchingApp.autoSelect = function (selectTarget) {
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
TapMatchingApp.buildAppFrame = function () {
    var TAP_container = document.createElement('section');
    TAP_container.id = 'TAP_container';

    var TAP_content = document.createElement('section');
    TAP_content.id = 'TAP_content';

    if (TapMatchingApp.AppData.ActivityName !== 'none') {
        var TAP_header = document.createElement('section');
        $(TAP_header).addClass('banner-text');
        TAP_header.innerHTML = '<h' + TapMatchingApp.headingLevel + '>' + TapMatchingApp.AppData.ActivityName + '</h' + TapMatchingApp.headingLevel + '>';
    } else {
        Tap_header = false;
    }

    TAP_container.appendChild(TAP_content);
    $(TAP_container).appendTo(TapMatchingApp.containerRef);

    $('<div/>', {
        id: 'AccMessageDisp',
        class: 'AccMessage',
        text: 'Stuff'
    }).appendTo('body');

    TAP_appContainer = document.createElement('div');
    TAP_appContainer.id = 'TAP_appContainer';
    TAP_appContainer.setAttribute('role', 'main');

    //$(TAP_header).hide().appendTo(TAP_content).slideDown(500, 'swing');
    $(TAP_header).appendTo(TAP_content);
    TAP_content.appendChild(TAP_appContainer);
};

/**
 * Sets up all the parameters for each button and stores them in an object.
 *
 * @method loadButtons
 */
TapMatchingApp.loadButtons = function () {
    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');

    var TAP_checkButton = document.createElement('button');
    TAP_checkButton.id = 'TAP_checkButton';
    TAP_checkButton.setAttribute('class', 'TAP_button');
    TAP_checkButton.setAttribute('title', 'Checks the Answers');

    TAP_checkButton.onclick = function () {
        TapMatchingApp.checkAnswers();
    };

    var TAP_checkLabel = document.createElement('span');
    TAP_checkLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_checkLabel.innerHTML = 'Check Answers';
    //TAP_checkButton.appendChild(TAP_buttonIcon);
    TAP_checkButton.appendChild(TAP_checkLabel);

    TapMatchingApp.checkAnswersButton = TAP_checkButton;

    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');

    var TAP_resetWrongButton = document.createElement('button');
    TAP_resetWrongButton.id = 'TAP_resetWrongButton';
    TAP_resetWrongButton.setAttribute('class', 'TAP_button');
    TAP_resetWrongButton.setAttribute('title', 'Resets the Wrong Draggable Items');

    TAP_resetWrongButton.onclick = function () {
        TapMatchingApp.resetWrong();
    };

    var TAP_resetWrongLabel = document.createElement('span');
    TAP_resetWrongLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_resetWrongLabel.innerHTML = 'Reset Wrong';
    //TAP_resetWrongButton.appendChild(TAP_buttonIcon);
    TAP_resetWrongButton.appendChild(TAP_resetWrongLabel);
    TAP_resetWrongButton.disabled = true;

    TapMatchingApp.resetWrongButton = TAP_resetWrongButton;

    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');

    var TAP_resetButton = document.createElement('button');
    TAP_resetButton.id = 'TAP_resetButton';
    TAP_resetButton.setAttribute('class', 'TAP_button');
    TAP_resetButton.setAttribute('title', 'Resets All the Draggable Items');

    TAP_resetButton.onclick = function () {
        TapMatchingApp.reset();
    };

    var TAP_resetLabel = document.createElement('span');
    TAP_resetLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_resetLabel.innerHTML = 'Reset All';
    //TAP_resetButton.appendChild(TAP_buttonIcon);
    TAP_resetButton.appendChild(TAP_resetLabel);

    TapMatchingApp.resetButton = TAP_resetButton;

    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');

    var TAP_restartButton = document.createElement('button');
    TAP_restartButton.id = 'TAP_restartButton';
    TAP_restartButton.setAttribute('class', 'TAP_button');
    TAP_restartButton.setAttribute('title', 'Restarts the Activity');

    TAP_restartButton.onclick = function () {
        TapMatchingApp.clearStage();
        TapMatchingApp.resetQuizData();

        if (
            TapMatchingApp.AppData.PreActivityText === 'none' ||
            TapMatchingApp.AppData.PreActivityText === null ||
            TapMatchingApp.AppData.PreActivityText === undefined ||
            TapMatchingApp.AppData.PreActivityText === ''
        ) {
            if (
                TapMatchingApp.AppData.PreActivityMedia === 'none' ||
                TapMatchingApp.AppData.PreActivityMedia === null ||
                TapMatchingApp.AppData.PreActivityMedia === undefined ||
                TapMatchingApp.AppData.PreActivityMedia === ''
            ) {
                TapMatchingApp.buildActivity();
            } else {
                TapMatchingApp.buildPreQuiz();
            }
        } else {
            TapMatchingApp.buildPreQuiz();
        }
    };

    var TAP_restartLabel = document.createElement('span');
    TAP_restartLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_restartLabel.innerHTML = 'Reset Activity';
    //TAP_restartButton.appendChild(TAP_buttonIcon);
    TAP_restartButton.appendChild(TAP_restartLabel);

    TapMatchingApp.restartButton = TAP_restartButton;

    var TAP_continueButton = document.createElement('button');
    TAP_continueButton.id = 'TAP_continueButton';
    TAP_continueButton.setAttribute('class', 'TAP_button');

    TAP_continueButton.onclick = function () {
        TapMatchingApp.clearStage();
        TapMatchingApp.buildActivity();
        TapMatchingApp.timerInterval = setInterval(TapMatchingApp.timer, 1000);
    };

    var TAP_continueLabel = document.createElement('span');
    TAP_continueLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_continueButton.setAttribute('title', 'Starts the Activity');
    TAP_continueLabel.innerHTML = 'Start Now';
    TAP_continueButton.appendChild(TAP_continueLabel);

    TapMatchingApp.continueButton = TAP_continueButton;

    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');

    var TAP_postQuizButton = document.createElement('button');
    TAP_postQuizButton.id = 'TAP_postQuizButton';
    TAP_postQuizButton.setAttribute('class', 'TAP_button');
    TAP_postQuizButton.setAttribute('title', 'Finishes the Activity');

    TAP_postQuizButton.onclick = function () {
        TapMatchingApp.clearStage();
        TapMatchingApp.buildPostQuiz();
    };

    var TAP_postQuizLabel = document.createElement('span');
    TAP_postQuizLabel.setAttribute('class', 'TAP_buttonLabel');
    TAP_postQuizLabel.innerHTML = 'Move On';
    //TAP_postQuizButton.appendChild(TAP_buttonIcon);
    TAP_postQuizButton.appendChild(TAP_postQuizLabel);

    TapMatchingApp.postQuizButton = TAP_postQuizButton;

    TAP_buttonIcon = document.createElement('div');
    TAP_buttonIcon.setAttribute('class', 'TAP_buttonIcon');
    TAP_buttonIcon.setAttribute('style', 'margin:0px auto;');

    // var TAP_instructionButton = document.createElement('button');
    // TAP_instructionButton.id = 'TAP_instructionButton';
    // TAP_instructionButton.setAttribute('class', 'TAP_button');
    // TAP_instructionButton.setAttribute('title', 'Toggles the Instructions');

    // TAP_instructionButton.onclick = function() {
    //     TapMatchingApp.toggleInstructions();
    // };
    // //TAP_instructionButton.appendChild(TAP_buttonIcon);

    // TapMatchingApp.instructionButton = TAP_instructionButton;
};

/**
 * Builds the pre activity inside of the app container.
 *
 * @method buildPreQuiz
 */
TapMatchingApp.buildPreQuiz = function () {
    TapMatchingApp.ti = 1;

    if (
        TapMatchingApp.AppData.PreActivityText !== 'none' &&
        TapMatchingApp.AppData.PreActivityText !== null &&
        TapMatchingApp.AppData.PreActivityText !== undefined &&
        TapMatchingApp.AppData.PreActivityText !== ''
    ) {
        var TAP_preQuizText = document.createElement('p');
        TAP_preQuizText.id = 'TAP_preQuizText';
        TAP_preQuizText.innerHTML = TapMatchingApp.AppData.PreActivityText;

        $(TAP_preQuizText).hide().appendTo(TAP_appContainer).fadeIn(500);
        // TAP_appContainer.appendChild(TAP_preQuizText);
    }

    if (
        TapMatchingApp.AppData.PreActivityMedia !== 'none' &&
        TapMatchingApp.AppData.PreActivityMedia !== null &&
        TapMatchingApp.AppData.PreActivityMedia !== undefined &&
        TapMatchingApp.AppData.PreActivityMedia !== ''
    ) {
        for (i = 0; i < TapMatchingApp.AppData.PreActivityMedia.length; i++) {
            TapMatchingApp.EmbedMedia(TAP_appContainer, TapMatchingApp.AppData.PreActivityMedia[i]);
        }
    }

    TapMatchingApp.buildPreQuizButtons();

    if ($('.d2l-page-title', window.parent.document).length > 0) {
        $('body', window.parent.document).animate(
            {
                scrollTop: $('.d2l-page-title', window.parent.document).offset().top
            },
            1000
        );
    }
};

/**
 * Adds the button(s) for the pre activity into the app container.
 *
 * @method buildPreQuizButtons
 */
TapMatchingApp.buildPreQuizButtons = function () {
    var TAP_buttonSet = document.createElement('div');
    TAP_buttonSet.id = 'TAP_buttonSet';

    $(TAP_buttonSet).hide().appendTo(TAP_appContainer).fadeIn(500);
    //TAP_appContainer.appendChild(TAP_buttonSet);

    TAP_buttonSet.appendChild(TapMatchingApp.continueButton);
    TapMatchingApp.continueButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;
};

/**
 * Builds the post activity inside of the app container.
 *
 * @method buildPostQuiz
 */
TapMatchingApp.buildPostQuiz = function () {
    TapMatchingApp.ti = 1;

    if (
        TapMatchingApp.AppData.PostActivityText !== 'none' &&
        TapMatchingApp.AppData.PostActivityText !== null &&
        TapMatchingApp.AppData.PostActivityText !== undefined &&
        TapMatchingApp.AppData.PostActivityText !== ''
    ) {
        TAP_postQuizText = document.createElement('p');
        TAP_postQuizText.id = 'TAP_postQuizText';
        TAP_postQuizText.innerHTML = TapMatchingApp.AppData.PostActivityText;
        $(TAP_postQuizText).hide().appendTo(TAP_appContainer).fadeIn(500);
        //TAP_appContainer.appendChild(TAP_postQuizText);
    } else {
        TAP_postQuizText = document.createElement('p');
        TAP_postQuizText.id = 'HS_postActivityText';
        TAP_postQuizText.innerHTML = 'You have completed the activity!';
        $(TAP_postQuizText).hide().appendTo(TAP_appContainer).fadeIn(500);
        //TAP_appContainer.appendChild(TAP_postQuizText);
    }

    if (
        TapMatchingApp.AppData.PostActivityMedia !== 'none' &&
        TapMatchingApp.AppData.PostActivityMedia !== null &&
        TapMatchingApp.AppData.PostActivityMedia !== undefined &&
        TapMatchingApp.AppData.PostActivityMedia !== ''
    ) {
        for (i = 0; i < TapMatchingApp.AppData.PostActivityMedia.length; i++) {
            TapMatchingApp.EmbedMedia(TAP_appContainer, TapMatchingApp.AppData.PostActivityMedia[i]);
        }
    }

    TapMatchingApp.buildPostQuizButtons();

    if ($('.d2l-page-title', window.parent.document).length > 0) {
        $('body', window.parent.document).animate(
            {
                scrollTop: $('.d2l-page-title', window.parent.document).offset().top
            },
            1000
        );
    }
};

/**
 * Adds the button(s) for the post activity into the app container.
 *
 * @method buildPostQuizButtons
 */
TapMatchingApp.buildPostQuizButtons = function () {
    var TAP_buttonSet = document.createElement('div');
    TAP_buttonSet.id = 'TAP_buttonSet';
    TAP_appContainer.appendChild(TAP_buttonSet);

    TAP_buttonSet.appendChild(TapMatchingApp.restartButton);
    TapMatchingApp.restartButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;
};

/**
 * Builds the activity and adds it to the app container.
 *
 * @method buildActivity
 */
TapMatchingApp.buildActivity = function () {
    TapMatchingApp.ti = 1;

    for (i = 0; i < TapMatchingApp.Options.length; i++) {
        TapMatchingApp.origPos.push(null);

        temp = TapMatchingApp.Options[i].text;
        TapMatchingApp.qMatch.push(temp);
    }

    for (j = 0; j < TapMatchingApp.Groups.length; j++) {
        temp = TapMatchingApp.Groups[j].key;
        TapMatchingApp.aMatch.push(temp);

        // if (TapMatchingApp.ActivityType === 'sort') {
        var matches = 0;

        for (k = 0; k < TapMatchingApp.Options.length; k++) {
            if (TapMatchingApp.Options[k].group === TapMatchingApp.Groups[j].key) {
                matches++;
            }
        }

        TapMatchingApp.matchAmount.push(matches);
        // }
    }

    TapMatchingApp.buildInstructions();
    TapMatchingApp.buildTiles();
    TapMatchingApp.buildActivityButtons();
    TapMatchingApp.initAccMAT();

    if (TapMatchingApp.AppData.FeedbackType === 'report') {
        // TapMatchingApp.interval = setInterval(TapMatchingApp.checkAllAnswered, 100); Moved to drop event
        document.getElementById('TAP_checkButton').disabled = true;
        $('#TAP_checkButton').hide();
    }

    $('#TAP_instructions').attr('tabindex', TapMatchingApp.ti);

    $('[tabindex=1]').focus();
};

/**
 * Adds the button(s) for the current activity into the app container.
 *
 * @method buildActivityButtons
 */
TapMatchingApp.buildActivityButtons = function () {
    var TAP_buttonSet = document.createElement('div');
    TAP_buttonSet.id = 'TAP_buttonSet';
    $(TAP_buttonSet).hide().appendTo(TAP_appContainer).fadeIn(500);
    // TAP_appContainer.appendChild(TAP_buttonSet);

    //TAP_buttonSet.appendChild(TapMatchingApp.checkAnswersButton);

    // TapMatchingApp.instructionButton.setAttribute('tabindex', TapMatchingApp.ti);
    // TapMatchingApp.ti++;
    TapMatchingApp.checkAnswersButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;

    if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
        TAP_buttonSet.appendChild(TapMatchingApp.resetWrongButton);
        $('#TAP_resetWrongButton').hide();
        TapMatchingApp.resetWrongButton.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    } else {
        TAP_buttonSet.appendChild(TapMatchingApp.resetButton);
        TapMatchingApp.resetButton.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    }
};

/**
 * Builds the report and adds it to the app container.
 *
 * @method buildReport
 */
TapMatchingApp.buildReport = function () {
    TapMatchingApp.ti = 1;

    TapMatchingApp.findCorrectAnswers();

    var correct =
        '<img class="correct" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Njk0QjdFOTZFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Njk0QjdFOTdFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5NEVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2OTRCN0U5NUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqYsgfwAAAFBSURBVHjaYvz//z8DLQETw5ADW/w7wBgKGKluOANDOZTXyeCzsYKRioY3AMl6NNEGZioZXgEkm7HIPGOkkuHtWGSWAXEcI4WGZwLJaVhkNgNxCDAOfjHS0nDyU9EW/0QgOQ+LzG4g9oEZTp4FW/yjgeQiLJl0P9Twb8iCjGgagUo2LqWW4QgLtvj7Ack1UDFQ+G3CYjhMDSuazCkgdgPq+YjNTYxYNP7GsIRMw2GFXS2aRlawYVv83aCGu+Ew/BIhw2E+EAXS+4BYB03uOxA3AXEdEHOiyV0BYieg4a8JpQlYHOCyBBsg2nD0VCQDJA8AsTIe9XeB2B5o+FPSKxyfjU+ApAPUEFyGO5BiOPaMBvHJCSCWRhIFWW4JdQSFVSbCJzCXgmhHcgzHXSf7bLwDteQkNFjukFsmMg75VgVAgAEAWmBzHcug4yIAAAAASUVORK5CYII=" alt="right check mark" disabled/>';
    var wrong =
        '<img class="wrong" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6REI5RDZEMUJFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6REI5RDZEMUNFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpEQjlENkQxOUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEQjlENkQxQUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pr+MFuwAAADiSURBVHjaxJY9DsIwDIXtHoCJkY1DdO2AWHuPHqj36IoYujJwBDZGJk7AM3KWoEa2JQtLr6na5Hup81cijRedeugOHSgY0lYZfXnGBY7iAu2gBzTs6fr0wlGs0BF6Q2cwblzBS7hMKniJr0mHy1zBSSuulnRtwEmZsxiM2mPymjTgJQsjGyv+pMvahr0NvHXZ2yu9N38tB/JKnlRyYPDICt80cJo01wwH57h5QXaUHP9JUeogp07T1IWWulWkbnYRuMdE1sESgUvou6FxnixiMOnx5oIbTIQ5pR/6lP3b8hFgAJ82ro/bie6BAAAAAElFTkSuQmCC" alt="wrong x" disabled/>';
    var score = TapMatchingApp.calculateScore();

    var TAP_report = document.createElement('div');
    TAP_report.id = 'TAP_report';

    var resultsHeader = document.createElement('h' + (TapMatchingApp.headingLevel + 1));
    resultsHeader.setAttribute('class', 'TAP_resultsHeader');
    resultsHeader.innerHTML = 'Results:';
    TAP_report.appendChild(resultsHeader);

    var scoreHeader = document.createElement('h' + (TapMatchingApp.headingLevel + 2));
    scoreHeader.setAttribute('class', 'TAP_scoreHeader');
    var total = 0;
    for (var i = 0; i < TapMatchingApp.matchAmount.length; i++) {
        total += TapMatchingApp.matchAmount[i];
    }
    scoreHeader.innerHTML = 'You scored ' + score + '/' + total + '!';
    TAP_report.appendChild(scoreHeader);

    for (i = 0; i < TapMatchingApp.AnsSlotData.length; i++) {
        if (TapMatchingApp.matchAmount[i] > 0) {
            var tempMiniReport = document.createElement('div');
            tempMiniReport.setAttribute('class', 'TAP_miniReport');

            var tempHeader = document.createElement('h' + (TapMatchingApp.headingLevel + 3));
            tempHeader.setAttribute('class', 'TAP_dropzoneHeader');
            tempHeader.innerHTML = TapMatchingApp.AnsSlotData[i].title;
            tempMiniReport.appendChild(tempHeader);
            TAP_report.appendChild(tempMiniReport);

            var tempMiniReportContent = document.createElement('ul');
            tempMiniReportContent.setAttribute('class', 'TAP_miniReportContent');

            tempMiniReport.appendChild(tempMiniReportContent);

            for (j = 0; j < TapMatchingApp.savedElements.length; j++) {
                if (TapMatchingApp.AnsSlotData[i].key === TapMatchingApp.savedAnswers[j]) {
                    var tempMatch = document.createElement('li');
                    var tempFeedback = document.createElement('div');
                    $(tempFeedback).addClass('bg-light TAP_feedback');

                    switch (TapMatchingApp.scoreEval[j]) {
                        case 1:
                            tempMatch.innerHTML = TapMatchingApp.savedElements[j];
                            tempMiniReportContent.appendChild(tempMatch);
                            $(tempMatch).append(correct);

                            if (
                                TapMatchingApp.questionData[j].correct !== 'none' &&
                                TapMatchingApp.questionData[j].correct !== null &&
                                TapMatchingApp.questionData[j].correct !== undefined &&
                                TapMatchingApp.questionData[j].correct !== ''
                            ) {
                                tempFeedback.innerHTML = 'Feedback: ' + TapMatchingApp.questionData[j].correct;

                                tempMiniReportContent.appendChild(tempFeedback);
                            }
                            break;

                        default:
                            tempMatch.innerHTML = TapMatchingApp.savedElements[j] + ' (Correct Answer: ' + TapMatchingApp.savedCorrectAnswers[j] + ')';

                            tempMiniReportContent.appendChild(tempMatch);
                            $(tempMatch).append(wrong);

                            if (
                                TapMatchingApp.questionData[j].wrong !== 'none' &&
                                TapMatchingApp.questionData[j].wrong !== null &&
                                TapMatchingApp.questionData[j].wrong !== undefined &&
                                TapMatchingApp.questionData[j].wrong !== ''
                            ) {
                                tempFeedback.innerHTML = 'Feedback: ' + TapMatchingApp.questionData[j].wrong;
                                tempMiniReportContent.appendChild(tempFeedback);
                            }
                            break;
                    }
                }
            }
        }
    }

    $(TAP_report).hide().appendTo(TAP_appContainer).fadeIn(500);
    $('.TAP_expand').remove();

    TapMatchingApp.buildReportButtons();

    $('TAP_header').focus();

    if ($('.d2l-page-title', window.parent.document).length > 0) {
        $('body', window.parent.document).animate(
            {
                scrollTop: $('.d2l-page-title', window.parent.document).offset().top
            },
            1000
        );
    }
};

/**
 * Adds the button(s) for the report into the app container.
 *
 * @method buildReportButtons
 */
TapMatchingApp.buildReportButtons = function () {
    var TAP_buttonSet = document.createElement('div');
    TAP_buttonSet.id = 'TAP_buttonSet';
    TAP_appContainer.appendChild(TAP_buttonSet);

    if (TapMatchingApp.AppData.IncludePostPage === true) {
        TAP_buttonSet.appendChild(TapMatchingApp.postQuizButton);
    }

    TapMatchingApp.postQuizButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;

    TAP_buttonSet.appendChild(TapMatchingApp.restartButton);
    TapMatchingApp.restartButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;
};

/**
 * Clears the app container.
 *
 * @method clearStage
 */
TapMatchingApp.clearStage = function () {
    $('#TAP_appContainer').empty();

    clearInterval(TapMatchingApp.interval);
};

/**
 * Finds the correct answer for each draggable item.
 *
 * @method findCorrectAnswers
 */
TapMatchingApp.findCorrectAnswers = function () {
    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        for (j = 0; j < TapMatchingApp.AnsSlotData.length; j++) {
            if (TapMatchingApp.questionData[i].answer === TapMatchingApp.AnsSlotData[j].key) {
                TapMatchingApp.savedCorrectAnswers.push(TapMatchingApp.AnsSlotData[j].title);
            }
        }
    }
};

/**
 * Changes whether the instructions text is visible or not.
 *
 * @method toggleInstructions
 */
TapMatchingApp.toggleInstructions = function () {
    // if ($('#TAP_iToggle').hasClass('iUp') === true) {
    //     $('#TAP_iToggle').removeClass('iUp');
    //     $('#TAP_iToggle').addClass('iDown');
    //     $('#TAP_activityText').slideDown(500);
    //     $('#TAP_iToggle').innerHTML = '&#9650;';
    // } else {
    //     $('#TAP_iToggle').removeClass('iDown');
    //     $('#TAP_iToggle').addClass('iUp');
    //     $('#TAP_activityText').slideUp(500);
    //     $('#TAP_iToggle').innerHTML = '&#9660;';
    // }
};

/**
 * Builds the designated amount of question columns and populates them with draggable items.
 *
 * @method buildQuestionCols
 */
TapMatchingApp.buildTiles = function () {
    var TAP_qColContainer = document.createElement('div');
    TAP_qColContainer.id = 'TAP_qColContainer';
    TAP_qColContainer.className = 'TAP_questions';

    /*
   if (TapMatchingApp.AppData.HorizontalAlignment === true) {
      $(TAP_qColContainer).css('width', '48%');
      $(TAP_qColContainer).css('float', 'left');
      $(TAP_qColContainer).css('display', 'block');
   }

   $(TAP_qColContainer).hide().appendTo(TAP_appContainer).fadeIn(500);

   for (c = 0; c < TapMatchingApp.qCols; c++) {
      var tempContDiv = $('<div/>', {
         id: 'qColum_' + (c + 1),
         style: 'width: ' + 100 / TapMatchingApp.qCols + '%;',
         'class': 'MI_qColum'
      });

      $('<div/>', {
         id: 'unsorted_' + (c + 1),
         class: 'TAP_qCol'
      }).appendTo(tempContDiv);

      $('#TAP_qColContainer').append(tempContDiv);
   }
   */

    var tempArr = [];

    for (i = 0; i < TapMatchingApp.Options.length; i++) {
        if (TapMatchingApp.Options[i].type === 'text') {
            if (TapMatchingApp.mobileDevice === true) {
                tempArr[i] =
                    '<div id="option' +
                    i +
                    '" onmousedown="TapMatchingApp.tapOption(event);"' +
                    ' class="textNode tile" data-feedback-order="' +
                    TapMatchingApp.Options[i].feedbackOrder +
                    '" data-group="' +
                    TapMatchingApp.Options[i].group +
                    '">' +
                    TapMatchingApp.Options[i].text +
                    '</div>';
            } else {
                tempArr[i] =
                    '<div class="tile" id="option' +
                    i +
                    '" data-group="' +
                    TapMatchingApp.Options[i].group +
                    '" aria-hidden="false" role="button"' +
                    ' data-feedback-order="' +
                    TapMatchingApp.Options[i].feedbackOrder +
                    '" onmousedown="TapMatchingApp.tapOption(this);"' +
                    ' onmouseover="TapMatchingApp.hLightEffect(this, true)"' +
                    ' onmouseout="TapMatchingApp.hLightEffect(this, false)"' +
                    ' onfocus="TapMatchingApp.hLightEffect(this, true)"' +
                    ' onblur="TapMatchingApp.hLightEffect(this, false)" tabindex="0">';

                tempArr[i] += '<div class="flex-center">';
                tempArr[i] += '<div>' + TapMatchingApp.Options[i].text + '</div>';
                if (TapMatchingApp.Options[i].image !== 'none') {
                    tempArr[i] += '<img class="center" src="' + TapMatchingApp.Options[i].image + '" />';
                }
                tempArr[i] += '</div>';
                tempArr[i] += '</div>';
            }
        }
    }

    if (TapMatchingApp.AppData.Randomize === true) {
        tempArr.sort(function () {
            return 0.5 - Math.random();
        });
    }

    var tileContainer = $('<div>').addClass('tile-container');

    for (j = 0; j < TapMatchingApp.Options.length; j++) {
        /*
      if (TapMatchingApp.curQCol > TapMatchingApp.qCols) {
       TapMatchingApp.curQCol = 1;
      }
      */

        $(tileContainer).append(tempArr[j]);

        /*
      TapMatchingApp.curQCol++;
      */
    }

    $('#TAP_appContainer').append(tileContainer);

    var TAP_correctZone = document.createElement('section');
    TAP_correctZone.id = 'TAP_correctZone';
    $(tileContainer).after(TAP_correctZone);
    $('.textNode').each(function () {
        this.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;

        idNum = parseInt(this.id.substr(4));
        // $(this).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
    });

    /*
   TapMatchingApp.curQCol = 1;
   */
    $('.tile').keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.dispatchEvent(new Event('mousedown'));
        }
    });
};

TapMatchingApp.tapOption = function (element) {
    if ($('.animated.bounceOutDown').length === 0) {
        // only if not animating a match
        var index = TapMatchingApp.tappedItems.indexOf(element);
        if (index === -1) {
            // select
            $(element).addClass('tapped');
            TapMatchingApp.tappedItems.push(element);

            if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
                TapMatchingApp.checkAnswers();
            }
        } else {
            // deselect
            $(element).removeClass('tapped');
            TapMatchingApp.tappedItems.splice(index, 1);
        }
    }
};

/**
 * Builds the correct instructions based on the type of activity, and whether or not it is being accessed on a mobile device.
 *
 * @method buildInstructions
 */
TapMatchingApp.buildInstructions = function () {
    var instructions;
    var TAP_activityText = document.createElement('p');
    TAP_activityText.id = 'TAP_activityText';
    /*
   if (TapMatchingApp.mobileDevice === true) {
      if (TapMatchingApp.ActivityType === 'match') {
         if (TapMatchingApp.AppData.FeedbackType === 'report') {
            instructions = 'Match each item to the appropriate category. ' +
               'Tap on "Check Answers" to see your results.';
         } else {
            instructions = 'Match each item to the appropriate category. ' +
               'Tap on "Check Answers" to see your progress.';
         }
      } else {
         if (TapMatchingApp.AppData.FeedbackType === 'report') {
            instructions = 'Sort each item into the appropriate category. ' +
               'Tap on "Check Answers" to see your results.';
         } else {
            instructions = 'Sort each item into to the appropriate category. ' +
               'Tap on "Check Answers" to see your progress.';
         }
      }
   } else {
      if (TapMatchingApp.ActivityType === 'match') {
         if (TapMatchingApp.AppData.FeedbackType === 'report') {
            instructions = 'Match each item to the appropriate category. For keyboard only users, ' +
               'use the tab key to select an answer from the list and use the enter key to select it. ' +
               'Use tab again to select the correct dropzone and then hit the enter key to confirm your answer. ' +
               'Select an answer and hit the delete key to return it to its original position. ' +
               'Use the "Check Answers" button to get your results.';
         } else {
            instructions = 'Match each item to the appropriate category. For keyboard only users, ' +
               'use the tab key to select an answer from the list and use the enter key to select it. ' +
               'Use tab again to select the correct dropzone and then hit the enter key to confirm your answer. ' +
               'Select an answer and hit the delete key to return it to its original position. ' +
               'Use the "Check Answers" to get your progress.';
         }
      } else {
         if (TapMatchingApp.AppData.FeedbackType === 'report') {
            instructions = 'Sort each item into the appropriate category. For keyboard only users, ' +
               'use the tab key to select an answer from the list and use the enter key to select it. ' +
               'Use tab again to select the correct dropzone and then hit the enter key to confirm your answer. ' +
               'Select an answer and hit the delete key to return it to its original position. ' +
               'Use the "Check Answers" button to get your results.';
         } else {
            instructions = '';
         }
      }
   }*/

    if (
        TapMatchingApp.AppData.Instructions !== 'none' &&
        TapMatchingApp.AppData.Instructions !== null &&
        TapMatchingApp.AppData.Instructions !== undefined &&
        TapMatchingApp.AppData.Instructions !== ''
    ) {
        instructions = TapMatchingApp.AppData.Instructions;
    }

    var TAP_iToggle = document.createElement('span');
    TAP_iToggle.id = 'TAP_iToggle';
    TAP_iToggle.setAttribute('tabindex', '1');
    $(TAP_iToggle).addClass('iDown');
    TAP_iToggle.innerHTML = '&#9650;<span class="sr-only">Collapse instructions</span>';
    $(TAP_iToggle).click(function () {
        if ($(this).hasClass('iDown') === true) {
            $(this).removeClass('iDown');
            $(this).addClass('iUp');
            $('#TAP_activityText').slideUp(500);
            this.innerHTML = '&#9660;<span class="sr-only">Collapse instructions</span>';
        } else {
            $(this).addClass('iDown');
            $(this).removeClass('iUp');
            $('#TAP_activityText').slideDown(500);
            this.innerHTML = '&#9650;<span class="sr-only">Collapse instructions</span>';
        }
    });
    $(TAP_iToggle).keyup(function (event) {
        if (event.keyCode === 13) {
            $(this).click();
        }
    });
    // var TAP_instructions = document.createElement('div');
    // TAP_instructions.id = 'TAP_instructions';
    // TAP_instructions.setAttribute('class', 'toggledOff');
    // TAP_appContainer.appendChild(TAP_instructions);

    // var TAP_instructionText = document.createElement('p');
    // TAP_instructionText.id = 'TAP_instructionText';
    // $(TAP_instructionText).css('padding', '10px');
    // $(TAP_instructionText).css('text-align', 'center');
    // TAP_instructionText.innerHTML = instructions;
    // TAP_appContainer.appendChild(TAP_instructionText);

    TAP_activityText.innerHTML = instructions;
    $(TAP_activityText).hide().appendTo(TAP_appContainer).fadeIn();
    $(TAP_iToggle).hide().appendTo(TAP_appContainer).fadeIn();
    // $('#TAP_instructions').toggle();
};

/**
 * Applies or removes the hover/focus effect to a draggable item.
 *
 * @method hLightEffect
 * @param {Object} target
 * @param {Boolean} on
 * @return {Boolean} Returns false
 */
TapMatchingApp.hLightEffect = function (target, on) {
    if ($(target).hasClass('dropped') === false) {
        if (TapMatchingApp.hLightingEffect === true) {
            if (TapMatchingApp.alreadySelected !== true) {
                if (on) {
                    $('#' + target.id).addClass('hover');
                } else {
                    idNum = parseInt(target.id.substr(4));
                    $('#' + target.id).removeClass('hover');
                }
            }
        }

        return false;
    }
};

/**
 * Allows a draggable item to be dropped.
 *
 * @method allowDrop
 * @param {Object} ev
 */
TapMatchingApp.allowDrop = function (ev) {
    ev.preventDefault();
};

TapMatchingApp.allowRevert = function (ev) {
    ev.preventDefault();
};

/**
 * Checks if the target is a drop zone.
 *
 * @method checkDropzone
 * @param {Object} target
 * @return {Boolean} Returns true if target has 'dropzone' as a class
 */
TapMatchingApp.checkDropzone = function (target) {
    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
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
TapMatchingApp.checkParentDropzone = function (target) {
    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        if (target.parentNode.className.search('dropzone') !== -1) {
            return true;
        }
    }
};

TapMatchingApp.checkChildDropzone = function (target) {
    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        if (target.lastChild.className.search('dropzone') !== -1) {
            return true;
        }
    }
};

TapMatchingApp.checkSiblingDropzone = function (target) {
    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
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
TapMatchingApp.drag = function (ev) {
    if (TapMatchingApp.notifications === true) {
        PNotify.removeAll();
    }
    var currentTarget;

    if (TapMatchingApp.mobileDevice === true) {
        TapMatchingApp.setHeight();
    }

    if ($(ev.target).hasClass('draggableImage') === true) {
        currentTarget = ev.target.parentNode;
    } else {
        currentTarget = ev.target;
    }

    currentTarget.setAttribute('ondrop', 'TapMatchingApp.drop(event);');

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
};

/**
 * Handles dropping an item into a drop zone with the mouse.
 *
 * @method drop
 * @param {Object} ev
 */
TapMatchingApp.drop = function (ev) {
    var browserName = navigator.appName;

    if (browserName === 'Microsoft Internet Explorer') {
        data = ev.dataTransfer.getData('text');
    } else {
        data = ev.dataTransfer.getData('Text');
    }

    var dropItem = document.getElementById(data);
    var dropParId;
    var numCheck;
    var numElements;

    ev.preventDefault();

    if (TapMatchingApp.checkDropzone(ev.target) && data.substr(0, 4) === 'drag') {
        $_this = ev.target;
        dropParId = ev.target.parentNode.id;
    } else if (TapMatchingApp.checkParentDropzone(ev.target) && data.substr(0, 4) === 'drag') {
        $_this = ev.target.parentNode;
        dropParId = ev.target.parentNode.parentNode.id;
    } else if (TapMatchingApp.checkSiblingDropzone(ev.target) && data.substr(0, 4) === 'drag') {
        $_this = ev.target.parentNode.parentNode.lastChild;
        dropParId = ev.target.parentNode.parentNode.id;
    } else if (TapMatchingApp.checkChildDropzone(ev.target) && data.substr(0, 4) === 'drag') {
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
        numCheck = TapMatchingApp.matchAmount[idNum];
        numElements = $($_this).children().length + 1;
        dropItem.setAttribute('aria-grabbed', 'false');
        dropItem.removeAttribute('aria-dropeffect');
        dropItem.removeAttribute('ondrop');

        if (numElements > numCheck) {
            if (TapMatchingApp.notifications === true) {
                new PNotify({
                    text: $($_this).attr('title') + ' is full',
                    type: 'info'
                });
            }
        }

        if (TapMatchingApp.ActivityType === 'match') {
            if ($($_this).is(':empty')) {
                if (TapMatchingApp.questionData[idNum].type === 'text') {
                    if ($(dropItem).hasClass('collapsed') === true) {
                        $(dropItem).removeClass('collapsed');
                    }

                    if (dropItem.offsetHeight > 26 && dropItem.offsetHeight <= 28) {
                        $(dropItem).addClass('fullExpand');
                    }
                }
                $_this.appendChild(dropItem);
                TapMatchingApp.HandleMobileDrop();
            }
        } else {
            if (numElements <= numCheck) {
                if (TapMatchingApp.questionData[idNum].type === 'text') {
                    if ($(dropItem).hasClass('collapsed') === true) {
                        $(dropItem).removeClass('collapsed');
                    }

                    if (dropItem.offsetHeight > 26 && dropItem.offsetHeight <= 28) {
                        $(dropItem).addClass('fullExpand');
                    }
                }
                $_this.appendChild(dropItem);
                TapMatchingApp.HandleMobileDrop();
            }
        }
    }
    // TapMatchingApp.checkAnswerInterval = setInterval('TapMatchingApp.checkAllAnswered();', 1000);
    TapMatchingApp.checkAllAnswered();

    if ($('#TAP_iToggle').hasClass('iDown') === true) {
        $('#TAP_iToggle').click();
    }

    $(dropItem).removeClass('hover');
};

/**
 * Reverts a draggable item back to it's original position with the mouse.
 *
 * @method revert
 * @param {Object} ev
 */
TapMatchingApp.revert = function (ev) {
    data = ev.dataTransfer.getData('Text');
    var revert = parseInt(data.substr(4, data.length));
    var revertPos = TapMatchingApp.origPos[revert];

    ev.preventDefault();

    temp = document.getElementById(data);

    if ($(temp).hasClass('collapsed') === true) {
        $(temp).removeClass('collapsed');
    }

    if ($(temp.firstChild).hasClass('TAP_expand') === true) {
        $(temp.firstChild).remove();
    }

    document.getElementById(data).setAttribute('aria-grabbed', 'false');
    document.getElementById(data).removeAttribute('aria-dropeffect');
    revertPos.appendChild(temp);

    TapMatchingApp.checkAllAnswered();
};

/**
 * Reverts a draggable item back to it's original position with the keyboard.
 *
 * @method revertKeyboard
 * @param {Object} target
 */
TapMatchingApp.revertKeyboard = function (target) {
    var id = target.id;
    var revert = parseInt(id.substr(4, id.length));
    var revertPos = TapMatchingApp.origPos[revert];

    if ($(target).hasClass('collapsed') === true) {
        $(target).removeClass('collapsed');
    }

    if ($(target.firstChild).hasClass('TAP_expand') === true) {
        $(target.firstChild).remove();
    }

    target.setAttribute('aria-grabbed', 'false');
    target.removeAttribute('aria-dropeffect');

    $(target).hide().appendTo(revertPos).fadeIn(500);
    // revertPos.appendChild(target);

    $('#screenAlert')
        .html('Returned ' + target.innerHTML + ' to original position.')
        .focus();
    setTimeout(function () {
        $('#screenAlert').html('');
    }, 3000);

    TapMatchingApp.ExitAccessDropMode();

    TapMatchingApp.checkAllAnswered();
};

/**
 * Evaluates whether each draggable item was placed correctly or incorrectly.
 *
 * @method evaluateScore
 */
TapMatchingApp.evaluateScore = function () {
    var correct =
        '<img class="correct" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAANCAYAAACgu+4kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Njk0QjdFOUFFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Njk0QjdFOUJFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5OEVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2OTRCN0U5OUVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PllHhcQAAACASURBVHjaYmIgB2zx7wBjIGAhSzMDQzmUzcBEtmYI4GeiQPMMIM5iokQzg8/G/0xQBYzkaAZxmKCap8FClRTNEANAmhkYMsAKkQ0hQjMsGj8i8UGGINgENIMAIw7bGIjRDPMCA1CyAkh2kqoZYQB2QwhqRngBM+T5idEMAgABBgBezD9OGUJHCwAAAABJRU5ErkJggg==" alt="right check mark" />';
    var wrong =
        '<img class="wrong" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAANCAYAAACgu+4kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6REI5RDZEMTdFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6REI5RDZEMThFQUFGMTFFNDg4MjBGN0M3OURFRTYyRDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2OTRCN0U5Q0VBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEQjlENkQxNkVBQUYxMUU0ODgyMEY3Qzc5REVFNjJENiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuBTV64AAAC/SURBVHjahJPRDcIwDETtCLEAjARSv/iL0hXoQGUFoi5QCUaCBfgJDnJQmubSSlak691zaqscQqA3n/dENEnNR3reCDwvOl3l6KTsITw+UTP6LoYvUqOaUHhU35T0BJgz7wqShan0/wB67aEGqYSH/DM5zoCZUScv5WrhmFsBAKTaGQIUci86ewn3uScBDJi2K2SHtmM2pu1b21kAwLR7tJ0FoLWq1orzG3Ro2gDy9+/0tFv/QtSlcwrbpH8FGAC2umDxE/BZxwAAAABJRU5ErkJggg==" alt="wrong x" />';

    /*
   var highestIntervalID = setInterval(";");
   for (var i = 0; i < highestIntervalID; i++) {
      clearInterval(i);
   }*/

    if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
        $('.correct').remove();
        $('.wrong').remove();
    }

    var groupKeys = TapMatchingApp.AppData.Questions[TapMatchingApp.curQuestion].answerGroupKeys;
    var j;

    if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
        for (i = 0; i < groupKeys.length; i++) {
            var numFound = 0;
            var group;

            for (var k = 0; k < TapMatchingApp.Groups.length; k++) {
                if (TapMatchingApp.Groups[k].key == groupKeys[i]) {
                    group = TapMatchingApp.Groups[k];
                    break;
                }
            }

            for (j = 0; j < TapMatchingApp.tappedItems.length; j++) {
                if (group.key == $(TapMatchingApp.tappedItems[j]).attr('data-group')) {
                    numFound++;
                }
            }

            // If answer is correct... or not
            if (numFound == group.options.length && TapMatchingApp.tappedItems.length == group.options.length) {
                // correct
                $(TapMatchingApp.tappedItems)
                    .addClass('correcto')
                    .removeAttr('onmousedown')
                    .removeAttr('onmouseover')
                    .removeAttr('onmouseout')
                    .removeAttr('onblur')
                    .removeAttr('onfocus')
                    .removeAttr('role');

                for (let m = 0; m < TapMatchingApp.tappedItems.length; m++) {
                    if (m === TapMatchingApp.tappedItems.length - 1) {
                        $(TAP_appContainer).css('overflow', 'hidden');

                        $(TapMatchingApp.tappedItems[m]).animateCss('bounceOutDown', function () {
                            var items = $(TapMatchingApp.tappedItems).detach();

                            // Sort items so that they appear in feedback in the correct order
                            // https://stackoverflow.com/a/1129270
                            function compare(a, b) {
                                if ($(a).attr('data-feedback-order') < $(b).attr('data-feedback-order')) return -1;
                                if ($(a).attr('data-feedback-order') > $(b).attr('data-feedback-order')) return 1;
                                return 0;
                            }

                            items.sort(compare);

                            html = $('<div>');
                            html.append(items);
                            $(items).fadeIn();

                            feedback = $('<div>');
                            feedback.addClass('feedback');
                            feedback.text(group.feedback);
                            html.append(feedback);
                            html.addClass('feedback-container');
                            $(html).hide();

                            let hr = $('<hr>');
                            hr.hide();
                            $('#TAP_correctZone').append(hr);
                            $('#TAP_correctZone').append(html);
                            $(hr).fadeIn();
                            $(html).fadeIn();
                            TapMatchingApp.tappedItems = [];
                            $(TAP_appContainer).css('overflow', '');
                            TapMatchingApp.checkIfAllAnswered();
                        });
                    } else {
                        $(TapMatchingApp.tappedItems[m]).animateCss('bounceOutDown');
                        i = groupKeys.length;
                    }
                }
            } else if (TapMatchingApp.tappedItems.length > 1 && i == groupKeys.length - 1) {
                $(TapMatchingApp.tappedItems).animateCss('headShake');
                $(TapMatchingApp.tappedItems).removeClass('tapped');
                TapMatchingApp.tappedItems = [];
            }
        }
    } else {
        for (i = 0; i < TapMatchingApp.questionData.length; i++) {
            temp = document.getElementById('drag' + i);
            tempPar = temp.parentNode.parentNode;
            tempComp = tempPar.id;
            ans = parseInt(tempComp.substr(10));

            TapMatchingApp.savedElements.push(temp.innerHTML);
            TapMatchingApp.savedAnswers.push(temp.parentNode.id);

            if (TapMatchingApp.qMatch[i] === TapMatchingApp.aMatch[ans]) {
                TapMatchingApp.scoreEval.push(1);
            } else {
                TapMatchingApp.scoreEval.push(0);
            }
        }
        if (TapMatchingApp.AppData.FeedbackType === 'report') {
            TapMatchingApp.currentAttempts++;
            TapMatchingApp.onComplete();
            TapMatchingApp.clearStage();
            TapMatchingApp.buildReport();
        }
    }
};

// If all matches are answered then display post activity page
TapMatchingApp.checkIfAllAnswered = function () {
    if (TapMatchingApp.PostActivityText !== 'none' || TapMatchingApp.PostActivityMedia !== 'none') {
        var numTilesLeft = $('.tile-container')[0].children.length;
        if (numTilesLeft === 0) {
            TapMatchingApp.buildPostQuiz();
        }
    }
};

/**
 * Score gets calculated based on each draggable item's determined correctness.
 *
 * @method calculateScore
 * @return {Integer} Returns score
 */
TapMatchingApp.calculateScore = function () {
    var score = 0;

    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        switch (TapMatchingApp.scoreEval[i]) {
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
TapMatchingApp.checkAnswers = function () {
    if (TapMatchingApp.notifications === true) {
        PNotify.removeAll();
    }
    TapMatchingApp.evaluateScore();

    if (TapMatchingApp.mobileDevice === false) {
        TapMatchingApp.checkCollapse = setInterval('TapMatchingApp.checkForCollapse();', 100);
    }

    var score = TapMatchingApp.calculateScore();
    var wrongAnswers = $('.wrong');

    $('#TAP_progress').html('You currently have ' + score + ' items in the correct category.');
    $('#TAP_progress').css('color', 'red');

    var total = 0;
    for (var i = 0; i < TapMatchingApp.matchAmount.length; i++) {
        total += TapMatchingApp.matchAmount[i];
    }

    if (score === total) {
        TapMatchingApp.finishedQuiz = true;
        if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
            $('#TAP_resetWrongButton').remove();
            $(TapMatchingApp.resetButton).hide().appendTo($('#TAP_buttonSet')).fadeIn(500);
            // $('#TAP_buttonSet').append(TapMatchingApp.resetButton).fadeIn(500);
            // document.getElementById('TAP_checkButton').disabled = true;
        }
        $('#TAP_progress').html(
            'Congratulations, you have successfully matched all ' +
                TapMatchingApp.questionData.length +
                ' scenarios with their correct approach. ' +
                'You are ready to proceed to the next topic in the course.'
        );
    }

    TapMatchingApp.scoreEval = [];
    if (TapMatchingApp.finishedQuiz === false) {
        if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
            if (wrongAnswers.length > 0) {
                document.getElementById('TAP_resetWrongButton').disabled = false;
                $('#TAP_resetWrongButton').fadeIn(500);
            }
        }
    }
};

/**
 * Determines if all the draggable items have been placed in a drop zone.
 *
 * @method checkAllAnswered
 */
TapMatchingApp.checkAllAnswered = function () {
    if (TapMatchingApp.AppData.FeedbackType === 'report') {
        if (typeof document.getElementById('TAP_checkButton') !== 'undefined') {
            var total = 0;
            for (var i = 0; i < TapMatchingApp.matchAmount.length; i++) {
                total += TapMatchingApp.matchAmount[i];
            }

            var answered = $('.dropzone .draggableTextNode').length;

            if (answered >= total) {
                document.getElementById('TAP_checkButton').disabled = false;
                $('#TAP_checkButton').fadeIn(500);
            } else {
                document.getElementById('TAP_checkButton').disabled = true;
                $('#TAP_checkButton').fadeOut(500);
            }
        }
    }
};

TapMatchingApp.checkForCollapse = function () {
    $('.draggableTextNode').each(function () {
        var dropItemID = this.id;
        var dropIndex = dropItemID.substr(4, dropItemID.length);

        if (TapMatchingApp.questionData[dropIndex].type === 'text') {
            if ($(this.parentNode).hasClass('dropzone') === true) {
                if ($(this.firstChild).hasClass('TAP_expand') === true) {
                    if ($(this)[0].scrollWidth === parseInt($(this).innerWidth())) {
                        if ($(this).hasClass('collapsed') === true) {
                            $(this.firstChild).remove();
                            $(this).removeClass('collapsed');
                            $(this).addClass('fullExpand');
                        }
                    }
                } else {
                    if ($(this)[0].scrollWidth > parseInt($(this).innerWidth()) || this.offsetHeight > 28) {
                        var cToggle = document.createElement('span');
                        cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
                        $(cToggle).addClass('TAP_expand');
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
                        $(cToggle).keyup(function (event) {
                            if (event.keyCode === 13) {
                                $(this).click();
                            }
                        });
                        $(this).prepend(cToggle);

                        if ($(this).hasClass('fullExpand') === true) {
                            $(this).removeClass('fullExpand');
                        }
                    }
                }

                if (this.offsetHeight > 28 && $(this.firstChild).hasClass('expanded') === false) {
                    $(this).addClass('collapsed');
                }
            }
        }

        if ($(this.firstChild).hasClass('TAP_expand') === false) {
            $(this).addClass('fullExpand');
        }
    });
};

TapMatchingApp.checkForCollapse = function () {
    $('.draggableTextNode')
        .not(':has(>.draggableImage)')
        .each(function () {
            if ($(this.parentNode).hasClass('dropzone') === true) {
                if ($(this.firstChild).hasClass('TAP_expand') === true) {
                    if ($(this)[0].scrollWidth === parseInt($(this).innerWidth())) {
                        if ($(this).hasClass('collapsed') === true) {
                            $(this.firstChild).remove();
                            $(this).removeClass('collapsed');
                            $(this).addClass('fullExpand');
                        }
                    }
                } else {
                    if ($(this)[0].scrollWidth > parseInt($(this).innerWidth()) || this.offsetHeight > 28) {
                        var cToggle = document.createElement('span');
                        cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
                        $(cToggle).addClass('TAP_expand');
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
                        $(cToggle).keyup(function (event) {
                            if (event.keyCode === 13) {
                                $(this).click();
                            }
                        });
                        $(this).prepend(cToggle);

                        if ($(this).hasClass('fullExpand') === true) {
                            $(this).removeClass('fullExpand');
                        }
                    }
                }

                if (this.offsetHeight > 28 && $(this.firstChild).hasClass('expanded') === false) {
                    $(this).addClass('collapsed');
                }
            }

            if ($(this.firstChild).hasClass('TAP_expand') === false) {
                $(this).addClass('fullExpand');
            }
        });
};

/**
 * Resets all of the draggable items to their original columns.
 *
 * @method reset
 */
TapMatchingApp.reset = function () {
    if (TapMatchingApp.notifications === true) {
        PNotify.removeAll();
    }
    TapMatchingApp.ti = 1;

    $('.correct').remove();
    $('.wrong').remove();

    TapMatchingApp.scoreEval = [];

    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        temp = document.getElementById('drag' + i);

        if ($(temp).hasClass('dropped') === true) {
            $(temp).toggleClass('dropped');
            $(temp).css('background-color', 'none');
        }

        if ($(temp).hasClass('collapsed') === true) {
            $(temp).removeClass('collapsed');
        }

        if ($(temp.firstChild).hasClass('TAP_expand') === true) {
            $(temp.firstChild).remove();
        }

        $(temp).hide().appendTo(TapMatchingApp.origPos[i]).fadeIn(500);
        // TapMatchingApp.origPos[i].appendChild(temp);
    }

    $('.draggableTextNode').each(function () {
        this.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    });

    $('#TAP_progress').html('Click the "Check Answers" button to check your progress.');
    $('#TAP_progress').css('color', 'black');
    TapMatchingApp.HandleMobileDrop();

    if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
        TapMatchingApp.finishedQuiz = false;
        $('#TAP_resetButton').fadeOut(500, function () {
            $('#TAP_resetButton').remove();
        });
        $('#TAP_buttonSet').append(TapMatchingApp.resetWrongButton);
        TapMatchingApp.sessionTimer = 0;
        TapMatchingApp.currentAttempts++;
        TapMatchingApp.onComplete();
    }

    $('[tabindex=1]').focus();
};

/**
 * Resets only the incorrectly placed draggable items to their original columns.
 *
 * @method resetWrong
 */
TapMatchingApp.resetWrong = function () {
    TapMatchingApp.ti = 1;

    TapMatchingApp.scoreEval = [];

    for (i = 0; i < TapMatchingApp.questionData.length; i++) {
        temp = document.getElementById('drag' + i);

        var children = $(temp).children();

        if ($(temp.firstChild).hasClass('TAP_expand') === true) {
            $(temp.firstChild).remove();
            $(temp).removeClass('collapsed');
        }

        if ($(temp.firstChild).hasClass('wrong') === true) {
            $(temp).hide().appendTo(TapMatchingApp.origPos[i]).fadeIn(500);
            // TapMatchingApp.origPos[i].appendChild(temp);
        }

        //FIX MEEEEEEEEE
        // if ($(children[1]).hasClass('wrong')) {
        //     $(temp).removeClass('collapsed');

        //     if ($(temp.firstChild).hasClass('TAP_expand') === true) {
        //         $(temp.firstChild).remove();
        //     }

        //     $(temp).hide().appendTo(TapMatchingApp.origPos[i]).fadeIn(500);
        //     // TapMatchingApp.origPos[i].appendChild(temp);
        // }
    }

    $('.draggableTextNode').each(function () {
        this.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    });

    $('.wrong').remove();
    document.getElementById('TAP_resetWrongButton').disabled = true;
    $('#TAP_resetWrongButton').fadeOut(500);

    $('#TAP_progress').html('Click the "Check Answers" button to check your progress');
    $('#TAP_progress').css('color', 'black');
    TapMatchingApp.HandleMobileDrop();

    $('[tabindex=1]').focus();
};

/**
 * Handles the selecting of a draggable item with a click, touch, or the keyboard.
 *
 * @method setMobileSelect
 * @param {Object} event
 */
TapMatchingApp.setMobileSelect = function (event) {
    var target;
    if (TapMatchingApp.notifications === true) {
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
        TapMatchingApp.EnterAccessDropMode();
        if (TapMatchingApp.mobileDevice === true) {
            TapMatchingApp.setHeight();
        }

        if (TapMatchingApp.alreadySelected === false) {
            TapMatchingApp.alreadySelected = true;
            $(target).addClass('dragMe');
            $(target).css('border', 'thin dashed #D3D9E3');
            if (
                TapMatchingApp.AppData.DefaultSelectColor !== null &&
                TapMatchingApp.AppData.DefaultSelectColor !== undefined &&
                TapMatchingApp.AppData.DefaultSelectColor !== 'none' &&
                TapMatchingApp.AppData.DefaultSelectColor !== ''
            ) {
                // $(target).css('background-color', TapMatchingApp.AppData.DefaultSelectColor);
            } else {
                // $(target).css('background-color', '#b7e5e5');
            }
            target.setAttribute('aria-grabbed', 'true');

            TapMatchingApp.initMobileSelect(target);
        } else {
            if ($(target).hasClass('dragMe') === true) {
                $(target).removeClass('dragMe');
                $(target).css('border', 'thin solid #D3D9E3');
                idNum = parseInt(target.id.substr(4));
                //$(target).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
                target.setAttribute('aria-grabbed', 'false');

                TapMatchingApp.alreadySelected = false;
                TapMatchingApp.HandleMobileDrop();
                TapMatchingApp.ExitAccessDropMode();
            } else {
                TapMatchingApp.HandleMobileDrop();
                TapMatchingApp.alreadySelected = false;
                $(target).addClass('dragMe');
                $(target).css('border', 'thin dashed #D3D9E3');
                idNum = parseInt(target.id.substr(4));
                //$(target).css('background-color', TapMatchingApp.AppData.DefaultSelectColor);
                target.setAttribute('aria-grabbed', 'true');

                TapMatchingApp.alreadySelected = true;
                TapMatchingApp.initMobileSelect(target);
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
TapMatchingApp.initMobileSelect = function (target) {
    temp = target.innerHTML;
    var temp2 = target.lastChild.alt;
    var accessMsg = '';
    var message = '';

    TapMatchingApp.selectedElements.push(temp);
    message = TapMatchingApp.selectedElements[0];
    accessMsg = TapMatchingApp.selectedElements[0];
    TapMatchingApp.droppedItem = accessMsg;

    if (temp2 !== undefined) {
        accessMsg = temp2;
        TapMatchingApp.droppedItem = accessMsg;
    }

    if (document.getElementById('screenAlert') === null) {
        var screenAlert = document.createElement('div');
        screenAlert.id = 'screenAlert';
        screenAlert.setAttribute('aria-live', 'assertive');
        TapMatchingApp.containerRef.appendChild(screenAlert);
    }

    TapMatchingApp.ShowAccMessage('Selected: ' + message);

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
TapMatchingApp.HandleMobileDrop = function (target) {
    var message = '';
    var alert = '';

    for (i = 0; i < TapMatchingApp.selectedElements.length; i++) {
        if (i > 0) {
            message += ', ' + TapMatchingApp.selectedElements[i];
        } else {
            message += TapMatchingApp.selectedElements[i];
        }
    }
    if (message === '') {
        message = 'none';
    }

    if ($(target).hasClass('dropzone')) {
        alert = 'Dropped: ' + TapMatchingApp.droppedItem + ' into ' + target.parentNode.firstChild.firstChild.innerHTML + ' dropzone';
    } else {
        alert = 'Dropped: ' + TapMatchingApp.droppedItem;
    }

    $('#screenAlert').html(alert).focus();
    setTimeout(function () {
        $('#screenAlert').html('');
    }, 3000);

    TapMatchingApp.selectedElements = [];

    var dropItem = $('.dragMe')[0];
    var dropParId;
    var numCheck;
    var numElements;

    if (target !== null && target !== undefined) {
        dropParId = target.parentNode.id;
        idNum = parseInt(dropParId.substr(10));
        numCheck = TapMatchingApp.matchAmount[idNum];
        numElements = $(target).children().length + 1;
    }

    var ids = [];
    $.each($('#' + dropParId + ' .draggableTextNode'), function (mac, cheese) {
        ids.push(cheese.getAttribute('id'));
    });
    if (typeof dropItem !== 'undefined') {
        if ($.inArray(dropItem.getAttribute('id'), ids) > -1) return false;
    }

    if (TapMatchingApp.ActivityType === 'match') {
        if ($(target).is(':empty')) {
            $(target).append($(dropItem));
            TapMatchingApp.ExitAccessDropMode();
        }
    } else {
        if (numElements <= numCheck) {
            $(target).append($(dropItem));
            TapMatchingApp.ExitAccessDropMode();
        }
    }

    if (numElements > numCheck) {
        if (TapMatchingApp.notifications === true) {
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
        // $(dropItem).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
        $(dropItem).attr('aria-grabbed', 'false');

        // if ($(dropItem.firstChild).hasClass('TAP_expand') === false) {
        //     var cToggle = document.createElement('span');
        //     cToggle.innerHTML = '&#9658;<span class="sr-only">Expand drag item</span>';
        //     $(cToggle).addClass('TAP_expand');
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

    // if (numElements > numCheck) {
    //     $(dropItem).removeClass('collapsed');

    //     // if ($(dropItem.firstChild).hasClass('TAP_expand')) {
    //     //     $(dropItem.firstChild).remove();
    //     // }
    // }

    TapMatchingApp.HideAccMessage();
    TapMatchingApp.alreadySelected = false;
    TapMatchingApp.checkAllAnswered();
};

/**
 * Handles the selecting or reverting of a draggable item with the keyboard.
 *
 * @method initAccMAT
 */
TapMatchingApp.initAccMAT = function () {
    var containers = $(TapMatchingApp.accMATCont + '.draggableTextNode');
    containers.keydown(function (ev) {
        if ($(ev.target).hasClass('dropped')) {
            //ev.preventDefault();
        } else {
            if (ev.which === 13) {
                TapMatchingApp.setMobileSelect(ev);
            } else if (ev.which === 46) {
                TapMatchingApp.revertKeyboard(this);
            }
        }
    });
};

/**
 * Displays the currently selected draggable item.
 *
 * @method ShowAccMessage
 * @param {String} message
 */
TapMatchingApp.ShowAccMessage = function (message) {
    $('#AccMessageDisp').html(message);
    $('#AccMessageDisp').css('visibility', 'visible');
};

/**
 * Hides the currently selected draggable item.
 *
 * @method HideAccMessage
 */
TapMatchingApp.HideAccMessage = function () {
    $('#AccMessageDisp').html('');
    $('#AccMessageDisp').css('visibility', 'hidden');
};

/**
 * Makes the drop zones accessible by keyboard, and the draggable items inaccessible, once an item has been selected.
 *
 * @method EnterAccessDropMode
 */
TapMatchingApp.EnterAccessDropMode = function () {
    if (TapMatchingApp.mobileDevice === true) {
        TapMatchingApp.setHeight();
    }

    $('.draggableTextNode').each(function () {
        if ($(this.firstChild).hasClass('TAP_expand') === true) {
            this.firstChild.setAttribute('tabindex', '-1');
            this.firstChild.setAttribute('aria-hidden', 'true');
        }

        this.setAttribute('tabindex', '-1');
        this.setAttribute('aria-hidden', 'true');
    });

    $('.TAP_button').each(function () {
        this.setAttribute('tabindex', '-1');
        this.setAttribute('aria-hidden', 'true');
    });

    ti = 1;
    $('.dropzone').each(function () {
        this.setAttribute('tabindex', ti);
        ti++;
    });

    $('.dropzone').focus(TapMatchingApp.HandleAccessDropzoneFocus);
    $('.dropzone').blur(TapMatchingApp.HandleAccessDropzoneBlur);
};

/**
 * Reverts a drop zone's original styling after it loses focus.
 *
 * @method HandleAccessDropzoneBlur
 */
TapMatchingApp.HandleAccessDropzoneBlur = function () {
    ansId = parseInt(this.parentNode.id.substr(10));

    if (TapMatchingApp.savedBackgrounds[ansId] === 'none') {
        // $(this).css('background-color', '#FFFFFF');
    } else {
        // $(this).css('background-image', 'url(' + TapMatchingApp.savedBackgrounds[ansId] + ')');
        // $(this).css('background-repeat', 'repeat');
    }

    $(this).unbind('keyup', TapMatchingApp.HandleAccessDropRequest);
};

/**
 * Highlights the drop zone that currently has focus.
 *
 * @method HandleAccessDropzoneFocus
 */
TapMatchingApp.HandleAccessDropzoneFocus = function () {
    ansId = parseInt(this.parentNode.id.substr(10));

    if (TapMatchingApp.savedBackgrounds[ansId] === 'none') {
        // $(this).css('background-color', '#f9f9f9');
    } else {
        // $(this).css('background-color', '#f9f9f9');
        // $(this).css('background-image', 'none');
    }

    $(this).keyup(TapMatchingApp.HandleAccessDropRequest);
    this.setAttribute('onclick', 'TapMatchingApp.HandleMobileDrop(this)');
};

/**
 * Handles the dropping of an element into a drop zone with the keyboard.
 *
 * @method HandleAccessDropRequest
 * @param {Object} ev
 */
TapMatchingApp.HandleAccessDropRequest = function (ev) {
    //Simply adjusts the select size to reflect the number of listed items after each keypress.
    if (ev.which === 13) {
        $(this).click();
        setTimeout(function () {
            TapMatchingApp.ExitAccessDropMode();
        }, 200);
    }
};

/**
 * Makes the drop zones inaccessible by keyboard, and the draggable items accessible, once an item has been dropped.
 *
 * @method ExitAccessDropMode
 */
TapMatchingApp.ExitAccessDropMode = function () {
    TapMatchingApp.ti = 1;

    $('.draggableTextNode').each(function () {
        if ($(this.firstChild).hasClass('TAP_expand') === true) {
            this.firstChild.setAttribute('tabindex', TapMatchingApp.ti);
            this.firstChild.setAttribute('aria-hidden', 'false');
            TapMatchingApp.ti++;
        }
        this.setAttribute('tabindex', TapMatchingApp.ti);
        this.setAttribute('aria-hidden', 'false');
        TapMatchingApp.ti++;
    });

    // TapMatchingApp.instructionButton.setAttribute('tabindex', TapMatchingApp.ti);
    // TapMatchingApp.ti++;
    TapMatchingApp.checkAnswersButton.setAttribute('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;

    if (TapMatchingApp.AppData.FeedbackType === 'continuous') {
        TapMatchingApp.resetWrongButton.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    } else {
        TapMatchingApp.resetButton.setAttribute('tabindex', TapMatchingApp.ti);
        TapMatchingApp.ti++;
    }
    $('#TAP_instructions').attr('tabindex', TapMatchingApp.ti);
    TapMatchingApp.ti++;

    $('.TAP_button').each(function () {
        this.setAttribute('aria-hidden', 'false');
    });

    $('.dropzone').unbind('focus', TapMatchingApp.HandleAccessDropzoneFocus);
    $('.dropzone').unbind('blur', TapMatchingApp.HandleAccessDropzoneBlur);

    $('.dropzone').each(function () {
        if (TapMatchingApp.mobileDevice === false) {
            this.removeAttribute('onclick');
        }

        ansId = parseInt(this.parentNode.id.substr(10));

        this.setAttribute('tabindex', -1);

        if (TapMatchingApp.savedBackgrounds[ansId] === 'none') {
            // $(this).css('background-color', '#FFFFFF');
        } else {
            // $(this).css('background-image', 'url(' + TapMatchingApp.savedBackgrounds[ansId] + ')');
        }
        $(this).unbind('keyup', TapMatchingApp.HandleAccessDropRequest);
        this.blur();
    });

    TapMatchingApp.HideAccMessage();

    setTimeout(function () {
        $('[tabindex=1]').focus();
    }, 100);
};

/**
 * Handles the dragging and dropping of a draggable item on a mobile/touch screen device.
 *
 * @method touchDrag
 * @param {Object} evt
 */
TapMatchingApp.touchDrag = function (evt) {
    if (TapMatchingApp.mobileDevice === true) {
        TapMatchingApp.setHeight();
    }

    var draggable = evt.target;
    var revertPos = draggable.id;
    var revert = parseInt(revertPos.substr(4, revertPos.length));
    var wrapper = TapMatchingApp.origPos[revert];

    // Make the element draggable by giving it an absolute position and modifying the x and y coordinates
    $(draggable).addClass('absolute');

    // Put the draggable into the wrapper, because otherwise the position will be relative of the parent element
    wrapper.appendChild(draggable);

    var touch = evt.targetTouches[0];

    // Place element where the finger is
    draggable.style.left = touch.pageX - $(draggable).width() / 2 + 'px';
    draggable.style.top = touch.pageY - $(draggable).height() / 2 + 'px';
    evt.preventDefault();

    var offsetX = $('body').scrollLeft();
    var offsetY = $('body').scrollTop();

    draggable.addEventListener('touchend', function (event) {
        var dropParId;
        var numCheck;
        var numElements;

        // Find the element on the last draggable position
        var endTarget = document.elementFromPoint(event.changedTouches[0].pageX - offsetX, event.changedTouches[0].pageY - offsetY);

        // Position it relative again and remove the inline styles that aren't needed anymore
        $(draggable).removeClass('absolute');
        draggable.removeAttribute('style');

        // Put the draggable into it's new home
        if (endTarget) {
            var className = document.getElementById(endTarget.id);

            if (className.className === 'connect_box dropzone') {
                dropParId = endTarget.parentNode.id;
                idNum = parseInt(dropParId.substr(10));
                numCheck = TapMatchingApp.matchAmount[idNum];
                numElements = $(endTarget).children().length + 1;

                if (TapMatchingApp.ActivityType === 'match') {
                    if ($(className).is(':empty')) {
                        endTarget.appendChild(draggable);

                        // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                        $(draggable).addClass('fullExpand');
                        // }

                        idNum = parseInt(draggable.id.substr(4));
                        // $(draggable).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
                    }
                } else {
                    if (numElements <= numCheck) {
                        endTarget.appendChild(draggable);

                        // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                        $(draggable).addClass('fullExpand');
                        // }

                        idNum = parseInt(draggable.id.substr(4));
                        // $(draggable).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
                    }
                }
            } else if (className.parentNode.className === 'connect_box dropzone') {
                dropParId = endTarget.parentNode.parentNode.id;
                idNum = parseInt(dropParId.substr(10));
                numCheck = TapMatchingApp.matchAmount[idNum];
                numElements = $(endTarget.parentNode).children().length + 1;

                if (TapMatchingApp.ActivityType === 'match') {
                    if ($(className.parentNode).is(':empty')) {
                        endTarget.parentNode.appendChild(draggable);

                        // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                        $(draggable).addClass('fullExpand');
                        // }

                        idNum = parseInt(draggable.id.substr(4));
                        // $(draggable).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
                    }
                } else {
                    if (numElements <= numCheck) {
                        endTarget.parentNode.appendChild(draggable);

                        // if (draggable.offsetHeight > 26 && draggable.offsetHeight <= 28) {
                        $(draggable).addClass('fullExpand');
                        // }

                        idNum = parseInt(draggable.id.substr(4));
                        // $(draggable).css('background-color', TapMatchingApp.savedBackgroundColors[idNum]);
                    }
                }
            }
            // else {
            //    $(draggable).removeClass('collapsed');
            // }
        }

        if ($('#TAP_iToggle').hasClass('iDown') === true) {
            $('#TAP_iToggle').click();
        }

        TapMatchingApp.checkAllAnswered();
    });
};

/**
 * Takes the passed object data and embeds it based on type.
 *
 * @method EmbedMedia
 * @param {String} containerRef
 * @param {Object} mediaData
 * @return
 */
TapMatchingApp.EmbedMedia = function (containerRef, mediaData) {
    var mediaDomObj = document.createElement('div');
    var mediaDomLink, mediaDomContent;
    mediaDomObj.setAttribute('class', 'TAP_Media');

    switch (mediaData.type) {
        case 'link':
            mediaDomContent = document.createElement('a');
            mediaDomContent.setAttribute('class', 'TAP_MediaLink');
            mediaDomContent.setAttribute('href', mediaData.src);
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.setAttribute('tabindex', TapMatchingApp.ti);
            TapMatchingApp.ti++;
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
                mediaDomLink.setAttribute('class', 'TAP_MediaImage');
                mediaDomLink.setAttribute('href', mediaData.mediaLink);
                mediaDomLink.setAttribute('tabindex', TapMatchingApp.ti);
                TapMatchingApp.ti++;
                mediaDomLink.setAttribute('target', '_blank');
            }

            mediaDomContent = document.createElement('img');

            if (mediaData.mediaLink === 'none' || mediaData.mediaLink === null || mediaData.mediaLink === undefined || mediaData.mediaLink === '') {
                mediaDomContent.setAttribute('class', 'TAP_MediaImage');
            }

            mediaDomContent.setAttribute('src', mediaData.src);

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
            validSrc = TapMatchingApp.validateYouTubeLink(mediaData.src);
            if (validSrc) {
                mediaDomContent = document.createElement('iframe');
                mediaDomContent.setAttribute('class', 'TAP_MediaEmbeddedVideo');

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

                mediaDomLink = document.createElement('a');
                mediaDomLink.setAttribute('class', 'TAP_MediaAltLink');
                mediaDomLink.setAttribute('href', mediaData.altLink);
                mediaDomLink.setAttribute('tabindex', TapMatchingApp.ti);
                TapMatchingApp.ti++;
                mediaDomLink.setAttribute('target', '_blank');
                mediaDomLink.innerHTML = 'Alternate Link.';

                mediaDomObj.appendChild(mediaDomLink);
            }

            break;

        case 'text':
            mediaDomContent = document.createElement('p');
            mediaDomContent.setAttribute('class', 'TAP_MediaText');
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
TapMatchingApp.validateYouTubeLink = function (src) {
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
TapMatchingApp.timer = function () {
    TapMatchingApp.sessionTimer++;
};

/**
 * Sets the height of the question container to prevent collapsing.
 *
 * @method setHeight
 */
TapMatchingApp.setHeight = function () {
    if (TapMatchingApp.heightSet === false && TapMatchingApp.mobileDevice === true) {
        var minHeight = $('#qColum_1').height();
        $('#TAP_qColContainer').css('min-height', minHeight + 20 + 'px');
        TapMatchingApp.heightSet = true;
    }
};

/**
 * A custom function that gets called on activity completion.
 *
 * @method onComplete
 * @return
 */
TapMatchingApp.onComplete = function () {
    //Custom code will go here
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

// Animate an element once
$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function () {
            $(this).removeClass('animated ' + animationName);
            if (callback) {
                callback();
            }
        });
        return this;
    }
});

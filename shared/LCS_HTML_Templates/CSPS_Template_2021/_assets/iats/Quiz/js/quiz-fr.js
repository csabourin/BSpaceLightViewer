/* eslint-disable */
/**
 * Contains all of the functionality for Quiz Vanilla.
 *
 * @class InlineQuizApp
 */
 var InlineQuizApp = {
    currentQuestion: 0,
    setupReady: false,
    containerRef: null,
    contentRef: null,
    headerRef: null,
    QuizData: null,
    headingLevel: null,
    AttemptData: [],
    numericalQuizID: 0,
    currentQuestionID: 0,
    onComplete: null,
    onReady: null,
    tabIndexSet: 0,
    smallWidthTolerance: 650,
    isHint: false,
    inputText: [],
    savedText: [],
    textInterval: null,
    inputScores: [],
    headerAnimated: false,
    containerID: null,
};
var D2LDEBUG = false;
var ca, aa, crta, n, qt, idx;
var a, i, j, k, q, z;
var ILQ_container,
    ILQ_instructionText,
    ILQ_buttonSet,
    ILQ_LeftBaseButtonContainer,
    ILQ_RightBaseButtonContainer,
    ILQ_BaseButtonLabel,
    ILQ_ContinuousResponseCont;
var questionFile, classlist, eventData, endText, cont, qCopy, blankField, qWithoutBlank, answer, altResponse, qScore, maxScore;
var qAnswer, capAnswer, numAnswer, btnTxt, nextBtn;
var leftBtnData, temp, selectedSlot, impContainer, blankCount, blankText, altAnswered, score, validSrc, code, link;
/**
 * Establishes the JSON text file path, the id of the section to house the quiz, and makes a call to get the quiz data.
 *
 * @method setupQuiz
 * @param {String} file
 * @param {String} location
 */
InlineQuizApp.setupQuiz = function (file, location) {
    InlineQuizApp.numericalQuizID++;
    questionFile = file;
    if (document.getElementById(location) !== null) {
        InlineQuizApp.containerRef = document.getElementById(location);
        InlineQuizApp.containerID = location;
        InlineQuizApp.getQuizData(InlineQuizApp.BuildQuiz);
    } else {
        d2log('ERROR: Missing specified DOM object in InlineQuizApp.setupQuiz().');
    }
};
/**
 * Retrieves the quiz data from the JSON text file, passes quiz data to build the quiz.
 *
 * @method getQuizData
 * @param {Method} callback
 */
InlineQuizApp.getQuizData = function (callback) {
    // The call for the JSON data
    var jqxhr = $.getJSON(questionFile, function (data) {
        InlineQuizApp.QuizData = data;
        callback(InlineQuizApp.QuizData);
    });
    // If the JSON data fails inform the users and give some data to developers using the debug console.
    jqxhr.fail(function (e) {
        d2log(
            'ERROR: Failed to load data file from ' +
                questionFile +
                ' ensure file is at that location and that JSON data is valid. (Tip: use a validator like: http://jsonformatter.curiousconcept.com/)'
        );
        d2log(e);
    });
};
/**
 * Determines whether the passed object already has an assigned class.
 *
 * @method HasClass
 * @param {} DomObj
 * @param {} classID
 * @return {Boolean} Literal(true or false)
 */
InlineQuizApp.HasClass = function (DomObj, classID) {
    if (DomObj.classList && DomObj.classList.contains(classID)) {
        return true;
    } else if (DomObj.className) {
        classlist = DomObj.className.split(' ');
        for (i = classlist.length - 1; i >= 0; i--) {
            if (classlist[i] === classID) {
                return true;
            }
        }
        return false;
    }
    d2log('HasClass was passed a bad DomObj.');
    return false;
};
/**
 * Takes the passed array and shuffles it into a random order.
 *
 * @method shuffle
 * @param {Array} array
 * @return {Array} array(shuffled)
 */
InlineQuizApp.shuffle = function (array) {
    var m = array.length,
        t,
        i;
    // While there remain elements to shuffle
    while (m) {
        // Pick a remaining element
        i = Math.floor(Math.random() * m--);
        // And swap it with the current element
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
};
/**
 * Builds the quiz. Randomizes questions if required, displays pre quiz text if required, otherwise it calls the first question.
 *
 * @method BuildQuiz
 */
InlineQuizApp.BuildQuiz = function () {
    InlineQuizApp.DefineContainer();
    for (q = InlineQuizApp.QuizData.Questions.length - 1; q >= 0; q--) {
        InlineQuizApp.QuizData.Questions[q].QuestionID = q;
        InlineQuizApp.QuizData.Questions[q].ChosenAnswers = [];
    }
    for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
        InlineQuizApp.inputScores.push(0);
    }
    for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
        InlineQuizApp.savedText.push(0);
    }
    if (InlineQuizApp.QuizData.General.randomize) {
        InlineQuizApp.QuizData.Questions = InlineQuizApp.shuffle(InlineQuizApp.QuizData.Questions);
    }
    if (
        InlineQuizApp.QuizData.General.preQuizText === null ||
        InlineQuizApp.QuizData.General.preQuizText === undefined ||
        InlineQuizApp.QuizData.General.preQuizText === ''
    ) {
        InlineQuizApp.QuizData.General.preQuizText = 'none';
    }
    if (
        InlineQuizApp.QuizData.General.preQuizMedia === null ||
        InlineQuizApp.QuizData.General.preQuizMedia === undefined ||
        InlineQuizApp.QuizData.General.preQuizMedia === ''
    ) {
        InlineQuizApp.QuizData.General.preQuizMedia = 'none';
    }
    if (
        InlineQuizApp.QuizData.General.postQuizText === null ||
        InlineQuizApp.QuizData.General.postQuizText === undefined ||
        InlineQuizApp.QuizData.General.postQuizText === ''
    ) {
        InlineQuizApp.QuizData.General.postQuizText = 'none';
    }
    if (
        InlineQuizApp.QuizData.General.postQuizMedia === null ||
        InlineQuizApp.QuizData.General.postQuizMedia === undefined ||
        InlineQuizApp.QuizData.General.postQuizMedia === ''
    ) {
        InlineQuizApp.QuizData.General.postQuizMedia = 'none';
    }
    if (
        InlineQuizApp.QuizData.General.instructions === null ||
        InlineQuizApp.QuizData.General.instructions === undefined ||
        InlineQuizApp.QuizData.General.instructions === ''
    ) {
        InlineQuizApp.QuizData.General.instructions = 'none';
    }
    if (InlineQuizApp.QuizData.General.repeatOnComplete !== true) {
        InlineQuizApp.QuizData.General.repeatOnComplete = true;
    }
    InlineQuizApp.headingLevel = parseInt(InlineQuizApp.QuizData.General.HeadingLevel);
    if (
        InlineQuizApp.headingLevel === null ||
        InlineQuizApp.headingLevel === undefined ||
        InlineQuizApp.headingLevel === 'none' ||
        isNaN(InlineQuizApp.headingLevel) ||
        InlineQuizApp.headingLevel === ''
    ) {
        InlineQuizApp.headingLevel = 1;
    } else if (InlineQuizApp.headingLevel > 3) {
        InlineQuizApp.headingLevel = 3;
    }
    if (InlineQuizApp.QuizData.General.preQuizText !== 'none') {
        InlineQuizApp.SetTextSlide(
            InlineQuizApp.QuizData.General.preQuizText,
            function () {
                InlineQuizApp.GoNextQuestion();
            },
            {
                mediaData: InlineQuizApp.QuizData.General.preQuizMedia,
            }
        );
    } else if (InlineQuizApp.QuizData.General.preQuizText === 'none' && InlineQuizApp.QuizData.General.preQuizMedia !== 'none') {
        InlineQuizApp.SetTextSlide(
            '',
            function () {
                InlineQuizApp.GoNextQuestion();
            },
            {
                mediaData: InlineQuizApp.QuizData.General.preQuizMedia,
            }
        );
    } else {
        InlineQuizApp.GoNextQuestion();
    }
    eventData = {
        quizData: InlineQuizApp.QuizData,
    };
    if (InlineQuizApp.onReady !== null && InlineQuizApp.onReady.constructor === Function) {
        try {
            InlineQuizApp.onReady(eventData);
        } catch (err) {
            d2log('onReady Error!');
            d2log(err);
        }
    }
    $(InlineQuizApp.containerRef).addClass('rs_preserve');
};
/**
 * Checks to make sure user is able to progress to the next question, and if so, calls the next question. If not, it makes a call to assess the question's answer.
 *
 * @method RequestNextQuestion
 */
InlineQuizApp.RequestNextQuestion = function () {
    clearInterval(InlineQuizApp.textInterval);
    if (InlineQuizApp.QuizData.General.feedBackType === 'continuous') {
        if (InlineQuizApp.QuizData.General.forceCorrect === false) {
            $('input').each(function () {
                $(this).attr('disabled', 'disabled');
            });
        }
        InlineQuizApp.AssessFeedback();
    } else if (InlineQuizApp.QuizData.General.feedBackType === 'report' && InlineQuizApp.QuizData.General.forceCorrect === true) {
        InlineQuizApp.AssessFeedback();
    } else {
        if (
            InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Fill In The Blank' ||
            InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Math'
        ) {
            InlineQuizApp.savedText.splice(InlineQuizApp.currentQuestion, 1, InlineQuizApp.inputText);
            clearInterval(InlineQuizApp.textInterval);
        }
        InlineQuizApp.currentQuestion++;
        if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions) {
            InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
        }
        InlineQuizApp.GoNextQuestion();
    }
};
/**
 * Loads the next question if there are remaining questions. Otherwise it calls for the quiz report if required or calls for the end of the quiz.
 *
 * @method GoNextQuestion
 */
InlineQuizApp.GoNextQuestion = function () {
    if (
        InlineQuizApp.QuizData.General.showQuestions === 'none' ||
        InlineQuizApp.QuizData.General.showQuestions === null ||
        InlineQuizApp.QuizData.General.showQuestions === undefined ||
        InlineQuizApp.QuizData.General.showQuestions === ''
    ) {
        InlineQuizApp.QuizData.General.showQuestions = InlineQuizApp.QuizData.Questions.length;
    }
    if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions) {
        InlineQuizApp.setQuestionSlide(InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion]);
    } else {
        if (InlineQuizApp.QuizData.General.feedBackType === 'report') {
            InlineQuizApp.GenerateFullReport();
        } else {
            InlineQuizApp.goEndSlide();
        }
    }
    if (InlineQuizApp.QuizData.General.preQuizText === 'none' && InlineQuizApp.QuizData.General.preQuizMedia === 'none') {
        if (InlineQuizApp.currentQuestion > 0) {
            InlineQuizApp.GoToTop();
        }
    } else {
        InlineQuizApp.GoToTop();
    }
};
/**
 * Ends the quiz with either a default or a user specified end message.
 *
 * @method goEndSlide
 */
InlineQuizApp.goEndSlide = function () {
    if (InlineQuizApp.QuizData.General.postQuizText !== 'none') {
        endText = InlineQuizApp.QuizData.General.postQuizText;
    } else {
        endText = '<p>Vous avez terminé cette évaluation.</p>';
    }
    eventData = {
        quizData: InlineQuizApp.QuizData,
        scoreAchieved: InlineQuizApp.GetTotalScore(),
        scoreMax: InlineQuizApp.GetMaxScore(),
    };
    if (InlineQuizApp.onComplete !== null && InlineQuizApp.onComplete.constructor === Function) {
        try {
            InlineQuizApp.onComplete(eventData);
        } catch (err) {
            d2log('onComplete Error!');
            d2log(err);
        }
    }
    if (InlineQuizApp.QuizData) {
        if (InlineQuizApp.QuizData.General.repeatOnComplete) {
            InlineQuizApp.SetTextSlide(
                endText,
                function () {
                    if (InlineQuizApp.QuizData.General.randomize) {
                        InlineQuizApp.QuizData.Questions = InlineQuizApp.shuffle(InlineQuizApp.QuizData.Questions);
                    }
                    InlineQuizApp.currentQuestion = 0;
                    InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                    // Resets the chosen answers for all types of questions, so they can't be used to repopulate fields on restart
                    for (q = InlineQuizApp.QuizData.Questions.length - 1; q >= 0; q--) {
                        InlineQuizApp.QuizData.Questions[q].QuestionID = q;
                        InlineQuizApp.QuizData.Questions[q].ChosenAnswers = [];
                    }
                    InlineQuizApp.savedText = [];
                    for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
                        InlineQuizApp.savedText.push(0);
                    }
                    InlineQuizApp.GoNextQuestion();
                },
                {
                    buttonLabel: "Redémarrer l'activité",
                    mediaData: InlineQuizApp.QuizData.General.postQuizMedia,
                }
            );
        } else {
            InlineQuizApp.SetTextSlide(endText, 'none', {
                mediaData: InlineQuizApp.QuizData.General.postQuizMedia,
            });
        }
    }
};
/**
 * Loads the previous question as long as you're not on the first question.
 *
 * @method goPreviousQuestion
 */
InlineQuizApp.goPreviousQuestion = function () {
    clearInterval(InlineQuizApp.textInterval);
    if (InlineQuizApp.currentQuestion === 0) {
        InlineQuizApp.SetTextSlide(
            InlineQuizApp.QuizData.General.preQuizText,
            function () {
                InlineQuizApp.GoNextQuestion();
            },
            {
                mediaData: InlineQuizApp.QuizData.General.preQuizMedia,
            }
        );
    } else {
        InlineQuizApp.currentQuestion--;
        InlineQuizApp.GoNextQuestion();
        InlineQuizApp.RepopulateQuestion();
    }
    InlineQuizApp.GoToTop();
    //console.log ('InlineQuizApp.GoToTop triggered in goPreviousQuestion')
};
/**
 * Generates a full report by piecing all the mini reports together.
 *
 * @method GenerateFullReport
 */
InlineQuizApp.GenerateFullReport = function () {
    var ILQ_fullReport = document.createElement('div');
    ILQ_fullReport.innerHTML = '';
    var ILQ_ContinuousResponseHeader = document.createElement('h' + (InlineQuizApp.headingLevel + 1));
    ILQ_ContinuousResponseHeader.setAttribute('id', 'ILQ_ContinuousResponseHeader');
    ILQ_ContinuousResponseHeader.innerHTML = 'Rétroaction: ';
    ILQ_fullReport.appendChild(ILQ_ContinuousResponseHeader);
    for (a = 0; a < InlineQuizApp.QuizData.General.showQuestions; a++) {
        ILQ_fullReport.appendChild(InlineQuizApp.GenerateMiniReport(a, true));
    }
    if (
        InlineQuizApp.QuizData.General.postQuizText === 'none' &&
        InlineQuizApp.QuizData.General.postQuizMedia === 'none' &&
        InlineQuizApp.QuizData.General.repeatOnComplete === true
    ) {
        btnTxt = "Redémarrer l'activité";
    } else {
        btnTxt = 'Continuer';
    }
    InlineQuizApp.SetTextSlide(
        ILQ_fullReport.innerHTML,
        function () {
            if (
                InlineQuizApp.QuizData.General.postQuizText === 'none' &&
                InlineQuizApp.QuizData.General.postQuizMedia === 'none' &&
                InlineQuizApp.QuizData.General.repeatOnComplete === true
            ) {
                if (InlineQuizApp.QuizData.General.randomize) {
                    InlineQuizApp.QuizData.Questions = InlineQuizApp.shuffle(InlineQuizApp.QuizData.Questions);
                }
                InlineQuizApp.currentQuestion = 0;
                InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                // Resets the chosen answers for all types of questions, so they can't be used to repopulate fields on restart
                for (q = InlineQuizApp.QuizData.Questions.length - 1; q >= 0; q--) {
                    InlineQuizApp.QuizData.Questions[q].QuestionID = q;
                    InlineQuizApp.QuizData.Questions[q].ChosenAnswers = [];
                }
                InlineQuizApp.savedText = [];
                for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
                    InlineQuizApp.savedText.push(0);
                }
                btnTxt = "Redémarrer l'activité";
                InlineQuizApp.GoNextQuestion();
            } else {
                btnTxt = 'Continuer';
                InlineQuizApp.goEndSlide();
            }
        },
        {
            buttonLabel: btnTxt,
            addClass: 'ILQ_fullReport',
        }
    );
    InlineQuizApp.GoToTop();
};
/**
 * Generates report for each question.
 *
 * @method GenerateMiniReport
 * @param {Integer} questionIndex
 * @param {Boolean} includeQuestion
 * @return {Object} ILQ_miniReport
 */
InlineQuizApp.GenerateMiniReport = function (questionIndex, includeQuestion) {
    //If this method wasn't passed a questionIndex, set the index to the current question.
    if (questionIndex === void 0) {
        questionIndex = InlineQuizApp.currentQuestion;
    }
    //Creates the HTML element div.ILQ_miniReport and assigns its class.
    var ILQ_miniReport = document.createElement('div');
    ILQ_miniReport.setAttribute('class', 'ILQ_miniReport');
    //Creates the HTML element div.ILQ_miniReportContent and assigns its class.
    var ILQ_miniReportContent = document.createElement('div');
    ILQ_miniReportContent.setAttribute('class', 'ILQ_miniReportContent');
    //Sets chosen answer array to the current question's chosen answers.
    ca = InlineQuizApp.QuizData.Questions[questionIndex].ChosenAnswers;
    //Set the correct answer array to the current question's correct answers.
    aa = InlineQuizApp.QuizData.Questions[questionIndex].answers;
    //Array of answers
    crta = [];
    //Iterate through correct answer array.
    for (i = aa.length - 1; i >= 0; i--) {
        //If partial answers are allowed and the correct answer has a score value of greater than 0.
        if (InlineQuizApp.QuizData.General.allowPartial && aa[i].scoreValue > 0) {
            //Push that anserText into crta array.
            crta.push(aa[i].answerText);
        }
        //If partial answers are not allowed --
        else if (!InlineQuizApp.QuizData.General.allowPartial) {
            // -- and if that question's type is All That Apply AND has a score value of greater than 0.
            if (InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'All That Apply' && aa[i].scoreValue > 0) {
                //Push that answerText into the crta array.
                crta.push(aa[i].answerText);
            }
            // -- and if that question's type if Multiple choice AND has a score value of that question's max score value.
            else if (
                InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Multiple Choice' &&
                aa[i].scoreValue === InlineQuizApp.QuizData.Questions[questionIndex].maxScoreValue
            ) {
                //Push that answerText into the crta array.
                crta.push(aa[i].answerText);
            }
        }
    }
    cont = '';
    //feedBack variable contains the open tag for p.ILQ_miniReportHeader and the strong tag which will contain the text.
    var feedBack = '<p class="ILQ_miniReportHeader"><strong></strong>';
    var feedBackArr = [];
    //Sets up the header of that question's feedback only if we want to include the question in the feedback.
    if (includeQuestion) {
        //Creates header element corresponding to 2 levels highter than the indicated level.
        var ILQ_miniReportRecap = document.createElement('h' + (InlineQuizApp.headingLevel + 2));
        //Sets class of this header to ILQ_questionRecap
        ILQ_miniReportRecap.setAttribute('class', 'ILQ_questionRecap');
        //For Math or Fill in the Blank questions
        if (
            InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Fill In The Blank' ||
            InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Math'
        ) {
            //Assign the current question's question text to qCopy
            qCopy = InlineQuizApp.QuizData.Questions[questionIndex].questionText;
            //Iterate through the current question's answer array.
            for (i = 1; i <= InlineQuizApp.QuizData.Questions[questionIndex].answers.length; i++) {
                //Assign the answer's answerText to blankField
                blankField = InlineQuizApp.QuizData.Questions[questionIndex].answers[i - 1].answerText;
                //Replace the BLANK1, BLANK2, etc blanks with just BLANK for the renderred version.
                qWithoutBlank = qCopy.replace('BLANK' + i, 'BLANK');
                //Replace the text with the BLANK (without numbers) version.
                qCopy = qWithoutBlank;
            }
            //Generate the question text with the edited version generated above.
            ILQ_miniReportRecap.innerHTML = 'Question ' + (questionIndex + 1) + ': ' + qCopy;
            //Append ILQ_miniReportRecap to ILQ_miniReport
            ILQ_miniReport.appendChild(ILQ_miniReportRecap);
        }
        //For all the other types of questions
        else {
            //Set ILQ_miniReportRecap to the question's text.
            ILQ_miniReportRecap.innerHTML = 'Question ' + (questionIndex + 1) + ': ' + InlineQuizApp.QuizData.Questions[questionIndex].questionText;
            //Append to ILQ_miniReport
            ILQ_miniReport.appendChild(ILQ_miniReportRecap);
        }
        InlineQuizApp.BuildResponseText(ILQ_miniReportContent, questionIndex);
    }
    //If we don't want to include the question, start with a blank cont.
    else {
        cont += '';
    }
    //If there's more than one correct answer, add an S to the end of answer.
    if (crta.length > 1) {
        //cont += '<p class="ILQ_miniReportHeader" ><strong>Correct Answers:</strong> ';
    } else {
        //cont += '<p class="ILQ_miniReportHeader" ><strong>Correct Answer:</strong> ';
    }
    //If the question's type is Fill In The Blank or Math...
    if (
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Fill In The Blank' ||
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Math'
    ) {
        //Fill qCopy with the question's text.
        qCopy = InlineQuizApp.QuizData.Questions[questionIndex].questionText;
        //Iterate through that question's answer array.
        for (i = 1; i <= InlineQuizApp.QuizData.Questions[questionIndex].answers.length; i++) {
            //Generate span.ILQ_ReferenceHightlight and fill it with an answer's text.
            blankField =
                "<span class='ILQ_ReferenceHighlight'>" + InlineQuizApp.QuizData.Questions[questionIndex].answers[i - 1].answerText + '</span>';
            //Replace the word BLANK1, BLANK2, etc with the span containing the correct answer.
            qWithoutBlank = qCopy.replace('BLANK' + i, blankField);
            //Reassign qCopy with the version with (only one) BLANK replaced with the answer.
            qCopy = qWithoutBlank;
            //Keep doing this until there are no more blanks.
        }
        //Append qCopy to cont.
        cont += qCopy;
    }
    //For all other question types.
    else {
        for (i = crta.length - 1; i >= 0; i--) {
            //If there's only 1 answer (or it's the last answer), add no comma.
            if (i === 0) {
                //cont += crta[i];
            }
            //Otherwise, append a comma.
            else {
                //cont += crta[i] + ', ';
            }
        }
    }
    //Close the p tag.
    cont += '</p>';
    //If the question's type is Fill In The Blank or Math....
    if (
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Fill In The Blank' ||
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Math'
    ) {
        //Open new p.ILQ_miniReportHeader tag and fill it with strong tag
        //cont += '<p class="ILQ_miniReportHeader"><strong>You answered: </strong>';
        //Variable to track rather answer is right or wrong
        answer = '';
        //Assign the current question's text to qCopy
        //qCopy = InlineQuizApp.QuizData.Questions[questionIndex].questionText;
        //Iterate through the ANSWERED version of the question.
        for (i = 0; i < InlineQuizApp.savedText[questionIndex].length; i++) {
            //Check to see if the answered version matches the correct version.
            if (InlineQuizApp.savedText[questionIndex][i] === InlineQuizApp.QuizData.Questions[questionIndex].answers[i].answerText) {
                //Set answer to right
                answer = 'right';
                //Add a check mark after a correct answer.
                $('#blank' + (i + 1)).after("<span class='check_box'></span>");
                //If feedback was supplied for this question, push it to the feedBackArr.
                if (
                    InlineQuizApp.QuizData.Questions[questionIndex].answers[i].feedBack !== undefined &&
                    InlineQuizApp.QuizData.Questions[questionIndex].answers[i].feedBack !== null &&
                    InlineQuizApp.QuizData.Questions[questionIndex].answers[i].feedBack !== 'none' &&
                    InlineQuizApp.QuizData.Questions[questionIndex].answers[i].feedBack !== ''
                ) {
                    feedBackArr.push(InlineQuizApp.QuizData.Questions[questionIndex].answers[i].feedBack);
                }
            } else {
                //If it doesn't match, set answer to wrong.
                answer = 'wrong';
                //Add an X after an incorrect answer.
                $('#blank' + (i + 1)).after("<span class='x_box'></span>");
            }
            //Now we're going to check to see if the answer matches any of the alternative answers.
            //If there is an altAnswers array...
            if (InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers) {
                //Iterate through the answer's altAnswers array. i = current answer, j = current altAnswer.
                for (j = 0; j < InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers.length; j++) {
                    //If the answered array matches the corresponding answer's altAnswers
                    if (
                        InlineQuizApp.savedText[questionIndex][i] ===
                        InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].answerText
                    ) {
                        //Set answer to altRight (*TRIGGERED*)
                        answer = 'altRight';
                        //And if there's any specific feedback for this specific altAnswer, push its feedback.
                        if (
                            InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].feedBack !== undefined &&
                            InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].feedBack !== null &&
                            InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].feedBack !== 'none' &&
                            InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].feedBack !== ''
                        ) {
                            feedBackArr.push(InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].feedBack);
                        }
                    }
                }
            }
            //Switch to see determine which type of feedback to display.
            switch (answer) {
                //If it's right, use ILQ_RightHightlight class.
                case 'right':
                    blankField = "<span class='ILQ_RightHighlight'>" + InlineQuizApp.savedText[questionIndex][i] + '</span>';
                    altResponse = '';
                    break;
                //If it's altRight, use ILQ_SimilarHightlight class, and construct message to show user main correct answer.
                case 'altRight':
                    blankField = "<span class='ILQ_SimilarHighlight'>" + InlineQuizApp.savedText[questionIndex][i] + '</span>';
                    altResponse =
                        "Instead of <span class='ILQ_ReferenceHighlight'>" +
                        InlineQuizApp.savedText[questionIndex][i] +
                        "</span> you could have answered <span class='ILQ_ReferenceHighlight'>" +
                        InlineQuizApp.QuizData.Questions[questionIndex].answers[i].answerText +
                        '</span>.<br>';
                    break;
                //If the questions is wrong (or anything other than right or altRight really), use the ILQ_WrongHightlight class.
                default:
                    blankField = "<span class='ILQ_WrongHighlight'>" + InlineQuizApp.savedText[questionIndex][i] + '</span>';
                    altResponse = '';
                    break;
            }
            //Replace the corresponding blank with the answered text (now with the correct styling to the blank)
            qWithoutBlank = qCopy.replace('BLANK' + (i + 1), blankField);
            //Replace with qCopy with newer version (will iterate through until all blanks are replaced)
            qCopy = qWithoutBlank;
            //Append the altResponse message generated in switch above to feedBack string.
            feedBack += altResponse;
        }
        //Log out the feedBackArr array. Not sure why, it's seems to be always empty at this point.
        console.log(feedBackArr);
        //Iterate through feedBackArr array
        for (i = 0; i <= feedBackArr.length - 1; i++) {
            //Append each item in feedBackArr array to feedBack string.
            feedBack += feedBackArr[i] + '<br>';
        }
        //Append the constructed HTML string qCopy to cont string.
        //cont += qCopy;
    }
    //For non Fill In The Blank questions
    else {
        //Open new p.ILQ_miniReportHeader tag and fill it with strong tag.
        //cont += '<p class="ILQ_miniReportHeader"><strong>You selected: </strong>';
        //If there's nothing in the chosen answers array.
        if (ca.length === 0) {
            //Set cont to 'None'.
            //cont += 'None';
        }
        //If there IS something in chosen answers array
        else {
            //Iterate through the chosen answers array and append them to cont.
            for (i = 0; i < ca.length; i++) {
                if (i === 0) {
                    //If there's only 1 answer (or it's the last answer), add no comma.
                    //cont += aa[ca[i]].answerText;
                } else {
                    //Otherwise, append comma
                    //cont += aa[ca[i]].answerText + ', ';
                }
                //If the answer has feedback, append them to feedBack
                if (aa[ca[i]].feedBack !== void 0 && aa[ca[i]].feedBack !== 'none' && aa[ca[i]].feedBack !== null) {
                    //Checks feedBack string to see if it already contains that question's feedback.
                    if (feedBack.indexOf(aa[ca[i]].feedBack) === -1) {
                        // If it doesn't, check to see if it's the last question
                        if (i == 0) {
                            //Append that question's backback to feedBack.
                            feedBack += aa[ca[i]].feedBack;
                        }
                        //If it's not the last question, put some line breaks in there too.
                        else {
                            feedBack += '<br><br>' + aa[ca[i]].feedBack;
                        }
                    }
                }
            }
        }
    }
    //Close the p tag in both strings.
    cont += '</p>';
    feedBack += '</p>';
    //THIS IS WHERE I CAN STOP FEEDBACK FOR THIS TYPE OF QUESTION TODO
    //If feedBack string is closed without any feedback really being added.
    if (feedBack === '<p class="ILQ_miniReportHeader"><strong>Feedback: </strong></p>') {
        //Just append cont.
        ILQ_miniReportContent.innerHTML += cont;
    } else {
        //Otherwise append both cont and feedBack
        ILQ_miniReportContent.innerHTML += cont + feedBack;
    }
    //If the question is an All That Apply...
    if (InlineQuizApp.QuizData.Questions[questionIndex].questionType == 'All That Apply') {
        //Run CheckForAndBuildGeneralFeedback method (I assume this is the special case for these types of questions).
        InlineQuizApp.CheckForAndBuildGeneralFeedback(ILQ_miniReportContent, questionIndex);
    }
    //Append ILQ_miniReportContent to ILQ_miniReport.
    ILQ_miniReport.appendChild(ILQ_miniReportContent);
    //And return ILQ_miniReport.
    return ILQ_miniReport;
    InlineQuizApp.GoToTop();
};
/**
 * Function: BuildGeneralFeedback
 *
 * Builds overall feedback for an 'all that apply' type of question.
 * This feedback applies to the whole question rather than individual answers
 * that were selected.
 *
 * Parameters:
 *
 *   containerRef  - HTML DOM Element.
 *   questionIndex - Integer
 *
 */
InlineQuizApp.CheckForAndBuildGeneralFeedback = function (containerRef, questionIndex) {
    var generalFeedback = InlineQuizApp.QuizData.Questions[questionIndex].generalFeedback;
    if (generalFeedback == null || generalFeedback == 'none') {
        return false; // exit early, there's no general feedback
    }
    var heading = document.createElement('p');
    heading.className = 'ILQ_miniReportHeader';
    heading.innerHTML = '<strong>General Feedback: </strong>' + generalFeedback;
    containerRef.appendChild(heading);
};
/**
 * Builds the response to the answered question.
 *
 * @method BuildResponseText
 * @param {Object} containerRef
 * @param {Integer} questionIndex
 */
InlineQuizApp.BuildResponseText = function (containerRef, questionIndex) {
    //Creates the recap response text element and assigns a class to it. This entire class is in a header.
    var ILQ_RecapResponseText = document.createElement('h' + (InlineQuizApp.headingLevel + 3));
    ILQ_RecapResponseText.setAttribute('class', 'ILQ_RecapResponseText');
    //Creates image element for the check or X icons.
    var RespImg = document.createElement('img');
    RespImg.setAttribute('class', 'ILQ_RecapResponseGraphic');
    //Creates the element for the final line of feedback, stating what the overall score is.
    var RespCntx = document.createElement('strong');
    qScore = InlineQuizApp.getQuestionScore(questionIndex);
    maxScore = InlineQuizApp.QuizData.Questions[questionIndex].maxScoreValue;
    //If this question doesn't allow partial answers, just set the score to 0.
    if (!InlineQuizApp.QuizData.General.allowPartial && qScore < maxScore) {
        qScore = 0;
    }
    //If the question's score was greater than the max score, set the icon to a check, and return the correct answer text.
    if (qScore >= maxScore) {
        RespImg.setAttribute(
            'src',
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAaVBMVEUAAAD///8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE8AtE/Gi+VPAAAAInRSTlMAAAMGCg8VGxwkRk5bYWl4f4CIpbK6vsjJy9HT3OPk9vr9CZah7wAAAI1JREFUKM+V0ssSwiAMheF4q1Cq1Xq3SPF//4d0IXacEmY0K/KdTSZBZoWSYqBV14nuoCZ7gF3uLQCHks+nvgXguPjVNwCcMm+eAOflp210dzG69AC4rkaH6HKXG0CspY4A99Gl6gGGdgDoq69R3gmZixif3K8n46fEm2xxJgAPo5zABoJVj2Yvmf/9S17ioBIDP/nF2AAAAABJRU5ErkJggg=='
        );
        RespImg.setAttribute('alt', 'Right Answer');
        RespCntx.innerHTML = /*'Your answer was correct.'*/ 'Vous avez obtenu un score de ' + qScore + ' sur ' + maxScore + ' à cette question.';
    }
    //If the question's score is zero, set icon to X and return incorrect answer text.
    else if (qScore === 0) {
        RespImg.setAttribute(
            'src',
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAFVBMVEUAAADsAETsAETsAETsAETsAETsAESbXnh7AAAABnRSTlMAHDfN3PHYCvCAAAAAaklEQVQY02NgUBZgAANGIwYGpjBHCEckVYFBNS0FLMXolhbEYJaWBpYSSUtLBhEgKaAEUBBCwsTAFFQIIgWVgEhBJSBSMAmwFEwCIgWTQOUgK0MxANloFEuRnYPiUBQvoHgOxdsoAYIcVACPxDI1J3AY4QAAAABJRU5ErkJggg=='
        );
        RespImg.setAttribute('alt', 'Wrong Answer');
        RespCntx.innerHTML = /*'Your answer was not correct.'*/ 'Vous avez obtenu un score de ' + qScore + ' sur ' + maxScore + ' à cette question.';
    }
    //If this question's score is not 0 or at the maxScore, AND partial answers are allowed, set icon to partial icon, and return message stating score.
    else if (InlineQuizApp.QuizData.General.allowPartial) {
        RespImg.setAttribute(
            'src',
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAS1BMVEUAAADsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQDsqQAXPjsCAAAAGHRSTlMAAxAUKCktL0ZOZ2xwgoSls8PHyeLv+PsorBT5AAAAoklEQVQoz3XSSxaDIBBE0YpCjB8MqOjb/0oziCIJWsMLp4FupG+sCxFicFZ5jCfFm9O7lSxrd/jIX8Z9P0U6STJrubAaSb7gDbxkC3+3gJUr/KEZnELp6iEolq4Goi5cNaALVwX8lNpdT4j54YdrgJBdN7kmcOcDT38BNrXk9HoBn5qY+bw3UR2wtanOcrR9H9TcN3X1HKZsUPejvf8MV9/nA0HMIXW5zA5eAAAAAElFTkSuQmCC'
        );
        RespImg.setAttribute('alt', 'Partially Correct Answer');
        RespCntx.innerHTML =
            /*'Your answer was partially correct.'*/ 'Vous avez obtenu un score de ' + qScore + ' sur ' + maxScore + ' à cette question.';
    }
    //Add the icon to ILQ_RecapResponseText.
    //ILQ_RecapResponseText.appendChild(RespImg);
    //Add the final line of feedback to ILQ_RecapResponseText.
    ILQ_RecapResponseText.appendChild(RespCntx);
    //Appends generated content to whichever element this method is passed.
    containerRef.appendChild(ILQ_RecapResponseText);
};
/**
 * Sets the container to house the quiz.
 *
 * @method DefineContainer
 */
InlineQuizApp.DefineContainer = function () {
    ILQ_container = document.createElement('section');
    ILQ_container.id = 'ILQ_container';
    ILQ_container.setAttribute('role', 'InlineQuizApplication');
    if (!InlineQuizApp.QuizData.General.hideTitle) {
        InlineQuizApp.headerRef = document.createElement('section');
        InlineQuizApp.headerRef.id = 'ILQ_header';
        InlineQuizApp.headerRef.setAttribute('role', 'title');
        InlineQuizApp.headerRef.setAttribute('aria-live', 'off');

        InlineQuizApp.headerRef.innerHTML =
            '<h' + InlineQuizApp.headingLevel + '>' + InlineQuizApp.QuizData.General.QuizName + '</h' + InlineQuizApp.headingLevel + '>';
    }
    InlineQuizApp.contentRef = document.createElement('section');
    InlineQuizApp.contentRef.setAttribute('aria-atomic', 'true');
    InlineQuizApp.contentRef.setAttribute('aria-live', 'assertive');
    InlineQuizApp.contentRef.setAttribute('aria-relevant', 'all');
    InlineQuizApp.contentRef.id = 'ILQ_content';
    ILQ_container.appendChild(InlineQuizApp.contentRef);
    InlineQuizApp.containerRef.appendChild(ILQ_container);
};
/**
 * Makes a button that spans the entire quiz container based on the passed parameters.
 *
 * @method MakeFullBaseButton
 * @param {Method} onOK
 * @param {String} label
 * @param {Object} options
 * @return {Object} ILQ_FullBaseButtonContainer
 */
InlineQuizApp.MakeFullBaseButton = function (onOK, label, options) {
    if (options === void 0) {
        options = {};
    }
    var ILQ_FullBaseButtonContainer = document.createElement('button');
    if (options.id) {
        ILQ_FullBaseButtonContainer.setAttribute('id', options.id);
    }
    ILQ_FullBaseButtonContainer.setAttribute('class', 'ILQ_BaseButtonContainer FullButton');
    ILQ_FullBaseButtonContainer.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
    InlineQuizApp.tabIndexSet;
    if (!options.disabled) {
        ILQ_FullBaseButtonContainer.setAttribute('role', 'button');
        ILQ_FullBaseButtonContainer.onclick = onOK;
        ILQ_FullBaseButtonContainer.onmouseover = function () {
            $(this).addClass('over');
        };
        ILQ_FullBaseButtonContainer.onfocus = function () {
            $(this).addClass('over');
        };
        ILQ_FullBaseButtonContainer.onmousedown = function () {
            $(this).addClass('active');
        };
        ILQ_FullBaseButtonContainer.onmouseout = function () {
            $(this).removeClass('over');
        };
        ILQ_FullBaseButtonContainer.onblur = function () {
            $(this).removeClass('over');
        };
    } else {
        ILQ_FullBaseButtonContainer.setAttribute('role', 'disabled');
        $(ILQ_FullBaseButtonContainer).addClass('ILQ_BaseButtonDisabled');
    }
    ILQ_FullBaseButtonContainer.onselectstart = function () {
        return false;
    };
    ILQ_BaseButtonLabel = document.createElement('span');
    ILQ_BaseButtonLabel.setAttribute('class', 'ILQ_BaseButtonLabel');
    ILQ_BaseButtonLabel.innerHTML = "<span class='ILQ_AccessOnly'>Disabled button: </span>" + label;
    if (!options.disabled) {
        $(ILQ_BaseButtonLabel.firstChild).css('display', 'none');
        $(ILQ_BaseButtonLabel.firstChild).attr('aria-hidden', 'true');
        $(ILQ_BaseButtonLabel.parentNode).attr('role', 'disabled');
    }
    ILQ_FullBaseButtonContainer.appendChild(ILQ_BaseButtonLabel);
    ILQ_buttonSet.appendChild(ILQ_FullBaseButtonContainer);
    return ILQ_FullBaseButtonContainer;
};
/**
 * Makes a left and a right button that span the entire quiz container based on the passed parameters.
 *
 * @method MakeBaseButtonSet
 * @param {Object} leftBtnData
 * @param {Object} RightButtonData
 * @return {Object} ILQ_BaseButtonContainer
 */
InlineQuizApp.MakeBaseButtonSet = function (leftBtnData, RightButtonData) {
    var ILQ_BaseButtonContainer = document.createElement('span');
    if (leftBtnData !== null) {
        if (leftBtnData.options === void 0) {
            leftBtnData.options = {};
        }
        ILQ_LeftBaseButtonContainer = document.createElement('button');
        if (leftBtnData.options.id) {
            ILQ_LeftBaseButtonContainer.setAttribute('id', leftBtnData.options.id);
        }
        ILQ_LeftBaseButtonContainer.setAttribute('class', 'ILQ_BaseButtonContainer LeftHalfButton');
        ILQ_LeftBaseButtonContainer.setAttribute('role', 'button');
        if (!leftBtnData.options.disabled) {
            ILQ_LeftBaseButtonContainer.onclick = leftBtnData.onOK;
            ILQ_LeftBaseButtonContainer.onmouseover = function () {
                $(this).addClass('over');
            };
            ILQ_LeftBaseButtonContainer.onmouseout = function () {
                $(this).removeClass('over');
            };
            ILQ_LeftBaseButtonContainer.onmousedown = function () {
                $(this).addClass('active');
            };
            ILQ_LeftBaseButtonContainer.onfocus = function () {
                $(this).addClass('over');
            };
            ILQ_LeftBaseButtonContainer.onblur = function () {
                $(this).removeClass('over');
            };
        } else {
            $(ILQ_LeftBaseButtonContainer).addClass('ILQ_BaseButtonDisabled');
            $(ILQ_LeftBaseButtonContainer).attr('role', 'disabled');
        }
        ILQ_LeftBaseButtonContainer.onselectstart = function () {
            return false;
        };
        ILQ_BaseButtonLabel = document.createElement('span');
        ILQ_BaseButtonLabel.setAttribute('class', 'ILQ_BaseButtonLabel');
        ILQ_BaseButtonLabel.innerHTML = "<span class='ILQ_AccessOnly'>Disabled button: </span>" + leftBtnData.label;
        if (!leftBtnData.options.disabled) {
            $(ILQ_BaseButtonLabel.firstChild).css('display', 'none');
            $(ILQ_BaseButtonLabel.firstChild).attr('aria-hidden', 'true');
        }
        ILQ_LeftBaseButtonContainer.appendChild(ILQ_BaseButtonLabel);
        ILQ_BaseButtonContainer.appendChild(ILQ_LeftBaseButtonContainer);
    } else {
        ILQ_LeftBaseButtonContainer = document.createElement('div');
        ILQ_LeftBaseButtonContainer.setAttribute('class', 'ILQ_BaseButtonContainer LeftHalfButton hidden');
        ILQ_BaseButtonContainer.appendChild(ILQ_LeftBaseButtonContainer);
    }
    if (RightButtonData !== null) {
        if (RightButtonData.options === void 0) {
            RightButtonData.options = {};
        }
        ILQ_RightBaseButtonContainer = document.createElement('button');
        ILQ_RightBaseButtonContainer.setAttribute('role', 'button');
        if (RightButtonData.options.id) {
            ILQ_RightBaseButtonContainer.setAttribute('id', RightButtonData.options.id);
        }
        ILQ_RightBaseButtonContainer.setAttribute('class', 'ILQ_BaseButtonContainer RightHalfButton');
        if (!RightButtonData.options.disabled) {
            ILQ_RightBaseButtonContainer.onclick = RightButtonData.onOK;
            ILQ_RightBaseButtonContainer.onmouseover = function () {
                $(this).addClass('over');
            };
            ILQ_RightBaseButtonContainer.onmouseout = function () {
                $(this).removeClass('over');
            };
            ILQ_RightBaseButtonContainer.onmousedown = function () {
                $(this).addClass('active');
            };
            ILQ_RightBaseButtonContainer.onfocus = function () {
                $(this).addClass('over');
            };
            ILQ_RightBaseButtonContainer.onblur = function () {
                $(this).removeClass('over');
            };
        } else {
            $(ILQ_RightBaseButtonContainer).addClass('ILQ_BaseButtonDisabled');
            $(ILQ_RightBaseButtonContainer).attr('role', 'disabled');
        }
        ILQ_RightBaseButtonContainer.onselectstart = function () {
            return false;
        };
        ILQ_BaseButtonLabel = document.createElement('span');
        ILQ_BaseButtonLabel.setAttribute('class', 'ILQ_BaseButtonLabel');
        ILQ_BaseButtonLabel.innerHTML = "<span class='ILQ_AccessOnly'>Disabled button: </span>" + RightButtonData.label;
        if (!RightButtonData.options.disabled) {
            $(ILQ_BaseButtonLabel.firstChild).css('display', 'none');
            $(ILQ_BaseButtonLabel.firstChild).attr('aria-hidden', 'true');
        }
        ILQ_RightBaseButtonContainer.appendChild(ILQ_BaseButtonLabel);
        ILQ_BaseButtonContainer.appendChild(ILQ_RightBaseButtonContainer);
    } else {
        ILQ_RightBaseButtonContainer = document.createElement('button');
        ILQ_RightBaseButtonContainer.setAttribute('class', 'ILQ_BaseButtonContainer RightHalfButton hidden');
        ILQ_BaseButtonContainer.appendChild(ILQ_RightBaseButtonContainer);
    }
    ILQ_LeftBaseButtonContainer.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
    InlineQuizApp.tabIndexSet;
    ILQ_RightBaseButtonContainer.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
    InlineQuizApp.tabIndexSet;
    return ILQ_BaseButtonContainer;
};
/**
 * Makes a generic button based on the parameters.
 *
 * @method MakeGenericButton
 * @param {Method} onOK
 * @param {String} label
 * @param {Object} options
 * @return {Object} ILQ_GenericButtonContainer
 */
InlineQuizApp.MakeGenericButton = function (onOK, label, options) {
    if (options === void 0) {
        options = {};
    }
    var ILQ_GenericButtonContainer = document.createElement('button');
    if (options.id) {
        ILQ_GenericButtonContainer.setAttribute('id', options.id);
    }
    ILQ_GenericButtonContainer.setAttribute('class', 'ILQ_GenericButtonContainer Generic');
    ILQ_GenericButtonContainer.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
    InlineQuizApp.tabIndexSet;
    ILQ_GenericButtonContainer.setAttribute('role', 'button');
    if (!options.disabled) {
        ILQ_GenericButtonContainer.onclick = onOK;
        ILQ_GenericButtonContainer.onmouseover = function () {
            $(this).addClass('over');
        };
        ILQ_GenericButtonContainer.onmouseout = function () {
            $(this).removeClass('over');
        };
        ILQ_GenericButtonContainer.onmousedown = function () {
            $(this).addClass('active');
        };
        ILQ_GenericButtonContainer.onfocus = function () {
            $(this).addClass('over');
        };
        ILQ_GenericButtonContainer.onblur = function () {
            $(this).removeClass('over');
        };
    } else {
        $(ILQ_GenericButtonContainer).addClass('ILQ_GenericButtonDisabled');
    }
    ILQ_GenericButtonContainer.onselectstart = function () {
        return false;
    };
    var ILQ_GenericLabel = document.createElement('span');
    ILQ_GenericLabel.setAttribute('class', 'ILQ_GenericLabel');
    ILQ_GenericLabel.innerHTML = "<span class='ILQ_AccessOnly'>Disabled button: </span>" + label;
    if (!options.disabled) {
        $(ILQ_GenericLabel.firstChild).css('display', 'none');
        $(ILQ_GenericLabel.firstChild).attr('aria-hidden', 'true');
    }
    ILQ_GenericButtonContainer.appendChild(ILQ_GenericLabel);
    return ILQ_GenericButtonContainer;
};
/**
 * Takes the passed object data and embeds it based on type.
 *
 * @method EmbedMedia
 * @param {String} containerRef
 * @param {Object} mediaData
 */
InlineQuizApp.EmbedMedia = function (containerRef, mediaData) {
    var mediaDomObj = document.createElement('div');
    var mediaDomContent, mediaDomLink;
    mediaDomObj.setAttribute('class', 'ILQ_Media');
    if (mediaData.mediaLink === void 0 || mediaData.mediaLink === null) {
        mediaData.mediaLink = 'none';
    }
    if (mediaData.width === void 0 || mediaData.width === null || mediaData.width === 'none') {
        mediaData.width = 'none';
    } else if (mediaData.width.constructor === String) {
        mediaData.width = parseInt(mediaData.width);
    }
    if (mediaData.height === void 0 || mediaData.height === null || mediaData.height === 'none') {
        mediaData.height = 'none';
    } else if (mediaData.height.constructor === String) {
        mediaData.height = parseInt(mediaData.height);
    }
    switch (mediaData.type) {
        case 'link':
            mediaDomContent = document.createElement('a');
            mediaDomContent.setAttribute('class', 'ILQ_MediaLink');
            mediaDomContent.setAttribute('href', mediaData.src);
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
            InlineQuizApp.tabIndexSet;
            if (mediaData.description) {
                mediaDomContent.innerHTML = mediaData.description;
            } else {
                mediaDomContent.innerHTML = 'Link';
            }
            mediaDomObj.appendChild(mediaDomContent);
            break;
        case 'image':
            if (mediaData.mediaLink !== 'none') {
                mediaDomLink = document.createElement('a');
                mediaDomLink.setAttribute('class', 'ILQ_MediaImage');
                mediaDomLink.setAttribute('href', mediaData.mediaLink);
                mediaDomLink.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
                InlineQuizApp.tabIndexSet;
                mediaDomLink.setAttribute('target', '_blank');
            }
            mediaDomContent = document.createElement('img');
            if (mediaData.mediaLink === 'none') {
                mediaDomContent.setAttribute('class', 'ILQ_MediaImage');
            }
            mediaDomContent.setAttribute('src', mediaData.src);
            if (mediaData.width !== 'none') {
                mediaDomContent.setAttribute('width', mediaData.width);
            }
            if (mediaData.height !== 'none') {
                mediaDomContent.setAttribute('height', mediaData.height);
            }
            mediaDomObj.setAttribute('style', 'text-align:center;');
            if (mediaData.description) {
                mediaDomContent.setAttribute('alt', mediaData.description);
            }
            if (mediaData.mediaLink === 'none') {
                mediaDomObj.appendChild(mediaDomContent);
            } else {
                mediaDomLink.appendChild(mediaDomContent);
                mediaDomObj.appendChild(mediaDomLink);
            }
            break;
        case 'YouTubeVideo':
            validSrc = InlineQuizApp.validateYouTubeLink(mediaData.src);
            if (validSrc) {
                mediaDomContent = document.createElement('iframe');
                mediaDomContent.setAttribute('class', 'ILQ_MediaEmbeddedVideo');
                if (mediaData.width !== 'none') {
                    mediaDomContent.setAttribute('width', mediaData.width);
                } else {
                    mediaDomContent.setAttribute('width', '420');
                }
                if (mediaData.height !== 'none') {
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
            }
            break;
        case 'text':
            mediaDomContent = document.createElement('p');
            mediaDomContent.setAttribute('class', 'ILQ_MediaText');
            mediaDomContent.setAttribute('target', '_blank');
            mediaDomContent.innerHTML = mediaData.content;
            mediaDomObj.appendChild(mediaDomContent);
            break;
        default:
            d2log('Warning! Unknown media type requested, ignoring embed request.');
    }
    containerRef.appendChild(mediaDomObj);
};
/**
 * Takes a string and checks if it's a valid YouTube link.
 *
 * @method validateYouTubeLink
 * @param {String} src
 * @return {Boolean|String} Functioning YouTube link or False
 */
InlineQuizApp.validateYouTubeLink = function (src) {
    if (src.indexOf('www.youtube.com') !== -1) {
        if (src.indexOf('</iframe>') === -1) {
            if (src.indexOf('watch?v=') !== -1) {
                code = src.slice(src.indexOf('?v=') + 3);
                return 'https://www.youtube.com/embed/' + code;
            } else {
                d2log('Provided link was not proper YouTubeVideo link.');
                return false;
            }
        } else {
            // They grabbed the embed code
            if (src.indexOf('https://www.youtube.com/embed/') !== -1) {
                return link.slice(link.indexOf('src') + 5, link.indexOf('"', link.indexOf('src') + 5));
            } else {
                d2log('Provided link was not proper YouTubeVideo link.');
                return false;
            }
        }
    } else {
        d2log('Provided link was not a YouTubeVideo link.');
        return false;
    }
};
/**
 * Builds a text slide for the quiz.
 *
 * @method SetTextSlide
 * @param {Object} data
 * @param {Method} onOK
 * @param {Object} options
 */
InlineQuizApp.SetTextSlide = function (data, onOK, options) {
    InlineQuizApp.tabIndexSet = 0;
    if (options === void 0) {
        options = {};
    }
    if (options.buttonLabel === void 0 || options.buttonLabel.constructor !== String) {
        options.buttonLabel = "Démarrer l'activité";
    }
    InlineQuizApp.contentRef.innerHTML = '';
    var ILQ_Description = document.createElement('div');
    ILQ_Description.setAttribute('class', 'ILQ_Description');
    if (options.addClass !== void 0 && options.addClass !== null && options.addClass !== 'none') {
        ILQ_Description.setAttribute('class', 'ILQ_Description ' + options.addClass);
    } else {
        ILQ_Description.setAttribute('class', 'ILQ_Description');
    }
    if (InlineQuizApp.isHint === true) {
        ILQ_Description.innerHTML =
            '<h' +
            (InlineQuizApp.headingLevel + 1) +
            ' class="ILQ_hintHeader">Question ' +
            (InlineQuizApp.currentQuestion + 1) +
            ' Hint: ' +
            '</h' +
            (InlineQuizApp.headingLevel + 1) +
            '><p>' +
            data +
            '</p>';
    } else {
        ILQ_Description.innerHTML = data;
    }
    if (options.mediaData !== null && options.mediaData !== undefined && options.mediaData !== 'none' && options.mediaData !== '') {
        var ILQ_MediaContainer = document.createElement('div');
        ILQ_MediaContainer.setAttribute('class', 'ILQ_MediaContainer');
        for (i = 0; i < options.mediaData.length; i++) {
            InlineQuizApp.EmbedMedia(ILQ_MediaContainer, options.mediaData[i]);
        }
        ILQ_Description.appendChild(ILQ_MediaContainer);
    }
    ILQ_buttonSet = document.createElement('div');
    ILQ_buttonSet.id = 'ILQ_buttonSet';
    var browserName = navigator.appName;
    if (browserName === 'Microsoft Internet Explorer' || browserName === 'Netscape') {
        InlineQuizApp.headerRef.innerHTML =
            '<h' + InlineQuizApp.headingLevel + '>' + InlineQuizApp.QuizData.General.QuizName + '</h' + InlineQuizApp.headingLevel + '>';
    }
    if (InlineQuizApp.headerAnimated === false) {
        $(InlineQuizApp.headerRef).hide().appendTo(InlineQuizApp.contentRef).slideDown(500, 'swing');
        InlineQuizApp.headerAnimated = true;
    } else {
        InlineQuizApp.contentRef.appendChild(InlineQuizApp.headerRef);
    }
    $(ILQ_Description).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    $(ILQ_buttonSet).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    if (onOK !== void 0 && onOK !== 'none') {
        ILQ_buttonSet.appendChild(InlineQuizApp.MakeFullBaseButton(onOK, options.buttonLabel));
    } else {
        ILQ_Description.setAttribute('style', 'border-radius:7px');
    }
    // if ($('.d2l-page-title', window.parent.document).length > 0) {
    //    $('body', window.parent.document).animate({
    //       scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    //    }, 1000);
    // }
};
/**
 * Builds a question slide for the quiz.
 *
 * @method setQuestionSlide
 * @param {Object} data
 * @param {Object} options
 */
InlineQuizApp.setQuestionSlide = function (data, options) {
    var hintBtn;
    InlineQuizApp.tabIndexSet = 0;
    if (options === void 0) {
        options = {};
    }
    switch (data.questionType) {
        case 'Multiple Choice':
            ILQ_container.setAttribute('class', 'mc');
            break;
        case 'Fill In The Blank':
            ILQ_container.setAttribute('class', 'fb');
            break;
        case 'All That Apply':
            ILQ_container.setAttribute('class', 'aa');
            break;
        case 'Math':
            ILQ_container.setAttribute('class', 'ma');
            break;
    }
    ILQ_container.setAttribute('class', ILQ_container.getAttribute('class') + ' ' + InlineQuizApp.QuizData.General.feedBackType);
    if (options.buttonLabel === void 0 || options.buttonLabel.constructor !== String) {
        if (InlineQuizApp.QuizData.General.feedBackType === 'continuous') {
            options.buttonLabel = 'Vérifier la/les réponse(s)';
        } else {
            options.buttonLabel = 'Continuer';
        }
    }
    InlineQuizApp.contentRef.innerHTML = '';
    var browserName = navigator.appName;
    if (browserName === 'Microsoft Internet Explorer' || browserName === 'Netscape') {
        InlineQuizApp.headerRef.innerHTML =
            '<h' + InlineQuizApp.headingLevel + '>' + InlineQuizApp.QuizData.General.QuizName + '</h' + InlineQuizApp.headingLevel + '>';
    }
    if (InlineQuizApp.headerAnimated === false) {
        $(InlineQuizApp.headerRef).hide().appendTo(InlineQuizApp.contentRef).slideDown(750, 'swing');
        InlineQuizApp.headerAnimated = true;
    } else {
        InlineQuizApp.contentRef.appendChild(InlineQuizApp.headerRef);
    }
    if (InlineQuizApp.QuizData.General.instructions !== 'none') {
        ILQ_instructionText = document.createElement('p');
        ILQ_instructionText.setAttribute('class', 'ILQ_instructionText');
        ILQ_instructionText.innerHTML = InlineQuizApp.QuizData.General.instructions;
        $(ILQ_instructionText).hide().appendTo(InlineQuizApp.contentRef).fadeIn(750);
        //InlineQuizApp.contentRef.appendChild(ILQ_instructionText);
    }
    var ILQ_questionHeader = document.createElement('h' + (InlineQuizApp.headingLevel + 1));
    if (!InlineQuizApp.QuizData.General.hideTitle) {
        ILQ_questionHeader.setAttribute('class', 'ILQ_questionHeader');
    } else {
        ILQ_questionHeader.setAttribute('class', 'ILQ_questionHeader ILQ_CompressedHeader');
    }
    qt = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionTitle;
    if (qt) {
        ILQ_questionHeader.innerHTML = qt;
    } else {
        /*ADDED ALL THIS*/
        ILQ_preInstructions = document.createElement('p');
        ILQ_preInstructions.setAttribute('class', 'ILQ_preInstructionsText');
        ILQ_preInstructions.innerHTML =
            "Choisissez la ou les réponses les plus appropriées pour la question ci-dessous. Les types de questions peuvent inclure : vrai/faux, choix multiples, sélectionnez tout ce qui s'applique et remplissez les blancs. Pour les utilisateurs de clavier, utilisez le bouton de tabulation pour parcourir les options. Les cases à cocher et les boutons peuvent être enfoncés à l'aide de l'espace ou de la touche Entrée.<hr>";
        $(ILQ_preInstructions).hide().appendTo(InlineQuizApp.contentRef).fadeIn(750);
        /*END ADDED*/
        ILQ_questionHeader.innerHTML = 'Question ' + (InlineQuizApp.currentQuestion + 1) + '/' + InlineQuizApp.QuizData.General.showQuestions + ': ';
    }
    var ILQ_questionText = document.createElement('p');
    ILQ_questionText.setAttribute('class', 'ILQ_questionText');
    if (data.questionType === 'Fill In The Blank') {
        InlineQuizApp.inputText = [];
        InlineQuizApp.textInterval = setInterval(InlineQuizApp.HandleTextInput, 1000);
        qCopy = data.questionText;
        for (i = 1; i <= data.answers.length; i++) {
            blankField =
                "<label for='blank'" +
                i +
                " class='blankLabel'>BLANK" +
                i +
                "</label><input type='text' placeholder='BLANK' class='blank' id='blank" +
                i +
                "' tabindex='" +
                InlineQuizApp.tabIndexSet +
                "' spellcheck='true' autocorrect='on' aria-required='true' required/>";
            qWithoutBlank = qCopy.replace('BLANK' + i, blankField);
            ILQ_questionText.innerHTML =
                '<em>Fill in the blank(s) with the correct answer. Answers may be more than one word. Answers are not case sensitive.</em><br><br>' +
                qWithoutBlank; //Added standard instructions
            qCopy = qWithoutBlank;
            InlineQuizApp.tabIndexSet;
        }
    } else if (data.questionType === 'Math') {
        InlineQuizApp.inputText = [];
        InlineQuizApp.textInterval = setInterval(InlineQuizApp.HandleTextInput, 1000);
        qCopy = data.questionText;
        for (i = 1; i <= data.answers.length; i++) {
            blankField =
                "<label for='blank'" +
                i +
                " class='blankLabel'>BLANK" +
                i +
                "</label><input type='text' placeholder='#' class='number' id='number" +
                i +
                "' tabindex='" +
                InlineQuizApp.tabIndexSet +
                "' spellcheck='true' autocorrect='on' aria-required='true' required/>";
            qWithoutBlank = qCopy.replace('BLANK' + i, blankField);
            ILQ_questionText.innerHTML = '<em>Fill in the blank(s) with the correct answer.</em><br><br>' + qWithoutBlank;
            qCopy = qWithoutBlank;
            InlineQuizApp.tabIndexSet;
        }
    } else if (data.questionType === 'Multiple Choice') {
        /* added */
        ILQ_questionText.innerHTML = data.questionText + '<br><em>Choisissez la réponse la plus appropriée.</em>';
    } else if (data.questionType === 'All That Apply') {
        ILQ_questionText.innerHTML = data.questionText + "<br><em>Sélectionnez tout ce qui s'y rapporte.</em>";
    } else {
        /* end */
        ILQ_questionText.innerHTML = data.questionText + '<br><em>Choisissez la réponse la plus appropriée.</em>'; // ILQ_questionText.innerHTML = data.questionText;
    }
    var clearDiv = document.createElement('div');
    clearDiv.setAttribute('style', 'clear:both;');
    InlineQuizApp.contentRef.appendChild(clearDiv);
    var ILQ_quizField = document.createElement('div');
    if (data.questionType === 'All That Apply') {
        ILQ_quizField.setAttribute('class', 'ILQ_quizField ATA_quizField');
    } else {
        ILQ_quizField.setAttribute('class', 'ILQ_quizField');
    }
    if (data.questionType === 'Multiple Choice' || data.questionType === 'All That Apply') {
        ILQ_quizField.setAttribute('role', 'radiogroup');
    } else {
        ILQ_quizField.setAttribute('role', 'textbox');
    }
    if (data.questionType !== 'Fill In The Blank' && data.questionType !== 'Math') {
        for (i = 0; i < data.answers.length; i++) {
            var slot = document.createElement('div');
            slot.id = 'AnswerSlot_' + i;
            slot.setAttribute('class', 'ILQ_AnswerSlot');
            slot.setAttribute('tabindex', InlineQuizApp.tabIndexSet);
            InlineQuizApp.tabIndexSet;
            if (data.questionType === 'Multiple Choice') {
                slot.setAttribute('role', 'radio');
            } else {
                slot.setAttribute('role', 'checkbox');
            }
            slot.setAttribute('aria-checked', 'false');
            slot.onclick = InlineQuizApp.HandleAnswerSelection;
            slot.onmouseover = function () {
                $(this).addClass('over');
            };
            slot.onmouseout = function () {
                $(this).removeClass('over');
                $(this).removeClass('down');
            };
            slot.onmousedown = function () {
                $(this).addClass('down');
                $(this).removeClass('over');
            };
            slot.onmouseup = function () {
                $(this).addClass('over');
                $(this).removeClass('down');
            };
            slot.onkeypress = function (e) {
                if (e.keyCode === 13 || e.keyCode === 32) {
                    InlineQuizApp.HandleAnswerSelection(e);
                }
            };
            slot.onfocus = function () {
                $(this).addClass('over');
            };
            slot.onblur = function () {
                $(this).removeClass('over');
            };
            slot.onselectstart = function () {
                return false;
            };
            var impCont = document.createElement('div');
            if (data.questionType === 'Multiple Choice') {
                impCont.setAttribute('class', 'ILQ_impCont ILQ_radio');
            } else if (data.questionType === 'All That Apply') {
                impCont.setAttribute('class', 'ILQ_impCont ILQ_check');
            }
            slot.appendChild(impCont);
            var label = document.createElement('div');
            label.setAttribute('class', 'ILQ_answerLabel');
            label.innerHTML = "<span class='ILQ_AccessOnly'>Disabled Answer Slot: </span>" + data.answers[i].answerText;
            $(label.firstChild).css('display', 'none');
            $(label.firstChild).attr('aria-hidden', 'true');
            slot.appendChild(label);
            ILQ_quizField.appendChild(slot);
        }
    }
    ILQ_buttonSet = document.createElement('div');
    ILQ_buttonSet.id = 'ILQ_buttonSet';
    $(ILQ_questionHeader).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    $(ILQ_questionText).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    $(ILQ_quizField).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    $(ILQ_buttonSet).hide().appendTo(InlineQuizApp.contentRef).fadeIn(500);
    //InlineQuizApp.contentRef.appendChild(ILQ_questionHeader);
    //InlineQuizApp.contentRef.appendChild(ILQ_questionText);
    //InlineQuizApp.contentRef.appendChild(ILQ_quizField);
    //InlineQuizApp.contentRef.appendChild(ILQ_buttonSet);
    if (InlineQuizApp.QuizData.General.showHints && data.hintText !== 'none') {
        hintBtn = InlineQuizApp.MakeGenericButton(
            function () {
                InlineQuizApp.ShowHint();
                InlineQuizApp.GoToTop();
            },
            'Hint',
            {
                id: 'ILQ_HintButton',
            }
        );
        ILQ_buttonSet.appendChild(hintBtn);
    }
    if (InlineQuizApp.QuizData.General.allowPrevious) {
        if (
            InlineQuizApp.currentQuestion < 1 &&
            InlineQuizApp.QuizData.General.preQuizText === 'none' &&
            InlineQuizApp.QuizData.General.preQuizMedia === 'none'
        ) {
            ILQ_buttonSet.appendChild(
                InlineQuizApp.MakeFullBaseButton(InlineQuizApp.RequestNextQuestion, options.buttonLabel, {
                    disabled: !InlineQuizApp.QuizData.General.allowNone,
                    id: 'ILQ_quizNextBtn',
                })
            );
        } else {
            leftBtnData = {
                onOK: InlineQuizApp.goPreviousQuestion,
                label: 'Précédent',
                options: {
                    disabled:
                        InlineQuizApp.currentQuestion < 1 &&
                        InlineQuizApp.QuizData.General.preQuizText === 'none' &&
                        InlineQuizApp.QuizData.General.preQuizMedia === 'none',
                    id: 'ILQ_quizPreviousBtn',
                },
            };
            ILQ_buttonSet.appendChild(
                InlineQuizApp.MakeBaseButtonSet(leftBtnData, {
                    onOK: InlineQuizApp.RequestNextQuestion,
                    label: options.buttonLabel,
                    options: {
                        disabled: !InlineQuizApp.QuizData.General.allowNone,
                        id: 'ILQ_quizNextBtn',
                    },
                })
            );
        }
    } else {
        ILQ_buttonSet.appendChild(
            InlineQuizApp.MakeFullBaseButton(InlineQuizApp.RequestNextQuestion, options.buttonLabel, {
                disabled: !InlineQuizApp.QuizData.General.allowNone,
                id: 'ILQ_quizNextBtn',
            })
        );
    }
    if ($('#ILQ_quizNextBtn').attr('role') === 'disabled') {
        $('#ILQ_quizNextBtn').hide();
    }
    // if ($('.d2l-page-title', window.parent.document).length > 0) {
    //    $('body', window.parent.document).animate({
    //       scrollTop: $('.d2l-page-title', window.parent.document).offset().top
    //    }, 1000);
    // }
};
/**
 * Displays hint on a new slide if one is provided for the question.
 *
 * @method ShowHint
 */
InlineQuizApp.ShowHint = function () {
    clearInterval(InlineQuizApp.textInterval);
    InlineQuizApp.isHint = true;
    InlineQuizApp.SetTextSlide(
        InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].hintText,
        function () {
            InlineQuizApp.GoNextQuestion();
            InlineQuizApp.RepopulateQuestion();
            InlineQuizApp.isHint = false;
        },
        {
            mediaData: InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].hintMedia,
            buttonLabel: 'Continuer',
        }
    );
    InlineQuizApp.GoToTop();
};
/**
 * Repopulates any quiz fields after opening a hint and returning to the question.
 *
 * @method RepopulateQuestion
 */
InlineQuizApp.RepopulateQuestion = function () {
    if (
        InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply' ||
        InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Multiple Choice'
    ) {
        for (i = 0; i < InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers.length; i++) {
            temp = document.getElementById('AnswerSlot_' + InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers[i]);
            temp.setAttribute('aria-checked', 'true');
            $(temp.firstChild).addClass('selected');
            InlineQuizApp.HandleAnswerSelection('repop');
        }
    } else if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Fill In The Blank') {
        for (i = 0; i < InlineQuizApp.savedText[InlineQuizApp.currentQuestion].length; i++) {
            document.getElementById('blank' + (i + 1)).value = InlineQuizApp.savedText[InlineQuizApp.currentQuestion][i];
        }
    } else if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Math') {
        for (i = 0; i < InlineQuizApp.savedText[InlineQuizApp.currentQuestion].length; i++) {
            document.getElementById('number' + (i + 1)).value = InlineQuizApp.savedText[InlineQuizApp.currentQuestion][i];
        }
    }
};
/**
 * Handles the event when an answer is selected.
 *
 * @method HandleAnswerSelection
 * @param {Object} e
 */
InlineQuizApp.HandleAnswerSelection = function (e) {
    if (e === 'repop') {
        if (!InlineQuizApp.QuizData.General.allowNone) {
            if (
                InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply' ||
                InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Multiple Choice'
            ) {
                if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers.length === 0) {
                    $('#ILQ_quizNextBtn').addClass('ILQ_BaseButtonDisabled');
                    $('#ILQ_quizNextBtn').attr('role', 'disabled');
                    $('#ILQ_quizNextBtn').fadeOut(250);
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'inline');
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'false');
                    $('#ILQ_quizNextBtn')[0].onclick = void 0;
                    $('#ILQ_quizNextBtn')[0].onmouseover = void 0;
                    $('#ILQ_quizNextBtn')[0].onmouseout = void 0;
                    $('#ILQ_quizNextBtn')[0].onfocus = void 0;
                    $('#ILQ_quizNextBtn')[0].onblur = void 0;
                    $('#ILQ_quizNextBtn')[0].onkeypress = void 0;
                } else {
                    $('#ILQ_quizNextBtn').removeClass('ILQ_BaseButtonDisabled');
                    $('#ILQ_quizNextBtn').attr('role', 'button');
                    $('#ILQ_quizNextBtn').removeAttr('disabled');
                    $('#ILQ_quizNextBtn').fadeIn(500);
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'none');
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'true');
                    $('#ILQ_quizNextBtn')[0].onclick = InlineQuizApp.RequestNextQuestion;
                    $('#ILQ_quizNextBtn')[0].onmouseover = function () {
                        $(this).addClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onmouseout = function () {
                        $(this).removeClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onfocus = function () {
                        $(this).addClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onblur = function () {
                        $(this).removeClass('over');
                    };
                }
            }
        }
    } else {
        selectedSlot = e.target;
        if (selectedSlot.className.indexOf('ILQ_AnswerSlot') === -1) {
            selectedSlot = selectedSlot.parentNode;
            // This allows for wrapping of the answer text inside of tags
            if (selectedSlot.className.indexOf('ILQ_AnswerSlot') === -1) {
                selectedSlot = selectedSlot.parentNode;
            }
        }
        impContainer = selectedSlot.firstChild;
        if (InlineQuizApp.HasClass(impContainer, 'ILQ_check')) {
            if (InlineQuizApp.HasClass(impContainer, 'selected')) {
                $(impContainer).removeClass('selected');
                $(impContainer)[0].parentElement.setAttribute('aria-checked', 'false');
            } else {
                $(impContainer).addClass('selected');
                $(impContainer)[0].parentElement.setAttribute('aria-checked', 'true');
            }
        } else {
            if (!InlineQuizApp.HasClass(impContainer, 'selected')) {
                if ($('.selected').length !== 0) {
                    $('.selected').parent().attr('aria-checked', 'false');
                    $('.selected').removeClass('selected');
                }
                $(impContainer).addClass('selected');
                $(impContainer)[0].parentElement.setAttribute('aria-checked', 'true');
            }
        }
        InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers = [];
        $('.selected').each(function (e) {
            idx = parseInt($('.selected')[e].parentElement.id.replace('AnswerSlot_', 0));
            InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers.push(idx);
        });
        if (!InlineQuizApp.QuizData.General.allowNone) {
            if (
                InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply' ||
                InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Multiple Choice'
            ) {
                if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers.length === 0) {
                    $('#ILQ_quizNextBtn').addClass('ILQ_BaseButtonDisabled');
                    $('#ILQ_quizNextBtn').attr('role', 'disabled');
                    $('#ILQ_quizNextBtn').fadeOut(250);
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'inline');
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'false');
                    $('#ILQ_quizNextBtn')[0].onclick = void 0;
                    $('#ILQ_quizNextBtn')[0].onmouseover = void 0;
                    $('#ILQ_quizNextBtn')[0].onmouseout = void 0;
                    $('#ILQ_quizNextBtn')[0].onfocus = void 0;
                    $('#ILQ_quizNextBtn')[0].onblur = void 0;
                    $('#ILQ_quizNextBtn')[0].onkeypress = void 0;
                } else {
                    $('#ILQ_quizNextBtn').removeClass('ILQ_BaseButtonDisabled');
                    $('#ILQ_quizNextBtn').attr('role', 'button');
                    $('#ILQ_quizNextBtn').removeAttr('disabled');
                    $('#ILQ_quizNextBtn').fadeIn(500);
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'none');
                    $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'true');
                    $('#ILQ_quizNextBtn')[0].onclick = InlineQuizApp.RequestNextQuestion;
                    $('#ILQ_quizNextBtn')[0].onmouseover = function () {
                        $(this).addClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onmouseout = function () {
                        $(this).removeClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onfocus = function () {
                        $(this).addClass('over');
                    };
                    $('#ILQ_quizNextBtn')[0].onblur = function () {
                        $(this).removeClass('over');
                    };
                }
            }
        }
    }
};
/**
 * Handles when a text input has text entered into it so it enables the check answer button.
 *
 * @method HandleTextInput
 */
InlineQuizApp.HandleTextInput = function () {
    InlineQuizApp.saveTextInput();
    blankCount = 0;
    if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Fill In The Blank') {
        for (i = 1; i <= InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length; i++) {
            blankText = document.getElementById('blank' + i).value;
            if (blankText !== '') {
                blankCount++;
            }
        }
    } else if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Math') {
        $('input').keydown(function (e) {
            // Allow: backspace, delete, tab, escape, enter and .
            if (
                $.inArray(e.keyCode, [46, 8, 9, 27, 13, 40, 45, 61, 109, 110, 173, 189, 190]) !== -1 ||
                // Allow: Ctrl+A
                (e.keyCode === 65 && e.ctrlKey === true) ||
                // Allow: Ctrl+C
                (e.keyCode === 67 && e.ctrlKey === true) ||
                // Allow: Ctrl+X
                (e.keyCode === 88 && e.ctrlKey === true) ||
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)
            ) {
                // let it happen, don't do anything
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
        for (i = 1; i <= InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length; i++) {
            blankText = document.getElementById('number' + i).value;
            if (blankText !== '') {
                blankCount++;
            }
        }
    }
    if (!InlineQuizApp.QuizData.General.allowNone) {
        if (blankCount === InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length) {
            $('#ILQ_quizNextBtn').removeClass('ILQ_BaseButtonDisabled');
            $('#ILQ_quizNextBtn').attr('role', 'button');
            $('#ILQ_quizNextBtn').removeAttr('disabled');
            $('#ILQ_quizNextBtn').fadeIn(500);
            $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'none');
            $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'true');
            $('#ILQ_quizNextBtn')[0].onclick = InlineQuizApp.RequestNextQuestion;
            $('#ILQ_quizNextBtn')[0].onmouseover = function () {
                $(this).addClass('over');
            };
            $('#ILQ_quizNextBtn')[0].onmouseout = function () {
                $(this).removeClass('over');
            };
            $('#ILQ_quizNextBtn')[0].onfocus = function () {
                $(this).addClass('over');
            };
            $('#ILQ_quizNextBtn')[0].onblur = function () {
                $(this).removeClass('over');
            };
        } else {
            $('#ILQ_quizNextBtn').addClass('ILQ_BaseButtonDisabled');
            $('#ILQ_quizNextBtn').attr('role', 'disabled');
            $('#ILQ_quizNextBtn').fadeOut(500);
            $('#ILQ_quizNextBtn .ILQ_AccessOnly').css('display', 'inline');
            $('#ILQ_quizNextBtn .ILQ_AccessOnly').attr('aria-hidden', 'false');
            $('#ILQ_quizNextBtn')[0].onclick = void 0;
            $('#ILQ_quizNextBtn')[0].onmouseover = void 0;
            $('#ILQ_quizNextBtn')[0].onmouseout = void 0;
            $('#ILQ_quizNextBtn')[0].onfocus = void 0;
            $('#ILQ_quizNextBtn')[0].onblur = void 0;
            $('#ILQ_quizNextBtn')[0].onkeypress = void 0;
        }
    }
};
/**
 * Calculates the score for the passed question number.
 *
 * @method getQuestionScore
 * @param {Integer} questionIndex
 * @return {Integer} score
 */
InlineQuizApp.getQuestionScore = function (questionIndex) {
    if (questionIndex === void 0) {
        questionIndex = InlineQuizApp.currentQuestion;
    }
    if (
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Fill In The Blank' ||
        InlineQuizApp.QuizData.Questions[questionIndex].questionType === 'Math'
    ) {
        score = 0;
        altAnswered = false;
        for (i = 0; i < InlineQuizApp.QuizData.Questions[questionIndex].answers.length; i++) {
            // If the user answer was the same as the correct answer
            if (InlineQuizApp.QuizData.Questions[questionIndex].answers[i].answerText === InlineQuizApp.savedText[questionIndex][i]) {
                // Add the designated score value to the total question score
                score += InlineQuizApp.QuizData.Questions[questionIndex].answers[i].scoreValue;
            }
            // If the user answer wasn't the same as the correct answer
            else {
                // If the question has alternate answers
                if (InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers) {
                    for (j = 0; j < InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers.length; j++) {
                        // If the user answer is the same as an alternate answer
                        if (
                            InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].answerText ===
                            InlineQuizApp.savedText[questionIndex][i]
                        ) {
                            // Add the designated score value to the total question score
                            score += InlineQuizApp.QuizData.Questions[questionIndex].answers[i].altAnswers[j].scoreValue;
                            // Indicates that the question was answered with an alternate answer
                            altAnswered = true;
                        }
                    }
                    // If the question wasn't answered with an alternate answer
                    if (altAnswered !== true) {
                        // If wrong answers should subtract from the total question score
                        if (InlineQuizApp.QuizData.General.subtractWrong === true) {
                            // Score descreased by one
                            score--;
                        }
                    }
                }
                // If the question doesn't have alternate answers
                else {
                    // If wrong answers should subtract from the total question score
                    if (InlineQuizApp.QuizData.General.subtractWrong === true) {
                        // Score descreased by one
                        score--;
                    }
                }
            }
        }
        if (score < 0) {
            score = 0;
        }
        InlineQuizApp.inputScores.splice(questionIndex, 1, score);
        return score;
    } else {
        ca = InlineQuizApp.QuizData.Questions[questionIndex].ChosenAnswers;
        aa = InlineQuizApp.QuizData.Questions[questionIndex].answers;
        score = 0;
        if (ca.length === 0) {
            return 0;
        }
        for (i = aa.length - 1; i >= 0; i--) {
            if (aa[i].scoreValue > 0 && $.inArray(i, ca) !== -1) {
                score += aa[i].scoreValue;
            } else if (aa[i].scoreValue === 0 && $.inArray(i, ca) !== -1) {
                if (InlineQuizApp.QuizData.General.subtractWrong === true) {
                    score--;
                }
            }
        }
        if (score < 0) {
            score = 0;
        }
        return score;
    }
};
/**
 * Adds each questions score to get a total score.
 *
 * @method GetTotalScore
 * @return {Integer} score
 */
InlineQuizApp.GetTotalScore = function () {
    score = 0;
    for (k = 0; k < InlineQuizApp.QuizData.Questions.length; k++) {
        if (InlineQuizApp.QuizData.Questions[k].questionType === 'Fill In The Blank' || InlineQuizApp.QuizData.Questions[k].questionType === 'Math') {
            score += InlineQuizApp.inputScores[k];
        } else {
            score += InlineQuizApp.getQuestionScore(k);
        }
    }
    return score;
};
/**
 * Adds each questions maximum possible score to get a max score.
 *
 * @method GetMaxScore
 * @return {Interger} n
 */
InlineQuizApp.GetMaxScore = function () {
    n = 0;
    for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
        n += InlineQuizApp.QuizData.Questions[i].maxScoreValue;
    }
    return n;
};
/**
 * Disables the buttons' functionality.
 *
 * @method DisableButtons
 */
InlineQuizApp.DisableButtons = function () {
    $('.ILQ_BaseButtonContainer').addClass('ILQ_BaseButtonDisabled');
    $('.ILQ_BaseButtonContainer').attr('role', 'disabled');
    // $('.ILQ_BaseButtonContainer').hide(500);
    $('.ILQ_BaseButtonContainer .ILQ_AccessOnly').css('display', 'inline');
    $('.ILQ_BaseButtonContainer .ILQ_AccessOnly').attr('aria-hidden', 'false');
    $('.ILQ_BaseButtonContainer').prop('onclick', null);
    $('.ILQ_BaseButtonContainer').prop('onmouseover', null);
    $('.ILQ_BaseButtonContainer').prop('onmousedown', null);
    $('.ILQ_BaseButtonContainer').prop('onmouseup', null);
    $('.ILQ_BaseButtonContainer').prop('onfocus', null);
    $('.ILQ_BaseButtonContainer').prop('onblur', null);
    $('.ILQ_BaseButtonContainer').prop('onkeypress', null);
    $('.ILQ_quizField').attr('role', 'disabled');
    // $('.ILQ_quizField').hide(500);
    $('.ILQ_AnswerSlot').prop('onclick', null);
    $('.ILQ_AnswerSlot').prop('onmouseover', null);
    $('.ILQ_AnswerSlot').prop('onmousedown', null);
    $('.ILQ_AnswerSlot').prop('onmouseup', null);
    $('.ILQ_AnswerSlot').prop('onfocus', null);
    $('.ILQ_AnswerSlot').prop('onblur', null);
    $('.ILQ_AnswerSlot').prop('onkeypress', null);
    $('.ILQ_AnswerSlot').attr('role', 'disabled');
    $('.ILQ_AnswerSlot .ILQ_AccessOnly').css('display', 'inline');
    $('.ILQ_AnswerSlot .ILQ_AccessOnly').attr('aria-hidden', 'false');
    $('#ILQ_HintButton').addClass('ILQ_BaseButtonDisabled');
    $('#ILQ_HintButton').attr('role', 'disabled');
    // $('#ILQ_HintButton').hide(500);
    $('#ILQ_HintButton .ILQ_AccessOnly').css('display', 'inline');
    $('#ILQ_HintButton .ILQ_AccessOnly').attr('aria-hidden', 'false');
    $('#ILQ_HintButton').prop('onclick', null);
    $('#ILQ_HintButton').prop('onmouseover', null);
    $('#ILQ_HintButton').prop('onmousedown', null);
    $('#ILQ_HintButton').prop('onmouseup', null);
    $('#ILQ_HintButton').prop('onfocus', null);
    $('#ILQ_HintButton').prop('onblur', null);
    $('#ILQ_HintButton').prop('onkeypress', null);
};
/**
 * Saves text from input fields.
 *
 * @method saveTextInput
 */
InlineQuizApp.saveTextInput = function () {
    InlineQuizApp.inputText = [];
    if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Fill In The Blank') {
        for (i = 1; i <= InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length; i++) {
            qAnswer = document.getElementById('blank' + i).value;
            qAnswer = qAnswer.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            capAnswer = qAnswer.toUpperCase();
            capAnswer = capAnswer.trim();
            InlineQuizApp.inputText.push(capAnswer);
        }
        InlineQuizApp.savedText.splice(InlineQuizApp.currentQuestion, 1, InlineQuizApp.inputText);
    } else if (InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Math') {
        for (i = 1; i <= InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length; i++) {
            qAnswer = document.getElementById('number' + i).value;
            numAnswer = qAnswer.toString();
            numAnswer = numAnswer.trim();
            InlineQuizApp.inputText.push(numAnswer);
        }
        InlineQuizApp.savedText.splice(InlineQuizApp.currentQuestion, 1, InlineQuizApp.inputText);
    }
};
/**
 * Assesses and generates the feedback to be displayed in the response text.
 *
 * @method AssessFeedback
 */
InlineQuizApp.AssessFeedback = function () {
    InlineQuizApp.saveTextInput();
    qScore = InlineQuizApp.getQuestionScore();
    maxScore = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].maxScoreValue;
    if (!InlineQuizApp.QuizData.General.allowPartial && qScore < maxScore) {
        qScore = 0;
    }
    if (document.getElementById('ILQ_ContinuousResponseCont') === null) {
        ILQ_ContinuousResponseCont = document.createElement('div');
        ILQ_ContinuousResponseCont.setAttribute('id', 'ILQ_ContinuousResponseCont');
    } else {
        ILQ_ContinuousResponseCont = document.getElementById('ILQ_ContinuousResponseCont');
        ILQ_ContinuousResponseCont.innerHTML = '';
    }
    var ILQ_ContinuousResponseHeader = document.createElement('h' + (InlineQuizApp.headingLevel + 1));
    ILQ_ContinuousResponseHeader.setAttribute('id', 'ILQ_ContinuousResponseHeader');
    ILQ_ContinuousResponseHeader.innerHTML = 'Rétroaction: ';
    var ILQ_ContinuousResponseText = document.createElement('p');
    ILQ_ContinuousResponseText.setAttribute('class', 'ILQ_ContinuousResponseText');
    if (InlineQuizApp.QuizData.General.forceCorrect === true) {
        InlineQuizApp.BuildResponseText(ILQ_ContinuousResponseText, InlineQuizApp.currentQuestion);
        if (qScore >= maxScore) {
            InlineQuizApp.DisableButtons();
            $('#ILQ_buttonSet').hide(500);
            if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions - 1) {
                btnTxt = 'Continuer';
            } else {
                if (
                    InlineQuizApp.QuizData.General.postQuizText === 'none' &&
                    InlineQuizApp.QuizData.General.postQuizMedia === 'none' &&
                    InlineQuizApp.QuizData.General.repeatOnComplete === true
                ) {
                    btnTxt = "Redémarrer l'activité";
                } else {
                    btnTxt = 'Continuer';
                }
            }
            nextBtn = InlineQuizApp.MakeGenericButton(
                function () {
                    if (btnTxt === "Redémarrer l'activité") {
                        if (InlineQuizApp.QuizData.General.randomize) {
                            InlineQuizApp.QuizData.Questions = InlineQuizApp.shuffle(InlineQuizApp.QuizData.Questions);
                        }
                        InlineQuizApp.currentQuestion = 0;
                        InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                        // Resets the chosen answers for all types of questions, so they can't be used to repopulate fields on restart
                        for (q = InlineQuizApp.QuizData.Questions.length - 1; q >= 0; q--) {
                            InlineQuizApp.QuizData.Questions[q].QuestionID = q;
                            InlineQuizApp.QuizData.Questions[q].ChosenAnswers = [];
                        }
                        InlineQuizApp.savedText = [];
                        for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
                            InlineQuizApp.savedText.push(0);
                        }
                        InlineQuizApp.GoNextQuestion();
                    } else {
                        InlineQuizApp.currentQuestion++;
                        if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions) {
                            InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                        }
                        InlineQuizApp.GoNextQuestion();
                    }
                },
                btnTxt,
                {
                    id: 'ILQ_NextButton',
                }
            );
            ILQ_ContinuousResponseCont.appendChild(nextBtn);
        }
        ILQ_ContinuousResponseCont.appendChild(ILQ_ContinuousResponseHeader);
        ILQ_ContinuousResponseCont.appendChild(ILQ_ContinuousResponseText);
    } else {
        InlineQuizApp.DisableButtons();
        $('#ILQ_buttonSet').hide(500);
        ca = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].ChosenAnswers;
        aa = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers;
        if (
            InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply' ||
            InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'Multiple Choice'
        ) {
            for (z = 0; z < InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers.length; z++) {
                if (
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers[z].scoreValue === 'none' ||
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers[z].scoreValue === null ||
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers[z].scoreValue === undefined ||
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers[z].scoreValue === ''
                ) {
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].answers[z].scoreValue = 0;
                }
            }
        }
        //This is where I'll change the classes for the feedback.
        for (var i = aa.length - 1; i >= 0; i--) {
            if (aa[i].scoreValue >= maxScore) {
                if ($('#AnswerSlot_' + i).find('div.selected').length !== 0) {
                    $('#AnswerSlot_' + i).addClass('correct');
                } else {
                    $('#AnswerSlot_' + i).addClass('arrowIncorrect');
                }
            } else if (aa[i].scoreValue !== 0 && InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply') {
                if ($('#AnswerSlot_' + i).find('div.selected').length !== 0) {
                    $('#AnswerSlot_' + i).addClass('correct');
                } else {
                    $('#AnswerSlot_' + i).addClass('arrowIncorrect');
                }
            } else if (aa[i].scoreValue === 0 || !InlineQuizApp.QuizData.General.allowPartial) {
                $('#AnswerSlot_' + i).addClass('incorrect');
            } else if (InlineQuizApp.QuizData.General.allowPartial) {
                $('#AnswerSlot_' + i).addClass('partial');
            }
            if ($.inArray(i, ca) !== -1) {
                if (aa[i].scoreValue >= maxScore) {
                    $('#AnswerSlot_' + i).addClass('correct');
                } else if (
                    aa[i].scoreValue !== 0 &&
                    InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply'
                ) {
                    $('#AnswerSlot_' + i).addClass('AnsCorrect');
                } else if (aa[i].scoreValue === 0 || !InlineQuizApp.QuizData.General.allowPartial) {
                    $('#AnswerSlot_' + i).addClass('AnsIncorrect');
                } else if (InlineQuizApp.QuizData.General.allowPartial) {
                    $('#AnswerSlot_' + i).addClass('AnsPartial');
                }
            } else if (
                $.inArray(i, ca) === -1 &&
                aa[i].scoreValue !== 0 &&
                InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].questionType === 'All That Apply'
            ) {
                $('#AnswerSlot_' + i).addClass('AnsPartial');
            }
        }
        InlineQuizApp.BuildResponseText(ILQ_ContinuousResponseText, InlineQuizApp.currentQuestion);
        ILQ_ContinuousResponseText.appendChild(InlineQuizApp.GenerateMiniReport());
        ILQ_ContinuousResponseCont.appendChild(ILQ_ContinuousResponseHeader);
        ILQ_ContinuousResponseCont.appendChild(ILQ_ContinuousResponseText);
        if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions - 1) {
            btnTxt = 'Continuer';
        } else {
            if (
                InlineQuizApp.QuizData.General.postQuizText === 'none' &&
                InlineQuizApp.QuizData.General.postQuizMedia === 'none' &&
                InlineQuizApp.QuizData.General.repeatOnComplete === true
            ) {
                btnTxt = "Redémarrer l'activité";
            } else {
                btnTxt = 'Finish Activity';
            }
        }
        nextBtn = InlineQuizApp.MakeGenericButton(
            function () {
                if (btnTxt === "Redémarrer l'activité") {
                    if (InlineQuizApp.QuizData.General.randomize) {
                        InlineQuizApp.QuizData.Questions = InlineQuizApp.shuffle(InlineQuizApp.QuizData.Questions);
                    }
                    InlineQuizApp.currentQuestion = 0;
                    InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                    // Resets the chosen answers for all types of questions, so they can't be used to repopulate fields on restart
                    for (q = InlineQuizApp.QuizData.Questions.length - 1; q >= 0; q--) {
                        InlineQuizApp.QuizData.Questions[q].QuestionID = q;
                        InlineQuizApp.QuizData.Questions[q].ChosenAnswers = [];
                    }
                    InlineQuizApp.savedText = [];
                    for (i = 0; i < InlineQuizApp.QuizData.Questions.length; i++) {
                        InlineQuizApp.savedText.push(0);
                    }
                    InlineQuizApp.GoNextQuestion();
                } else {
                    InlineQuizApp.currentQuestion++;
                    if (InlineQuizApp.currentQuestion < InlineQuizApp.QuizData.General.showQuestions) {
                        InlineQuizApp.currentQuestionID = InlineQuizApp.QuizData.Questions[InlineQuizApp.currentQuestion].QuestionID;
                    }
                    InlineQuizApp.GoNextQuestion();
                }
            },
            btnTxt,
            {
                id: 'ILQ_NextButton',
            }
        );
        ILQ_ContinuousResponseCont.appendChild(nextBtn);
        var clearDiv = document.createElement('div');
        clearDiv.setAttribute('style', 'clear:both;');
        ILQ_ContinuousResponseCont.appendChild(clearDiv);
    }
    $(ILQ_ContinuousResponseCont).hide().appendTo(InlineQuizApp.contentRef).slideDown(500, 'swing');
    //InlineQuizApp.contentRef.appendChild(ILQ_ContinuousResponseCont);
};
/**
 * Go To Top of Inline Quiz Container
 *
 * @method GoToTop
 */
InlineQuizApp.GoToTop = function () {
    var scrollTargetID = InlineQuizApp.containerID;
    var scrollTarget = document.getElementById(scrollTargetID);
    var TargetID = '#' + scrollTargetID;
    var scrollToTop = scrollTarget.scrollIntoView();
    if ($('#ContentView', window.parent.document).length > 0) {
        $('html, body', window.parent.document).scrollTop($(TargetID).offset().top + $('#ContentView', window.parent.document).offset().top);
    } else {
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
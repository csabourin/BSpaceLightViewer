/* eslint-disable */
// Checks to see if there is already iatData, if not then make it
// This helps allow multiple quizzes on same page
if (!window.hasOwnProperty('iatData')) {
    iatData = {}; // jshint ignore: line
}

/*
 * Creates area for quiz to be displayed within a selected parent element.
 * This is to be used in the HTML page.
 * Data override is for if you want to load quiz data
 * with a JSON object rather than getting it from a URL.
 * This is used in the adaptive quiz creator experiment.
 */
function loadAdaptiveQuiz(quizDataUrl, parentElementId, dataOverride = null) {
    iatData[parentElementId] = {
        quizDataUrl: quizDataUrl,
        quizData: null,
        parentElement: null,
        pageElements: {
            questionArea: null,
            progressArea: null,
            heading: null,
            questionPoolName: null,
            questionHtml: null,
            buttonZone: null,
            progressBar: null,
            strikeZone: null,
            nextButton: null,
            previousButton: null,
            restartButton: null,
            showFeedbackButton: null,
            nextPageButton: null,
        },
        sessionData: {
            currentPageType: null,
            currentQuestion: null,
            currentPool: null,
            highestLevelAchieved: 0,
            highestPoolAchieved: null,
            quizEndReason: null,
            feedbackReportQuestions: [],
        },
        specialPages: {
            PRE_QUIZ: null,
            POST_QUIZ: null,
            UPGRADE_FEEDBACK: null,
            DOWNGRADE_FEEDBACK: null,
            MULTIPLE_CHOICE: null,
            MULTI_SELECT: null,
            FILL_IN_THE_BLANK: null,
            MATCHING: null,
        },
        replaceStrings: [
            '#{quizName}',
            '#{currentPool}',
            '#{upgradePool}',
            '#{downgradePool}',
            '#{numRemainingToUpgrade}',
            '#{numRemainingToDowngrade}',
            '#{endingLevel}',
            '#{highestLevelAchieved}',
        ],
        langTerms: {
            // default lang terms
            nextButton: 'Continuer',
            previousButton: 'Previous',
            restartButton: "RedÃ©marrer l'activitÃ©",
            checkAnswerButton: 'VÃ©rifier ma rÃ©ponse',
            showFeedbackButton: 'Afficher mes rÃ©ponses',
            hintButton: '<span class="icon hint" aria-label="Toggle Hint"></span>',
            nextPageButton: 'Page suivante',
            strikeZoneText: 'You have #{numRemainingToDowngrade} remaining before going to the lower level.',
            progressBarText: 'You have #{numRemainingToUpgrade} remaining before progressing to the next level.',
        },
    };

    iatData[parentElementId].parentElement = document.getElementById(parentElementId);
    iatData[parentElementId].parentElement.classList.add('aiq');

    // After DOM content is loaded, load the quiz
    const callback = function () {
        loadQuizData(
            quizDataUrl,
            parentElementId,
            function () {
                loadLanguageData(parentElementId, function () {
                    initializeQuiz(parentElementId);
                });
            },
            dataOverride
        );
    };

    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Get quiz JSON data file and then run the given callback function
loadQuizData = function (quizDataUrl, parentElementId, callback, dataOverride = null) {
    if (dataOverride !== null) {
        // Use provided data to override URL. Used for Adaptive Quiz Creator.
        iatData[parentElementId].quizData = dataOverride;
        callback();
    } else {
        // Get JSON data file
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    iatData[parentElementId].quizData = JSON.parse(xhr.responseText);
                    callback();
                } else {
                    const newDiv = document.createElement('div');
                    newDiv.style = 'max-width: 100%; overflow: auto;';

                    const failureMessage = document.createElement('p');

                    failureMessage.innerHTML = 'The quiz could not be loaded because the data file could not be found.';

                    const fileMessage = document.createElement('p');
                    fileMessage.innerHTML = 'This URL to the data file is invalid: <br>' + this.responseURL;

                    newDiv.appendChild(failureMessage);
                    newDiv.appendChild(fileMessage);

                    document.getElementById(parentElementId).appendChild(newDiv);
                }
            }
        };
        xhr.open('GET', quizDataUrl, true);
        xhr.send();
    }
};

// Load language terms and then run the given callback function
loadLanguageData = function (parentElementId, callback) {
    let appData = iatData[parentElementId];

    // Load data from the JSON file, if it exists, as an override
    if (appData.quizData.langTerms !== null && appData.quizData.langTerms !== undefined && appData.quizData.langTerms !== false) {
        appData.langTerms = appData.quizData.langTerms;
        callback();
    } else {
        // Load defaults from language folder
        const lang = document.documentElement.lang;
        const langDataUrl = 'lang/' + lang + '.txt';
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    // Use data file
                    appData.langTerms = JSON.parse(xhr.responseText);
                    callback();
                } else {
                    // Just continue to use defaults that are within this JS file.
                    callback();
                }
            }
        };
        xhr.open('GET', langDataUrl, true);
        xhr.send();
    }
};

// Initializes staging area and first page of quiz
function initializeQuiz(parentElementId) {
    let appData = iatData[parentElementId];

    // Automatically give ids to each property in an object
    appData.giveIds = function (obj) {
        let i = 0;
        for (let prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                obj[prop] = i;
                i++;
            }
        }
    };

    appData.createHintBoxElem = function () {
        const hintBox = document.createElement('div');
        hintBox.classList.add('hint-box');
        hintBox.id = 'hint-box';
        hintBox.setAttribute('role', 'region');
        hintBox.setAttribute('aria-live', 'polite');

        hintBox.show = function () {
            this.classList.remove('hidden');
            this.removeAttribute('aria-hidden');
        };

        hintBox.hide = function () {
            this.classList.add('hidden');
            this.setAttribute('aria-hidden', 'true');
        };

        hintBox.toggle = function () {
            if (this.classList.contains('hidden')) {
                this.show();
            } else {
                this.hide();
            }
        };

        hintBox.setContent = function (innerHTML) {
            this.innerHTML = innerHTML;
        };

        appData.pageElements.hintBox = hintBox;

        return hintBox;
    };

    appData.createProgressBarElem = function (overall = false) {
        const progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('progress-bar-container');

        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar');
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-live', 'assertive');
        progressBar.overall = overall;
        //progressBar.setAttribute("aria-valuenow", "0");
        //progressBar.setAttribute("aria-valuemax", "0");

        appData.pageElements.progressBar = progressBar;

        progressBar.setValue = function (value) {
            this.setAttribute('aria-valuenow', value);
            progressBar.setAttribute('aria-valuetext', appData.applyReplaceStrings(appData.langTerms.progressBarText));
            let newWidth = (value / parseFloat(this.getAttribute('aria-valuemax'))) * 100;
            if (newWidth < 1) {
                newWidth = 1;
            }
            progressBar.style = 'width: ' + newWidth + '%;';
        };

        progressBar.setMaxValue = function (maxValue) {
            if (maxValue !== parseFloat(progressBar.getAttribute('aria-valuemax'))) {
                this.setAttribute('aria-valuemax', maxValue);
                const newWidth = (parseFloat(this.getAttribute('aria-valuenow')) / maxValue) * 100;
                progressBar.style = 'width: ' + newWidth + '%;';
            }
        };

        progressBarContainer.appendChild(progressBar);

        return progressBarContainer;
    };

    appData.createStrikesElem = function (overall) {
        const strikeZone = document.createElement('div');
        strikeZone.classList.add('strikes');

        strikeZone.setAttribute('role', 'progressbar');
        strikeZone.setAttribute('aria-valuemin', '0');
        strikeZone.overall = overall;

        appData.pageElements.strikeZone = strikeZone;

        strikeZone.setValue = function (value) {
            strikeZone.setAttribute('aria-valuenow', value);
            strikeZone.setAttribute('aria-valuetext', appData.applyReplaceStrings(appData.langTerms.strikeZoneText));
            const strikes = strikeZone.querySelectorAll('.strike');
            for (let i = 0; i < strikes.length; i++) {
                if (i < value) {
                    strikes[i].classList.remove('faded');
                } else {
                    strikes[i].classList.add('faded');
                }
            }
        };

        strikeZone.setMaxValue = function (value) {
            strikeZone.setAttribute('aria-valuemax', value);
            strikeZone.innerHTML = '';

            let newStrike;
            for (let i = 0; i < value; i++) {
                newStrike = document.createElement('span');
                newStrike.classList = 'icon strike faded';
                newStrike.setAttribute('aria-hidden', 'true');
                strikeZone.appendChild(newStrike);
            }
        };

        return strikeZone;
    };

    // Replace strings in text with other strings...
    appData.applyReplaceStrings = function (text) {
        let newText = '';
        if (text !== false) {
            let regex;
            newText = text;
            for (let i = 0; i < this.replaceStrings.length; i++) {
                regex = new RegExp(this.replaceStrings[i], 'g');
                if (newText.indexOf(this.replaceStrings[i]) >= 0) {
                    newText = newText.replace(regex, this.getReplaceString(this.replaceStrings[i]));
                }
            }
        }
        return newText;
    };

    appData.getReplaceString = function (replaceString) {
        let replacementText;

        switch (replaceString) {
            case '#{currentPool}':
                replacementText = this.sessionData.currentPool.poolName;
                break;

            case '#{upgradePool}':
                let upgradePool = this.getQuestionPoolById(this.sessionData.currentPool.upgradePoolId);
                if (upgradePool !== false) {
                    replacementText = upgradePool.poolName;
                } else {
                    replacementText = 'N/A';
                }
                break;

            case '#{downgradePool}':
                let downgradePool = this.getQuestionPoolById(this.sessionData.currentPool.downgradePoolId);
                if (downgradePool !== false) {
                    replacementText = downgradePool.poolName;
                } else {
                    replacementText = 'N/A';
                }
                break;

            case '#{numRemainingToUpgrade}':
                replacementText = '{numRemainingToUpgrade}';
                if (this.hasProperty(this.sessionData.currentPool.numWrongBeforeDowngrade)) {
                    replacementText = this.sessionData.currentPool.numRightBeforeUpgrade - this.sessionData.currentPool.correctlyAnswered.length;
                }
                break;

            case '#{numRemainingToDowngrade}':
                replacementText = '{numRemainingToDowngrade}';
                if (this.hasProperty(this.sessionData.currentPool.numWrongBeforeDowngrade)) {
                    replacementText = this.sessionData.currentPool.numWrongBeforeDowngrade - this.sessionData.currentPool.incorrectlyAnswered.length;
                }
                break;

            case '#{quizName}':
                replacementText = '{quizName}';
                if (this.hasProperty(this.pageElements.heading)) {
                    replacementText = this.pageElements.heading.innerHTML;
                }
                break;

            case '#{endingLevel}':
                replacementText = '{endingLevel}';
                if (this.hasProperty(this.sessionData.lastPool.poolName)) {
                    replacementText = this.sessionData.lastPool.poolName;
                }
                break;

            case '#{highestLevelAchieved}':
                if (this.hasProperty(this.sessionData.highestPoolAchieved)) {
                    replacementText = this.sessionData.highestPoolAchieved;
                } else {
                    replacementText = this.sessionData.lastPool.poolName;
                }
                break;
        }
        return replacementText;
    };

    appData.loadFirstPage = function () {
        let quizData = this.quizData;
        let pageElements = this.pageElements;
        let endConditions = quizData.endConditions;
        let sessionData = this.sessionData;

        if (quizData.quizHeading) {
            pageElements.heading = this.appendHtml(quizData.quizHeading, this.parentElement, 'heading');
        }
        this.createProgressArea();
        this.createQuestionArea();

        pageElements.nextButton = this.createButton(
            function () {
                iatData[parentElementId].openNextPage(parentElementId);
            },
            appData.langTerms.nextButton,
            pageElements.questionArea.id
        );

        //pageElements.previousButton = createButton(openPreviousPage, appData.langTerms.previousButton);
        pageElements.restartButton = this.createButton(
            function () {
                iatData[parentElementId].restartQuiz(iatData[parentElementId].quizDataUrl, parentElementId);
            },
            appData.langTerms.restartButton,
            pageElements.questionArea.id
        );

        pageElements.checkAnswerButton = this.createButton(
            function (e) {
                iatData[parentElementId].checkAnswer(e.target);
            },
            appData.langTerms.checkAnswerButton,
            pageElements.questionArea.id
        );

        pageElements.showFeedbackButton = this.createButton(
            function () {
                iatData[parentElementId].generateFeedbackReportElem();
            },
            appData.langTerms.showFeedbackButton,
            pageElements.questionArea.id
        );

        pageElements.showFeedbackButton.disable = function () {
            pageElements.showFeedbackButton.classList.add('disabled');
            pageElements.showFeedbackButton.setAttribute('aria-disabled', 'true');
            pageElements.showFeedbackButton.removeAttribute('tabindex');
            pageElements.showFeedbackButton.onclick = null;
        };

        pageElements.nextPageButton = this.createButton(
            function () {
                iatData[parentElementId].clickNextPageArrow();
            },
            appData.langTerms.nextPageButton,
            pageElements.questionArea.id
        );

        pageElements.nextPageButton.disable = function () {
            pageElements.nextPageButton.classList.add('disabled');
            pageElements.nextPageButton.setAttribute('aria-disabled', 'true');
            pageElements.nextPageButton.removeAttribute('tabindex');
            pageElements.nextPageButton.onclick = null;
        };

        let hintBox = this.createHintBoxElem();
        hintBox.hide();
        pageElements.hintButton = this.createButton(
            function () {
                iatData[parentElementId].toggleHint();
            },
            appData.langTerms.hintButton,
            pageElements.hintBox.id
        );

        // Note: Using the hide/show functions puts appropriate aria attributes on
        //pageElements.previousButton.hide();
        pageElements.restartButton.hide();
        pageElements.checkAnswerButton.hide();
        pageElements.hintButton.hide();
        pageElements.showFeedbackButton.hide();
        pageElements.nextPageButton.hide();

        //pageElements.previousButton.disable();
        pageElements.checkAnswerButton.disable();
        pageElements.nextButton.disable();
        pageElements.restartButton.disable();
        pageElements.hintButton.disable();

        if (quizData.showPoolName) {
            pageElements.questionPoolName = this.createQuestionPoolNameElement(quizData.questionPools[0].poolName);
            pageElements.progressArea.sectionOne.appendChild(pageElements.questionPoolName);
        }

        if (quizData.showStrikes) {
            let useForOverallStrikes = false;
            if (
                this.hasProperty(endConditions.numQuestionsIncorrectToEnd.enabled) &&
                this.hasProperty(endConditions.numQuestionsIncorrectToEnd.useForStrikes)
            ) {
                useForOverallStrikes = true;
            }
            pageElements.progressArea.sectionTwo.appendChild(this.createStrikesElem(useForOverallStrikes));
        }

        if (quizData.showProgressBar) {
            let useForOverallProgress = false;
            if (
                this.hasProperty(endConditions.numQuestionsCorrectToEnd.enabled) &&
                this.hasProperty(endConditions.numQuestionsCorrectToEnd.useForProgressBar)
            ) {
                useForOverallProgress = true;
            }

            let newProgressBar = this.createProgressBarElem(useForOverallProgress);
            pageElements.progressArea.sectionOne.appendChild(newProgressBar);

            if (quizData.showPoolName) {
                pageElements.questionPoolName.classList.add('less-spacing');
            }
        }

        if (this.hasProperty(quizData.preQuizHtml) || this.hasVisibleEndConditions(quizData)) {
            const preQuizHtmlElem = this.generatePreQuizElem(quizData);
            pageElements.questionArea.appendChild(preQuizHtmlElem);
            sessionData.currentPageType = this.specialPages.PRE_QUIZ;
            pageElements.nextButton.enable();
            pageElements.progressArea.hide();
        } else {
            sessionData.currentQuestion = this.getFirstQuestion();
            sessionData.currentPageType = sessionData.currentQuestion.questionType;
            this.showQuestion(sessionData.currentQuestion, pageElements.questionArea);
        }

        pageElements.buttonZone = document.createElement('div');
        pageElements.buttonZone.classList.add('button-zone');

        //pageElements.buttonZone.appendChild(pageElements.previousButton);
        pageElements.buttonZone.appendChild(pageElements.nextButton);
        pageElements.buttonZone.appendChild(pageElements.checkAnswerButton);
        pageElements.buttonZone.appendChild(pageElements.restartButton);
        pageElements.buttonZone.appendChild(pageElements.hintButton);
        pageElements.buttonZone.appendChild(pageElements.showFeedbackButton);
        pageElements.buttonZone.appendChild(pageElements.nextPageButton);

        this.parentElement.appendChild(pageElements.buttonZone);
        this.parentElement.appendChild(hintBox);
    };

    appData.toggleHint = function () {
        this.pageElements.hintBox.toggle();
    };

    appData.generatePreQuizElem = function (quizData) {
        const container = document.createElement('div');
        let newDiv;

        if (this.hasProperty(quizData.preQuizHtml)) {
            newDiv = document.createElement('div');
            newDiv.innerHTML = quizData.preQuizHtml;
            container.appendChild(newDiv);
        }

        if (this.hasProperty(quizData.endConditions.preface)) {
            newDiv = document.createElement('div');
            newDiv.classList.add('end-conditions');
            newDiv.innerHTML = quizData.endConditions.preface;
            container.appendChild(newDiv);
        }

        newDiv = document.createElement('div');
        let newUl, newLi;

        if (
            this.hasProperty(quizData.endConditions.numQuestionsCorrectToEnd.enabled) &&
            this.hasProperty(quizData.endConditions.numQuestionsCorrectToEnd.preQuizText)
        ) {
            newUl = document.createElement('ul');
            newLi = document.createElement('li');
            newLi.innerHTML = quizData.endConditions.numQuestionsCorrectToEnd.preQuizText;

            newUl.appendChild(newLi);
        }

        if (
            this.hasProperty(quizData.endConditions.numQuestionsIncorrectToEnd.enabled) &&
            this.hasProperty(quizData.endConditions.numQuestionsIncorrectToEnd.preQuizText)
        ) {
            if (newUl === undefined) {
                newUl = document.createElement('ul');
            }
            newLi = document.createElement('li');
            newLi.innerHTML = quizData.endConditions.numQuestionsIncorrectToEnd.preQuizText;
            newUl.appendChild(newLi);
        }

        if (
            this.hasProperty(quizData.endConditions.noRemainingQuestionsAtCurrentPool.enabled) &&
            this.hasProperty(quizData.endConditions.noRemainingQuestionsAtCurrentPool.preQuizText)
        ) {
            if (newUl === undefined) {
                newUl = document.createElement('ul');
            }
            newLi = document.createElement('li');
            newLi.innerHTML = quizData.endConditions.noRemainingQuestionsAtCurrentPool.preQuizText;
            newUl.appendChild(newLi);
        }

        if (newUl !== undefined && newUl.hasChildNodes()) {
            newDiv.appendChild(newUl);
            container.appendChild(newDiv);
        }

        return container;
    };

    // Checks if this quiz has any visible end condition text
    // for the preQuiz page
    appData.hasVisibleEndConditions = function (quizData) {
        if (
            this.hasProperty(quizData.endConditions.numQuestionsCorrectToEnd.enabled) &&
            this.hasProperty(quizData.endConditions.numQuestionsCorrectToEnd.preQuizText)
        ) {
            return true;
        }

        if (
            this.hasProperty(quizData.endConditions.numQuestionsIncorrectToEnd.enabled) &&
            this.hasProperty(quizData.endConditions.numQuestionsIncorrectToEnd.preQuizText)
        ) {
            return true;
        }

        if (
            this.hasProperty(quizData.endConditions.noRemainingQuestionsAtCurrentPool.enabled) &&
            this.hasProperty(quizData.endConditions.noRemainingQuestionsAtCurrentPool.preQuizText)
        ) {
            return true;
        }

        return false;
    };

    // Creates a button element. Adds .show() and .hide() to the element.
    appData.createButton = function (onclick, text, ariaControls = false, extraClass = false) {
        text = this.applyReplaceStrings(text);

        const button = document.createElement('span');
        button.setAttribute('role', 'button');
        button.classList.add('btn');

        if (extraClass !== false) {
            button.classList.add(extraClass);
        }

        if (ariaControls !== false) {
            button.setAttribute('aria-controls', ariaControls);
        }

        // Updates a button's onclick and text
        button.updateButton = function (onclick, text) {
            if (text !== undefined) {
                this.innerHTML = text;
            }
            this.onclick = onclick;
            this.onkeypress = function (e) {
                if (e.keyCode === 13 || e.keyCode === 32) {
                    onclick(e);
                }
            };
        };

        // Functions to show/hide/enable/disable with appropriate aria attributes
        button.hide = function () {
            button.classList.add('hidden');
            button.setAttribute('aria-hidden', 'true');
        };

        button.show = function () {
            button.classList.remove('hidden');
            button.setAttribute('aria-hidden', 'false');
        };

        button.enable = function () {
            button.classList.remove('disabled');
            button.setAttribute('aria-disabled', 'false');
            button.tabIndex = 0;
        };

        button.disable = function () {
            button.classList.add('disabled');
            button.setAttribute('aria-disabled', 'true');
            button.removeAttribute('tabindex');
        };

        button.updateButton(onclick, text);

        return button;
    };

    // Creates area to place level, progress bar, and strikes
    appData.createProgressArea = function () {
        const progressArea = document.createElement('div');
        progressArea.classList.add('progress-area');

        if (!this.hasProperty(this.quizData.quizHeading)) {
            progressArea.classList.add('no-heading');
        }

        const sectionOne = document.createElement('span');
        sectionOne.classList.add('section-1');

        const sectionTwo = document.createElement('span');
        sectionTwo.classList.add('section-2');

        progressArea.hide = function () {
            this.setAttribute('aria-hidden', 'true');
            this.classList.add('hidden');
        };

        progressArea.show = function () {
            this.setAttribute('aria-hidden', 'false');
            this.classList.remove('hidden');
        };

        progressArea.appendChild(sectionOne);
        progressArea.appendChild(sectionTwo);

        this.pageElements.progressArea = progressArea;
        this.pageElements.progressArea.sectionOne = sectionOne;
        this.pageElements.progressArea.sectionTwo = sectionTwo;
        this.parentElement.appendChild(progressArea);
    };

    // Creates area on the HTML to stage quizzing interface
    appData.createQuestionArea = function () {
        this.pageElements.questionArea = document.createElement('div');
        this.pageElements.questionArea.classList.add('question-area');
        this.pageElements.questionArea.id = 'question-area';
        this.pageElements.questionArea.setAttribute('role', 'region');
        this.pageElements.questionArea.setAttribute('aria-live', 'assertive');
        this.parentElement.appendChild(this.pageElements.questionArea);
    };

    appData.getQuestionPoolById = function (poolId) {
        let questionPool = false;
        let questionPools = this.quizData.questionPools;

        for (let i = 0; i < questionPools.length; i++) {
            if (questionPools[i].poolId === poolId) {
                questionPool = questionPools[i];
                break;
            }
        }
        return questionPool;
    };

    // Gets first question based on randomization options
    appData.getFirstQuestion = function () {
        this.setCurrentPool(this.quizData.questionPools[0].poolId);
        return this.quizData.questionPools[0].questions.pop();
    };

    appData.randomizeOptions = function (question) {
        const optionsContainer = question.element.querySelector('.options-container');
        for (let i = optionsContainer.children.length; i >= 0; i--) {
            optionsContainer.appendChild(optionsContainer.children[(Math.random() * i) | 0]);
        }
    };

    appData.createQuestionPoolNameElement = function (poolName = '') {
        let nameElem = document.createElement('div');
        nameElem.classList.add('pool-name');
        nameElem.innerHTML = poolName;

        nameElem.show = function () {
            nameElem.classList.remove('hidden');
            nameElem.setAttribute('aria-hidden', 'false');
        };

        nameElem.hide = function () {
            nameElem.classList.add('hidden');
            nameElem.setAttribute('aria-hidden', 'true');
        };

        return nameElem;
    };

    appData.setQuestionPoolName = function (newName) {
        this.pageElements.questionPoolName.innerHTML = newName;
    };

    appData.randomizeQuestionPool = function (questionPool) {
        this.shuffle(questionPool.questions);
    };

    // shuffle array in place
    // src: https://stackoverflow.com/posts/6274381/revisions
    appData.shuffle = function (a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    appData.generateQuestionElem = function (question) {
        //const question = getQuestionById(questionId);

        // Note: Multiple choice is also true/false
        if (question.questionType === this.specialPages.MULTIPLE_CHOICE) {
            return this.createMultipleChoiceElem(question);
        }

        if (question.questionType === this.specialPages.MULTI_SELECT) {
            return this.createMultiSelectElem(question);
        }

        if (question.questionType === this.specialPages.FILL_IN_THE_BLANK) {
            return this.createFillInTheBlankElem(question);
        }

        // Note: Matching is also ordering
        if (question.questionType === this.specialPages.MATCHING) {
            return this.createMatchingElem(question);
        }
    };

    // Load quiz data
    appData.loadQuizData = function (quizDataUrl, parentElementId, callback) {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    this.quizData = JSON.parse(xhr.responseText);
                    callback();
                } else {
                    // What to do on error
                }
            }
        };
        xhr.open('GET', quizDataUrl, true);
        xhr.send();
    };

    // Augments quiz data by giving each question pool & question a unique id
    // Standardizes question type text in case where alias is used
    appData.augmentQuizData = function () {
        const questionPools = this.quizData.questionPools;
        for (let i = 0; i < questionPools.length; i++) {
            questionPools[i].id = i;

            // Note that the questions stored in these arrays
            // can be removed if repeating Q's is on, thus changing the count
            questionPools[i].correctlyAnswered = [];
            questionPools[i].incorrectlyAnswered = [];

            questionPools[i].numCorrectlyAnswered = 0;
            questionPools[i].numIncorrectlyAnswered = 0;

            // These are *overall* counts. If questions are repeated,
            // the score here does not change.
            questionPools[i].numCorrectlyAnsweredOverall = 0;
            questionPools[i].numIncorrectlyAnsweredOverall = 0;

            for (let j = 0; j < questionPools[i].questions.length; j++) {
                questionPools[i].questions[j].element = null;
                questionPools[i].questions[j].id = 'q_' + i + '_' + j;

                this.standardizeQuestionType(questionPools[i].questions[j]);
            }
        }
    };

    // Gets the name of the question pool with the given Id
    appData.getQuestionPoolName = function (poolId) {
        for (let i = 0; i < this.quizData.questionPools.length; i++) {
            if (this.quizData.questionPools[i].id === poolId) {
                return this.quizData.questionPools[i].poolName;
            }
        }
        return false;
    };

    appData.getQuestionById = function (questionId) {
        let qPools = this.quizData.questionPools;

        for (let i = 0; i < qPools.length; i++) {
            for (let j = 0; j < qPools[i].questions.length; j++) {
                if (qPools[i].questions[j].id === questionId) {
                    return qPools[i].questions[j];
                }
            }

            for (let k = 0; k < qPools[i].correctQuestions.length; k++) {
                if (qPools.correctQuestions[k].id === questionId) {
                    return qPools[i].correctQuestions[k];
                }
            }

            for (let m = 0; m < qPools[i].incorrectQuestions.length; m++) {
                if (qPools.incorrectQuestions[m].id === questionId) {
                    return qPools[i].incorrectQuestions[m];
                }
            }
        }
        return false;
    };

    // Create multiple choice question html
    appData.createMultipleChoiceElem = function (question) {
        const questionContainer = document.createElement('div');
        questionContainer.innerHTML = question.questionHtml;

        const optionsContainer = document.createElement('div');
        optionsContainer.setAttribute('role', 'radiogroup');
        optionsContainer.classList.add('options-container');

        let newOption, newRadioButton, newOptionHtml;

        var KEYCODE = {
            DOWN: 40,
            LEFT: 37,
            RIGHT: 39,
            SPACE: 32,
            UP: 38,
        };

        for (let i = 0; i < question.options.length; i++) {
            question.options[i].id = question.id + '_' + i;

            newOption = document.createElement('div');
            newOption.setAttribute('role', 'radio');
            newOption.id = question.options[i].id;
            newOption.setAttribute('aria-checked', 'false');

            newOption.addEventListener('click', clickRadioGroup);
            newOption.addEventListener('keydown', keyDownRadioGroup);
            newOption.addEventListener('focus', focusRadioButton);
            newOption.addEventListener('blur', blurRadioButton);

            newOption.disable = function () {
                this.classList.add('disabled');
                this.setAttribute('aria-disabled', 'true');
                this.removeAttribute('tabindex');
                this.onclick = null;
                this.onkeypress = null;
            };

            newOption.enable = function () {
                this.classList.remove('disabled');
                this.removeAttribute('aria-disabled');
                this.setAttribute('tabindex', '-1');
                if (i === 0) {
                    this.setAttribute('tabindex', '0');
                }

                let selectButton = function (e) {
                    const previouslySelected = e.target.closest('[role=radiogroup]').querySelectorAll('.selected');
                    for (let i = 0; i < previouslySelected.length; i++) {
                        previouslySelected[i].classList.remove('selected');
                        previouslySelected[i].setAttribute('aria-checked', 'false');
                    }
                    if (e.target.nodeName === 'SPAN') {
                        e.target.parentElement.classList.add('selected');
                        e.target.parentElement.setAttribute('aria-checked', 'true');
                    } else {
                        e.target.classList.add('selected');
                        e.target.parentElement.setAttribute('aria-checked', 'true');
                    }
                    appData.pageElements.checkAnswerButton.enable();
                };

                this.onclick = selectButton;

                this.onkeypress = function (e) {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        selectButton(e);
                    }
                };
            };

            newOption.enable();

            newRadioButton = document.createElement('span');
            newRadioButton.classList.add('selectable-button');
            newRadioButton.classList.add('radio');

            newOptionHtml = document.createElement('span');
            newOptionHtml.innerHTML = question.options[i].optionText;

            newOption.appendChild(newRadioButton);
            newOption.appendChild(newOptionHtml);

            // if (i === 0) {
            //     newOption.classList.add('selected');
            //     newOption.setAttribute('aria-checked', 'true');
            //     newOption.setAttribute('tabindex', '0');
            //     appData.pageElements.checkAnswerButton.enable();
            // }

            optionsContainer.appendChild(newOption);
        }

        /*
         * @function firstRadioButton
         *
         * @desc Returns the first radio button
         *
         * @param   {Object}  event  =  Standard W3C event object
         */

        function firstRadioButton(node) {
            var first = node.parentNode.firstChild;

            while (first) {
                if (first.nodeType === Node.ELEMENT_NODE) {
                    if (first.getAttribute('role') === 'radio') return first;
                }
                first = first.nextSibling;
            }

            return null;
        }

        /*
         * @function lastRadioButton
         *
         * @desc Returns the last radio button
         *
         * @param   {Object}  event  =  Standard W3C event object
         */

        function lastRadioButton(node) {
            var last = node.parentNode.lastChild;

            while (last) {
                if (last.nodeType === Node.ELEMENT_NODE) {
                    if (last.getAttribute('role') === 'radio') return last;
                }
                last = last.previousSibling;
            }

            return last;
        }

        /*
         * @function nextRadioButton
         *
         * @desc Returns the next radio button
         *
         * @param   {Object}  event  =  Standard W3C event object
         */

        function nextRadioButton(node) {
            var next = node.nextSibling;

            while (next) {
                if (next.nodeType === Node.ELEMENT_NODE) {
                    if (next.getAttribute('role') === 'radio') return next;
                }
                next = next.nextSibling;
            }

            return null;
        }

        /*
         * @function previousRadioButton
         *
         * @desc Returns the previous radio button
         *
         * @param   {Object}  event  =  Standard W3C event object
         */

        function previousRadioButton(node) {
            var prev = node.previousSibling;

            while (prev) {
                if (prev.nodeType === Node.ELEMENT_NODE) {
                    if (prev.getAttribute('role') === 'radio') return prev;
                }
                prev = prev.previousSibling;
            }

            return null;
        }

        /*
         * @function getImage
         *
         * @desc Gets the image for radio box
         *
         * @param   {Object}  event  =  Standard W3C event object
         */

        function getImage(node) {
            var child = node.firstChild;

            while (child) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    if (child.tagName === 'IMG') return child;
                }
                child = child.nextSibling;
            }

            return null;
        }

        /*
         * @function setRadioButton
         *
         * @desc Toogles the state of a radio button
         *
         * @param   {Object}  event  -  Standard W3C event object
         *
         */

        function setRadioButton(node, state) {
            var image = getImage(node);

            if (state == 'true') {
                node.setAttribute('aria-checked', 'true');
                node.classList.add('selected');
                node.tabIndex = 0;
                node.focus();
                appData.pageElements.checkAnswerButton.enable();
            } else {
                node.setAttribute('aria-checked', 'false');
                node.classList.remove('selected');
                node.tabIndex = -1;
            }
        }

        /*
         * @function clickRadioGroup
         *
         * @desc
         *
         * @param   {Object}  node  -  DOM node of updated group radio buttons
         */

        function clickRadioGroup(event) {
            var type = event.type;

            if (type === 'click') {
                // If either enter or space is pressed, execute the funtion

                var node = event.currentTarget;

                var radioButton = firstRadioButton(node);

                while (radioButton) {
                    setRadioButton(radioButton, 'false');
                    radioButton = nextRadioButton(radioButton);
                }

                //setRadioButton(node, 'true');
                node.setAttribute('aria-checked', 'true');
                // node.classList.add('selected');
                node.tabIndex = 0;
                // node.focus();
                // appData.pageElements.checkAnswerButton.enable();

                event.preventDefault();
                event.stopPropagation();
            }
        }

        /*
         * @function keyDownRadioGroup
         *
         * @desc
         *
         * @param   {Object}   node  -  DOM node of updated group radio buttons
         */

        function keyDownRadioGroup(event) {
            var type = event.type;
            var next = false;

            if (type === 'keydown') {
                var node = event.currentTarget;

                switch (event.keyCode) {
                    case KEYCODE.DOWN:
                    case KEYCODE.RIGHT:
                        var next = nextRadioButton(node);
                        if (!next) next = firstRadioButton(node); //if node is the last node, node cycles to first.
                        break;

                    case KEYCODE.UP:
                    case KEYCODE.LEFT:
                        next = previousRadioButton(node);
                        if (!next) next = lastRadioButton(node); //if node is the last node, node cycles to first.
                        break;

                    case KEYCODE.SPACE:
                        next = node;
                        break;
                }

                if (next) {
                    var radioButton = firstRadioButton(node);

                    while (radioButton) {
                        setRadioButton(radioButton, 'false');
                        radioButton = nextRadioButton(radioButton);
                    }

                    setRadioButton(next, 'true');

                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }

        /*
         * @function focusRadioButton
         *
         * @desc Adds focus styling to label element encapsulating standard radio button
         *
         * @param   {Object}  event  -  Standard W3C event object
         */

        function focusRadioButton(event) {
            event.currentTarget.className += ' focus';
        }

        /*
         * @function blurRadioButton
         *
         * @desc Adds focus styling to the label element encapsulating standard radio button
         *
         * @param   {Object}  event  -  Standard W3C event object
         */

        function blurRadioButton(event) {
            event.currentTarget.className = event.currentTarget.className.replace(' focus', '');
        }

        const mainContainer = document.createElement('div');
        mainContainer.appendChild(questionContainer);
        mainContainer.appendChild(optionsContainer);
        mainContainer.id = question.id;

        mainContainer.randomizeOptions = function () {
            appData.randomizeOptions(question);
        };

        return mainContainer;
    };

    appData.disableMcOptions = function (question) {
        const querySelector = '#' + question.id + ' div[role=radio]';
        const optionsToDisable = this.parentElement.querySelectorAll(querySelector);

        for (let i = 0; i < optionsToDisable.length; i++) {
            optionsToDisable[i].disable();
        }
    };

    // Select MC Option
    appData.selectMcOption = function () {
        const previouslySelected = this.closest('[role=radiogroup]').querySelectorAll('.selected');
        for (let i = 0; i < previouslySelected.length; i++) {
            previouslySelected[i].classList.remove('selected');
        }
        this.classList.add('selected');
        this.tabIndex = 0;
        this.setAttribute('aria-checked', 'true');
        this.pageElements.checkAnswerButton.enable();
    };

    // Create multi-select (all that apply) question html
    appData.createMultiSelectElem = function (question) {
        const questionContainer = document.createElement('div');
        questionContainer.innerHTML = question.questionHtml;

        const optionsContainer = document.createElement('div');
        //optionsContainer.setAttribute("aria-checked", "false");
        optionsContainer.setAttribute('role', 'checkboxgroup');
        optionsContainer.classList.add('options-container');

        let newOption, newCheckboxOption, newOptionHtml;

        for (let i = 0; i < question.options.length; i++) {
            question.options[i].id = question.id + '_' + i;

            newOption = document.createElement('div');
            newOption.setAttribute('role', 'checkbox');
            newOption.id = question.options[i].id;

            newOption.disable = function () {
                this.classList.add('disabled');
                this.setAttribute('aria-disabled', 'true');
                this.removeAttribute('tabindex');
                this.onclick = null;
                this.onkeypress = null;
            };

            newOption.enable = function () {
                this.classList.remove('disabled');
                this.removeAttribute('aria-disabled');
                this.setAttribute('tabindex', '0');

                let selectButton = function (e) {
                    let elemToToggle = e.target;
                    if (e.target.getAttribute('role') !== 'checkbox') {
                        elemToToggle = e.target.closest('[role="checkbox"]');
                    }
                    if (elemToToggle.classList.contains('selected')) {
                        elemToToggle.classList.remove('selected');
                        elemToToggle.setAttribute('aria-checked', 'false');
                    } else {
                        elemToToggle.classList.add('selected');
                        elemToToggle.setAttribute('aria-checked', 'true');
                    }
                };

                this.onclick = selectButton;

                this.onkeypress = function (e) {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                        selectButton(e);
                    }
                };
            };

            newOption.enable();

            newCheckboxOption = document.createElement('span');
            newCheckboxOption.classList.add('selectable-button');
            newCheckboxOption.classList.add('checkbox');

            newOptionHtml = document.createElement('span');
            newOptionHtml.innerHTML = question.options[i].optionText;

            newOption.appendChild(newCheckboxOption);
            newOption.appendChild(newOptionHtml);

            optionsContainer.appendChild(newOption);
        }

        const mainContainer = document.createElement('div');
        mainContainer.appendChild(questionContainer);
        mainContainer.appendChild(optionsContainer);
        mainContainer.id = question.id;

        mainContainer.randomizeOptions = function () {
            appData.randomizeOptions(question);
        };

        appData.pageElements.checkAnswerButton.enable();

        return mainContainer;
    };

    appData.disableMsOptions = function (question) {
        const querySelector = '#' + question.id + ' div[role=checkbox]';
        const optionsToDisable = this.parentElement.querySelectorAll(querySelector);

        for (let i = 0; i < optionsToDisable.length; i++) {
            optionsToDisable[i].disable();
        }
    };

    // Select MS Option
    appData.selectMsOption = function () {
        const previouslySelected = this.closest('[role=radiogroup]').querySelectorAll('.selected');
        for (let i = 0; i < previouslySelected.length; i++) {
            previouslySelected[i].classList.remove('selected');
        }
        this.classList.add('selected');
        this.pageElements.checkAnswerButton.enable();
    };

    // Create FITB question html
    appData.createFillInTheBlankElem = function (question) {
        const questionContainer = document.createElement('div');

        let blanks = question.blanks;
        let inputElemOptions = '';
        let blank, textInput, regex;
        let newHtml = question.questionHtml;

        for (let i = 0; i < blanks.length; i++) {
            blank = blanks[i];

            if (this.isNumber(blank.size)) {
                inputElemOptions += ' size="' + blank.size + '"';
            }

            if (this.isNumber(blank.maxLength)) {
                inputElemOptions += ' maxlength="' + blank.maxLength + '"';
            }

            textInput = '<input data-blank="' + blank.replaceString + '" type="text"' + inputElemOptions + '></input>';
            regex = new RegExp(blank.replaceString, 'g');

            newHtml = newHtml.replace(regex, textInput);
        }

        questionContainer.innerHTML = newHtml;

        const mainContainer = document.createElement('div');
        mainContainer.appendChild(questionContainer);
        mainContainer.id = question.id;

        const inputElem = mainContainer.querySelector('input');
        if (inputElem === null) {
            questionContainer.innerHTML =
                "Couldn't find a blank replace string in the question's data file. Make sure a replace string is defined and used.";
        } else {
            inputElem.addEventListener('input', function (e) {
                if (e.target.value.trim() !== '') {
                    appData.pageElements.checkAnswerButton.enable();
                } else {
                    appData.pageElements.checkAnswerButton.disable();
                }
            });
        }

        mainContainer.disableQuestion = function () {
            appData.disableFitb(question);
        };

        mainContainer.enableQuestion = function () {
            appData.enableFitb(question);
        };

        return mainContainer;
    };

    appData.disableFitb = function (question) {
        const querySelector = '#' + question.id + ' input[type=text]';
        const inputsToDisable = this.parentElement.querySelectorAll(querySelector);
        for (let i = 0; i < inputsToDisable.length; i++) {
            inputsToDisable[i].setAttribute('disabled', 'disabled');
            inputsToDisable[i].setAttribute('aria-disabled', 'true');
            inputsToDisable[i].classList.add('pr-30px');
        }
    };

    appData.enableFitb = function (question) {
        const querySelector = '#' + question.id + ' input[type=text]';
        const inputsToEnable = this.parentElement.querySelectorAll(querySelector);
        for (let i = 0; i < inputsToDisable.length; i++) {
            inputsToEnable[i].removeAttribute('disabled');
            inputsToEnable[i].setAttribute('aria-disabled', 'false');
            inputsToEnable[i].classList.remove('pr-30px');
        }
    };

    // Create a matching/ordering question's HTML
    // (They're the same setup)
    appData.createMatchingElem = function (question) {
        const questionContainer = document.createElement('div');
        questionContainer.classList.add('matching');

        if (this.hasProperty(question.questionHtml)) {
            questionContainer.innerHTML = question.questionHtml;
        }

        // Create comboboxes (all have same values in them)
        const newComboBox = document.createElement('select');

        let newOption = document.createElement('option');
        newOption.selected = true;
        newOption.value = 'none';
        newOption.dataset.id = 'none';
        newComboBox.appendChild(newOption);
        const newOptions = [];
        newOptions.hasOption = function (option) {
            for (let i = 0; i < newOptions.length; i++) {
                // Intentionally is ==, do not change to ===
                if (newOptions[i].value == option) {
                    //jshint ignore: line
                    return true;
                }
            }
            return false;
        };

        for (let i = 0; i < question.options.length; i++) {
            if (this.hasProperty(question.options[i].matchingText) && !newOptions.hasOption(question.options[i].matchingText)) {
                newOption = document.createElement('option');
                newOption.dataset.id = question.id + '_' + i;
                //newOption.dataset.ids = question.id + "_" + i;
                newOption.innerHTML = question.options[i].matchingText;
                newOption.value = question.options[i].matchingText;
                newOptions.push(newOption);
            } else {
                // means one of the possible options is "empty",
                // this is used to enable the check answer button in this case
                question.hasEmptyAnswers = true;
            }
        }

        newOptions
            .sort(function (a, b) {
                const aVal = a.value.toLocaleLowerCase();
                const bVal = b.value.toLocaleLowerCase();
                if (bVal > aVal) {
                    return -1;
                }
                if (aVal > bVal) {
                    return 1;
                }
                return 0;
            })
            .forEach(function (option) {
                newComboBox.appendChild(option);
            });

        // Create values with copy of combobox beside them
        let newElem, newText, boxCopy;
        for (let j = 0; j < question.options.length; j++) {
            newElem = document.createElement('div');
            newElem.id = question.id + '_' + j;

            newText = document.createElement('span');
            newText.innerHTML = question.options[j].optionText;

            boxCopy = newComboBox.cloneNode(true);
            boxCopy.setAttribute('aria-label', question.options[j].optionText);

            boxCopy.onchange = function () {
                let enableCheck = appData.checkAllComboBoxes(question);
                if (enableCheck) {
                    appData.pageElements.checkAnswerButton.enable();
                } else {
                    appData.pageElements.checkAnswerButton.disable();
                }
            };

            boxCopy.enable = function () {
                //jshint ignore: line
                this.setAttribute('aria-disabled', 'false');
                this.removeAttribute('disabled');
                this.classList.remove('disabled');
            };

            boxCopy.disable = function () {
                this.setAttribute('aria-disabled', 'true');
                this.disabled = 'disabled';
                this.classList.add('disabled');
            };

            newElem.appendChild(boxCopy);
            newElem.appendChild(newText);
            questionContainer.appendChild(newElem);
        }

        const mainContainer = document.createElement('div');
        mainContainer.appendChild(questionContainer);
        mainContainer.id = question.id;

        mainContainer.randomizeOptions = function () {
            let questionContainer = this.querySelector('.matching');
            let currOrder = questionContainer.querySelectorAll('div');

            for (let i = 0; i < currOrder.length; i++) {
                /* jshint ignore: start */
                // This single pipe '|' is intentional (int conversion)
                questionContainer.appendChild(currOrder[(Math.random() * i) | 0]);
                /* jshint ignore: end */
            }
        };

        mainContainer.disableQuestion = function () {
            const boxes = this.querySelectorAll('select');
            for (let i = 0; i < boxes.length; i++) {
                boxes[i].disable();
            }
        };

        return mainContainer;
    };

    appData.checkAllComboBoxes = function (question) {
        if (this.hasProperty(question.hasEmptyAnswers)) {
            return true;
        } else {
            // make sure comboboxes all have a selection
            const querySelector = '#' + question.id + ' select';
            const selectBoxes = this.parentElement.querySelectorAll(querySelector);

            for (let i = 0; i < selectBoxes.length; i++) {
                if (selectBoxes[i].options[selectBoxes[i].options.selectedIndex].dataset.id === 'none') {
                    return false;
                }
            }
            // All have selections
            return true;
        }
    };

    // Show question feedback
    appData.showQuestionFeedback = function (feedback, questionId) {
        const questionContainer = this.parentElement.querySelector('#' + questionId);

        const feedbackContainer = document.createElement('div');
        feedbackContainer.classList.add('feedback');

        if (this.hasProperty(this.quizData.colouredFeedback)) {
            if (feedback.score > 0) {
                feedbackContainer.classList.add('green');
            } else {
                feedbackContainer.classList.add('red');
            }
        }

        feedbackContainer.innerHTML = this.applyReplaceStrings(feedback.text);

        questionContainer.appendChild(feedbackContainer);
        const dbox = document.getElementById('dbox');
        let header = dbox.querySelectorAll('h1, h2, h3, h4, h5, h6')[0];

        if (!header) {
            header = document.getElementsByTagName('h2')[0];
            if (!header) {
                header = document.getElementsByTagName('h1')[0];
            }
        }
        header.tabIndex = -1;
        header.focus();
    };

    // Open next page
    appData.openNextPage = function (parentElementId) {
        this.clearStage();

        let currentPool = this.sessionData.currentPool;
        let nextPageQuestion = false;
        let nextPageHtml = false;
        let nextPageType = false;
        let endConditionsMet = false;

        const pageType = this.sessionData.currentPageType;

        if (pageType === this.specialPages.PRE_QUIZ) {
            nextPageQuestion = this.getFirstQuestion();
        }

        // Check if end conditions have been met
        // If they have, then it's post quiz time!
        if (this.checkEndConditions()) {
            nextPageHtml = this.applyReplaceStrings(this.quizData.postQuizHtml);
            nextPageType = this.specialPages.POST_QUIZ;
            nextPageQuestion = false;
            endConditionsMet = true;
        }

        // check if upgrading/downgrading, check if there's feedback
        let changingPools = false;
        if (!endConditionsMet && !nextPageQuestion && this.readyToUpgrade(currentPool)) {
            const poolFeedback = currentPool.feedbackOnUpgradeHtml;
            let progressAreaCopy = this.pageElements.progressArea.cloneNode(true);

            if (this.hasProperty(currentPool.upgradePoolId)) {
                if (this.sessionData.highestPoolAchieved !== null) {
                    if (currentPool.poolLevel >= this.sessionData.highestPoolAchieved.poolLevel) {
                        this.sessionData.highestPoolAchieved = currentPool;
                    }
                }
                this.sessionData.highestPoolAchieved = currentPool;
                currentPool = this.setCurrentPool(currentPool.upgradePoolId);
                if (this.hasProperty(poolFeedback)) {
                    nextPageHtml = progressAreaCopy.outerHTML + this.applyReplaceStrings(poolFeedback);
                    nextPageType = this.specialPages.UPGRADE_FEEDBACK;
                } else {
                    nextPageQuestion = this.getNextQuestion();
                }
                changingPools = true;
            } else {
                if (this.hasProperty(this.quizData.postQuizHtml)) {
                    nextPageHtml = this.applyReplaceStrings(this.quizData.postQuizHtml);
                }
                nextPageType = this.specialPages.POST_QUIZ;
                nextPageQuestion = false;
                endConditionsMet = true;
            }
        } else if (!endConditionsMet && !nextPageQuestion && this.readyToDowngrade(currentPool)) {
            const poolFeedback = currentPool.feedbackOnDowngradeHtml;
            let progressAreaCopy = this.pageElements.progressArea.cloneNode(true);

            if (this.hasProperty(currentPool.downgradePoolId)) {
                currentPool = this.setCurrentPool(currentPool.downgradePoolId);
                if (this.hasProperty(poolFeedback)) {
                    nextPageHtml = progressAreaCopy.outerHTML + this.applyReplaceStrings(poolFeedback);
                    nextPageType = this.specialPages.DOWNGRADE_FEEDBACK;
                } else {
                    nextPageQuestion = this.getNextQuestion();
                }
                changingPools = true;
            } else {
                if (this.hasProperty(this.quizData.postQuizHtml)) {
                    nextPageHtml = this.applyReplaceStrings(this.quizData.postQuizHtml);
                }
                nextPageType = this.specialPages.POST_QUIZ;
                nextPageQuestion = false;
                endConditionsMet = true;
            }
        }

        /* If the special end conditions are not met,
    we are not changing pools, and there are no
    questions, then we should check if there are any "repeat"
    question options enabled, and re-add those
    questions to the question pool. */
        if (!endConditionsMet && !nextPageQuestion && !changingPools) {
            // Repeat questions that user got correct
            if (currentPool.repeatCorrect && currentPool.questions.length === 0) {
                this.removeCalculatedFeedback(currentPool.correctlyAnswered, parentElementId);
                currentPool.questions = this.joinArrays(currentPool.questions, currentPool.correctlyAnswered);
            }

            // Repeat questions that user got wrong
            if (currentPool.repeatWrong && currentPool.questions.length === 0) {
                this.removeCalculatedFeedback(currentPool.incorrectlyAnswered, parentElementId);
                currentPool.questions = this.joinArrays(currentPool.questions, currentPool.incorrectlyAnswered);
            }

            // If nothing is to be repeated... it's end page time.
            let endIfNoQuestions = this.hasProperty(this.quizData.endConditions.noRemainingQuestionsAtCurrentPool.enabled);
            if (
                !currentPool ||
                (currentPool.questions.length === 0 && (endIfNoQuestions || (!currentPool.repeatWrong && !currentPool.repeatCorrect)))
            ) {
                nextPageType = this.specialPages.POST_QUIZ;
                nextPageHtml = this.applyReplaceStrings(this.quizData.postQuizHtml);
            } else {
                this.shuffle(currentPool.questions);
                nextPageQuestion = this.getNextQuestion();
            }
        }

        if (nextPageQuestion !== false) {
            /*if (this.hasProperty(nextPageQuestion.element)
      		&& nextPageQuestion.element.enableQuestion !== undefined) {
      	nextPageQuestion.element.enableQuestion();
      }*/
            nextPageHtml = nextPageQuestion.questionHtml;
            nextPageType = nextPageQuestion.questionType;
        }

        const nextPage = {
            question: nextPageQuestion,
            html: nextPageHtml,
            type: nextPageType,
        };

        this.openPage(nextPage);
    };

    appData.joinArrays = function (source, addition) {
        const newArray = source;

        while (addition.length > 0) {
            newArray.push(addition.pop());
        }

        return newArray;
    };

    // If there is feedback on this question, and the score matches, remove the feedback
    // If score is not provided then also remove the feedback
    appData.removeCalculatedFeedback = function (questionList, parentElementId) {
        questionList.forEach(function (question) {
            if (iatData[parentElementId].hasProperty(question.calculatedFeedback)) {
                question.calculatedFeedback = null;
                iatData[parentElementId].removeUiFeedback(question);
            }
        });
    };

    appData.openPage = function (page) {
        this.sessionData.currentQuestion = page.question;
        this.sessionData.currentPageType = page.type;
        const pageElements = this.pageElements;
        const sessionData = this.sessionData;

        if (page.question) {
            if (pageElements.progressBar !== null) {
                let newValue = sessionData.currentPool.numCorrectlyAnswered;
                if (this.hasProperty(pageElements.progressBar.overall)) {
                    newValue = this.getOverallProgress();
                }
                pageElements.progressBar.setValue(newValue);
            }

            if (pageElements.strikeZone !== null || pageElements.progressBar !== null || pageElements.questionPoolName !== null) {
                pageElements.progressArea.show();
            }
            this.showQuestion(page.question, pageElements.questionArea);
        } else {
            if (pageElements.strikeZone !== null || pageElements.progressBar !== null || pageElements.questionPoolName !== null) {
                pageElements.progressArea.hide();
            }

            if (this.hasProperty(page.html)) {
                this.appendHtml(page.html, pageElements.questionArea);
            }

            if (page.type === this.specialPages.POST_QUIZ) {
                pageElements.nextButton.hide();
                pageElements.restartButton.show();
                pageElements.restartButton.enable();

                if (this.hasProperty(this.quizData.showFeedbackReport)) {
                    pageElements.showFeedbackButton.show();
                    pageElements.showFeedbackButton.tabIndex = 0;
                }

                if (this.hasProperty(this.quizData.showNextPageButton)) {
                    pageElements.nextPageButton.show();
                }
            }
        }

        appData.triggerHeightReset();
    };

    appData.setCurrentPool = function (poolId) {
        const sessionData = this.sessionData;
        sessionData.currentPool = this.getQuestionPoolById(poolId);
        sessionData.currentPool.numCorrectlyAnswered = 0;
        sessionData.currentPool.numIncorrectlyAnswered = 0;

        // Set class for pool-specific styling purposes
        this.parentElement.setAttribute('data-pool-id', poolId);

        if (sessionData.currentPool) {
            appData.restoreQuestions(sessionData.currentPool);
        }

        if (this.isNumber(poolId)) {
            sessionData.lastPool = sessionData.currentPool;
        }

        if (this.quizData.showPoolName) {
            this.setQuestionPoolName(sessionData.currentPool.poolName);
        }

        if (this.quizData.showStrikes) {
            const strikeZone = this.pageElements.strikeZone;
            let maxVal, newVal;
            if (strikeZone.overall) {
                // use overall progress
                newVal = this.getOverallIncorrect();
                maxVal = this.quizData.endConditions.numQuestionsIncorrectToEnd.limit;
            } else {
                // use current level pool progress
                newVal = 0;
                maxVal = sessionData.currentPool.numWrongBeforeDowngrade;
            }
            strikeZone.setMaxValue(maxVal);
            strikeZone.setValue(newVal);
        }

        if (this.quizData.showProgressBar) {
            const progressBar = this.pageElements.progressBar;
            let maxVal, newVal;
            if (!this.hasProperty(progressBar.overall)) {
                // use current level pool progress
                newVal = sessionData.currentPool.numCorrectlyAnswered;
                maxVal = sessionData.currentPool.numRightBeforeUpgrade;
            } else {
                // use overall progress
                newVal = this.getOverallProgress();
                maxVal = this.quizData.endConditions.numQuestionsCorrectToEnd.limit;
            }
            progressBar.setValue(newVal);
            progressBar.setMaxValue(maxVal);
        }

        if (sessionData.currentPool.randomizeQuestionOrder) {
            this.randomizeQuestionPool(sessionData.currentPool);
        }

        return sessionData.currentPool;
    };

    appData.setNextPool = function (poolId) {
        this.sessionData.nextPool = this.getQuestionPoolById(poolId);
        return this.sessionData.nextPool;
    };

    // Check if the question pool is ready to upgrade
    appData.readyToUpgrade = function (questionPool) {
        if (this.isNumber(questionPool.numRightBeforeUpgrade) && questionPool.numCorrectlyAnswered >= questionPool.numRightBeforeUpgrade) {
            return true;
        }
        return false;
    };

    // Check if the question pool is ready to downgrade
    appData.readyToDowngrade = function (questionPool) {
        // check if pool needs to be changed first
        if (this.isNumber(questionPool.numWrongBeforeDowngrade) && questionPool.numIncorrectlyAnswered >= questionPool.numWrongBeforeDowngrade) {
            return true;
        }
        return false;
    };

    // If pool has changed, get question from next pool
    // Otherwise get question from same pool
    // Or check if end condition has been met, so show end quiz page
    appData.getNextQuestion = function () {
        let currentPool = this.sessionData.currentPool;
        let nextQuestion = false;

        if (currentPool.questions.length !== 0) {
            nextQuestion = currentPool.questions.pop();
        }

        return nextQuestion;
    };

    appData.hasProperty = function (property) {
        if (property !== null && property !== undefined && property !== false && property !== 'none') {
            return true;
        }
        return false;
    };

    // Check if something is a valid number
    appData.isNumber = function (n) {
        let numberCheck = false;
        if (Number(parseFloat(n)) === n) {
            numberCheck = true;
        }
        return numberCheck;
    };

    // Open previous question (Out of scope for MVP)
    appData.openPreviousQuestion = function () {};

    // initialize data
    appData.initializeData = function () {};

    // Restart the whole quiz
    appData.restartQuiz = function (url, parentElementId) {
        document.getElementById(parentElementId).innerHTML = '';
        window.loadAdaptiveQuiz(url, parentElementId);
    };

    // Show question
    appData.showQuestion = function (question, parentElement) {
        if (question.element === null || question.element === undefined) {
            question.element = this.generateQuestionElem(question);
        }

        if (question.randomizeOptions) {
            question.element.randomizeOptions();
        }

        if (this.hasProperty(question.hintHtml)) {
            this.pageElements.hintBox.setContent(question.hintHtml);
            this.pageElements.hintButton.show();
            this.pageElements.hintButton.enable();
        } else {
            this.pageElements.hintBox.setContent('');
            this.pageElements.hintButton.hide();
            this.pageElements.hintButton.disable();
        }

        this.pageElements.nextButton.hide();

        this.pageElements.checkAnswerButton.show();

        if (this.hasProperty(question.hasEmptyAnswers) || question.questionType === this.specialPages.MULTI_SELECT) {
            this.pageElements.checkAnswerButton.enable();
        }

        //this.pageElements.questionArea.focus({preventScroll: true});
        this.sessionData.currentQuestion = question;

        //parentElement.appendChild(this.pageElements.questionPoolName);
        parentElement.appendChild(question.element);

        const dbox = document.getElementById('dbox');
        let header = dbox.querySelectorAll('h1, h2, h3, h4, h5, h6')[0];

        if (!header) {
            header = document.getElementsByTagName('h2')[0];
            if (!header) {
                header = document.getElementsByTagName('h1')[0];
            }
        }
        header.tabIndex = -1;
        header.focus();
    };

    // Puts all questions back into the question pool
    appData.restoreQuestions = function (questionPool) {
        let question;
        while (questionPool.incorrectlyAnswered.length > 0) {
            question = questionPool.incorrectlyAnswered.pop();
            appData.removeUiFeedback(question);
            questionPool.questions.push(question);
        }

        while (questionPool.correctlyAnswered.length > 0) {
            question = questionPool.correctlyAnswered.pop();
            appData.removeUiFeedback(question);
            questionPool.questions.push(question);
        }
    };

    // Checks answer based on the user's input and question type
    appData.checkAnswer = function (target) {
        if (target.classList.contains('disabled')) {
            return false;
        }

        const question = this.sessionData.currentQuestion;

        let feedback = {
            text: '',
            score: 0,
        };

        if (question.questionType === this.specialPages.MULTIPLE_CHOICE) {
            feedback = this.checkMultipleChoiceAnswer(question);
        } else if (question.questionType === this.specialPages.MULTI_SELECT) {
            feedback = this.checkMultiSelectAnswer(question);
        } else if (question.questionType === this.specialPages.FILL_IN_THE_BLANK) {
            feedback = this.checkFillInTheBlankAnswer(question);
        } else if (question.questionType === this.specialPages.MATCHING) {
            feedback = this.checkMatchingAnswer(question);
        }

        const currentPool = this.sessionData.currentPool;
        if (feedback.score >= 1) {
            currentPool.correctlyAnswered.push(question);
            currentPool.numCorrectlyAnswered++;
            currentPool.numCorrectlyAnsweredOverall++;
        } else {
            currentPool.incorrectlyAnswered.push(question);
            currentPool.numIncorrectlyAnswered++;
            currentPool.numIncorrectlyAnsweredOverall++;
            if (this.quizData.showStrikes) {
                let newStrikeVal = currentPool.numIncorrectlyAnswered;
                if (this.pageElements.strikeZone.overall) {
                    newStrikeVal = this.getOverallIncorrect();
                }
                this.pageElements.strikeZone.setValue(newStrikeVal);
            }
        }

        // Add user's answer to report
        if (this.hasProperty(this.quizData.showFeedbackReport)) {
            this.addQuestionToReport(question, currentPool.poolName, feedback);
        }

        if (this.pageElements.progressBar !== null) {
            let newVal = this.sessionData.currentPool.numCorrectlyAnswered;
            if (this.hasProperty(this.pageElements.progressBar.overall)) {
                newVal = this.getOverallProgress();
            }
            this.pageElements.progressBar.setValue(newVal);
        }

        question.calculatedFeedback = feedback;

        this.showQuestionFeedback(feedback, question.id);

        this.disableQuestion(question);

        this.pageElements.checkAnswerButton.hide();
        this.pageElements.checkAnswerButton.disable();

        this.pageElements.nextButton.show();
        this.pageElements.nextButton.enable();
        //this.pageElements.nextButton.focus({preventScroll: true});
    };

    // Disables a question, based on its type.
    appData.disableQuestion = function (question) {
        const qTypes = this.specialPages;

        if (question.questionType === qTypes.MULTIPLE_CHOICE) {
            this.disableMcOptions(question);
        }
        if (question.questionType === qTypes.MULTI_SELECT) {
            this.disableMsOptions(question);
        }

        if (question.questionType === qTypes.FILL_IN_THE_BLANK) {
            question.element.disableQuestion();
        }

        if (question.questionType === qTypes.MATCHING) {
            question.element.disableQuestion();
        }
    };

    // Changes a given question's type into a standard term
    appData.standardizeQuestionType = function (question) {
        let questionType = question.questionType.toLowerCase();

        const mcAliases = ['multiple choice', 'mc', 'true false', 'tf'];
        if (mcAliases.includes(questionType)) {
            questionType = this.specialPages.MULTIPLE_CHOICE;
        }

        const msAliases = ['multi-select', 'ms', 'multiselect', 'all that apply', 'ata'];
        if (msAliases.includes(questionType)) {
            questionType = this.specialPages.MULTI_SELECT;
        }

        const fitbAliases = ['fill in the blank', 'fitb', 'fill'];
        if (fitbAliases.includes(questionType)) {
            questionType = this.specialPages.FILL_IN_THE_BLANK;
        }

        // Ordering is just matching numbers to text values...
        const ordAliases = ['ordering', 'ord', 'order', 'matching', 'match', 'sort', 'sorting'];
        if (ordAliases.includes(questionType)) {
            questionType = this.specialPages.MATCHING;
        }

        question.questionType = questionType;
    };

    appData.checkMultipleChoiceAnswer = function (question) {
        const userOption = this.parentElement.querySelector('#' + question.id + ' .selected');
        const feedback = {
            text: '',
            score: 0,
        };

        for (let i = 0; i < question.options.length; i++) {
            if (question.options[i].score !== undefined && question.options[i].score > 0) {
                if (userOption.id === question.options[i].id) {
                    userOption.classList.add('checkmark');
                } else {
                    userOption.classList.add('cross');
                    this.parentElement.querySelector('#' + question.options[i].id).classList.add('arrow');
                }
            }

            if (question.options[i].id === userOption.id) {
                feedback.text = question.options[i].feedback;
                feedback.score = this.hasProperty(question.options[i].score);
                if (!feedback.score) {
                    feedback.score = 0;
                }
            }
        }

        this.addFeedbackIcons();

        return feedback;
    };

    appData.checkMultiSelectAnswer = function (question) {
        let getOptionScore = function (question, optionId) {
            let optionScore = 0;
            for (let i = 0; i < question.options.length; i++) {
                if (question.options[i].id === optionId) {
                    optionScore = question.options[i].score;
                }
            }
            if (appData.isNumber(optionScore)) {
                return optionScore;
            } else {
                return 0;
            }
        };

        const checkboxes = this.parentElement.querySelectorAll('#' + question.id + ' div[role=checkbox]');

        const feedback = {
            text: '',
            score: 0,
        };

        // User score will stay 1 if they got it right
        // otherwise it changes to 0
        let userScore = 1;

        for (let i = 0; i < checkboxes.length; i++) {
            let optionScore = getOptionScore(question, checkboxes[i].id);

            if (checkboxes[i].classList.contains('selected')) {
                if (optionScore > 0) {
                    checkboxes[i].classList.add('checkmark');
                } else {
                    checkboxes[i].classList.add('cross');
                    userScore = 0;
                }
            } else {
                if (optionScore > 0) {
                    checkboxes[i].classList.add('arrow');
                    checkboxes[i].classList.add('cross');
                    userScore = 0;
                }
                /* removing checkmark against correctly not selecting to align with original Inline Quiz IAT
        else {
          checkboxes[i].classList.add("checkmark");
        }*/
            }
        }

        if (this.quizData.feedbackType.toLowerCase() !== 'report') {
            this.addFeedbackIcons();
        }

        feedback.score = userScore;
        if (userScore === 0) {
            feedback.text = question.feedbackForImperfect;
        } else {
            feedback.text = question.feedbackForPerfect;
        }

        return feedback;
    };

    appData.checkFillInTheBlankAnswer = function (question) {
        const inputs = this.parentElement.querySelectorAll('#' + question.id + ' input');
        let userInput;

        if (!question.caseSensitive) {
            for (let j = 0; j < question.blanks.length; j++) {
                for (let k = 0; k < question.blanks[j].answers.length; k++) {
                    question.blanks[j].answers[k] = question.blanks[j].answers[k].toString().toLocaleLowerCase();
                }
            }
        }

        const feedback = {
            text: question.feedbackForPerfect,
            score: 1,
        };

        let blankReplaceString, blankAnswers, matchingBlank, feedbackElem;
        for (let i = 0; i < inputs.length; i++) {
            blankReplaceString = inputs[i].getAttribute('data-blank');
            userInput = inputs[i].value;

            if (!question.caseSensitive) {
                userInput = userInput.toString().toLocaleLowerCase();
            }

            matchingBlank = question.blanks.filter((blank) => {
                return blank.replaceString === blankReplaceString;
            });

            blankAnswers = matchingBlank[0].answers;
            feedbackElem = document.createElement('span');
            feedbackElem.classList.add('abs');
            if (blankAnswers.indexOf(userInput) !== -1) {
                feedbackElem.classList.add('checkmark');
            } else {
                feedbackElem.classList.add('cross');
                feedback.score = 0;
                feedback.text = question.feedbackForImperfect;
            }
            inputs[i].insertAdjacentElement('afterend', feedbackElem);
        }

        this.addFeedbackIcons();

        return feedback;
    };

    appData.checkMatchingAnswer = function (question) {
        const feedback = {
            text: question.feedbackForPerfect,
            score: 1,
        };

        let answerToCheck, options, selectedOption, answerId, selectedOptionValue;
        for (let i = 0; i < question.options.length; i++) {
            answerId = question.id + '_' + i;
            answerToCheck = this.parentElement.querySelector('#' + answerId);
            options = answerToCheck.querySelector('select').options;
            selectedOption = options[options.selectedIndex].dataset.id;
            options[options.selectedIndex].setAttribute('selected', 'selected');
            options[options.selectedIndex].setAttribute('aria-selected', 'true');

            selectedOptionValue = options[options.selectedIndex].value;

            if (this.hasProperty(question.options[i].matchingText)) {
                //if (answerId !== selectedOption) {
                if (selectedOptionValue !== question.options[i].matchingText.toString()) {
                    feedback.score = 0;
                    feedback.text = question.feedbackForImperfect;
                    answerToCheck.classList.add('cross');
                } else {
                    answerToCheck.classList.add('checkmark');
                }
            } else {
                if (selectedOption === 'none') {
                    answerToCheck.classList.add('checkmark');
                } else {
                    answerToCheck.classList.add('cross');
                }
            }
        }

        this.addFeedbackIcons();

        return feedback;
    };

    appData.addQuestionToReport = function (question, poolName, feedback) {
        const newQuestion = JSON.parse(JSON.stringify(question));
        newQuestion.element = question.element.cloneNode(true);
        newQuestion.element.removeAttribute('id');
        newQuestion.poolName = poolName;
        newQuestion.feedback = feedback;

        const elemsToDisable = newQuestion.element.querySelectorAll('input,div[role="radio"],div[role="checkbox"],select');

        for (let i = 0; i < elemsToDisable.length; i++) {
            elemsToDisable[i].classList.add('disabled');
            elemsToDisable[i].setAttribute('aria-disabled', 'true');
            elemsToDisable[i].setAttribute('disabled', 'disabled');

            if (elemsToDisable[i].hasAttribute('data-blank')) {
                elemsToDisable[i].classList.add('pr-30px');
            }
        }

        this.sessionData.feedbackReportQuestions.push(newQuestion);
    };

    // Returns an HTML element which can be added to the DOM
    appData.generateFeedbackReportElem = function () {
        this.pageElements.showFeedbackButton.disable();

        const report = document.createElement('div');
        report.classList.add('feedback-report');

        const questions = this.sessionData.feedbackReportQuestions;

        // Get all results and display them like this:
        // Pool Name
        // Question w/ Feedback
        let poolNameElem, questionElem, feedbackTextElem;
        for (let i = 0; i < questions.length; i++) {
            if (i === 0 || questions[i].poolName !== questions[i - 1].poolName) {
                poolNameElem = document.createElement('div');
                poolNameElem.classList = 'pool-name';
                poolNameElem.innerHTML = questions[i].poolName;
                report.appendChild(poolNameElem);
            }
            questionElem = questions[i].element;
            questionElem.classList.add('question');
            report.appendChild(questionElem);
            if (this.hasProperty(questions[i].feedback)) {
                feedbackTextElem = document.createElement('div');
                feedbackTextElem.classList.add('feedback');
                feedbackTextElem.innerHTML = questions[i].feedback.text;
                report.appendChild(feedbackTextElem);
            }
        }

        this.parentElement.appendChild(report);
    };

    // Finds and clicks on the next page  arrow button.
    appData.clickNextPageArrow = function () {
        this.pageElements.nextPageButton.disable();

        // get next-arrow button by aria-label & class?
        var button = $("button.d2l-focusable[aria-label='Next activity']");
        button.trigger('click');
    };

    appData.addFeedbackIcons = function () {
        let crosses = this.parentElement.querySelectorAll('.cross');
        let checkmarks = this.parentElement.querySelectorAll('.checkmark');
        let arrows = this.parentElement.querySelectorAll('.arrow');

        let crossElem, checkmarkElem, arrowElem, i;

        for (i = 0; i < crosses.length; i++) {
            /* Original version changed to background to have icon on left to align with other IATs
      crossElem = document.createElement("span");
      crossElem.classList = "icon cross";
      crosses[i].appendChild(crossElem);*/
            crosses[i].classList.add('icon-bg-cross');
        }

        for (i = 0; i < checkmarks.length; i++) {
            /* Original version changed to background to have icon on left to align with other IATs
      checkmarkElem = document.createElement("span");
      checkmarkElem.classList = "icon checkmark";
      checkmarks[i].appendChild(checkmarkElem);*/
            checkmarks[i].classList.add('icon-bg-checkmark');
        }

        for (i = 0; i < arrows.length; i++) {
            /* Original version changed to background to have icon on left to align with other IATs
      arrowElem = document.createElement("span");
      arrowElem.classList = "icon arrow";
      arrows[i].appendChild(arrowElem);*/
            arrows[i].classList.add('icon-bg-arrow');
        }
    };

    // Removes all feedback from a question
    appData.removeUiFeedback = function (question) {
        const element = question.element;

        const disabledElems = Array.from(element.getElementsByClassName('disabled'));
        disabledElems.forEach(function (elem) {
            elem.enable();
        });

        const selectedElems = Array.from(element.getElementsByClassName('selected'));
        selectedElems.forEach(function (elem) {
            elem.classList.remove('selected');
        });

        const arrowElems = Array.from(element.getElementsByClassName('arrow'));
        arrowElems.forEach(function (elem) {
            elem.classList.remove('arrow');
            elem.classList.remove('icon-bg-arrow');
            if (elem.classList.contains('icon')) {
                elem.parentNode.removeChild(elem);
            }
        });

        const crossElems = Array.from(element.getElementsByClassName('cross'));
        crossElems.forEach(function (elem) {
            elem.classList.remove('cross');
            elem.classList.remove('icon-bg-cross');
            if (elem.classList.contains('icon')) {
                elem.parentNode.removeChild(elem);
            }
        });

        const checkmarkElems = Array.from(element.getElementsByClassName('checkmark'));
        checkmarkElems.forEach(function (elem) {
            elem.classList.remove('checkmark');
            elem.classList.remove('icon-bg-checkmark');
            if (elem.classList.contains('icon')) {
                elem.parentNode.removeChild(elem);
            }
        });

        const inputs = Array.from(element.querySelectorAll('input'));
        inputs.forEach(function (elem) {
            elem.value = '';
        });
        if (question.element.enableQuestion !== undefined) {
            question.element.enableQuestion();
        }

        const feedbackBoxes = Array.from(element.getElementsByClassName('feedback'));
        feedbackBoxes.forEach(function (elem) {
            elem.parentNode.removeChild(elem);
        });

        const selectedItems = Array.from(element.querySelectorAll('select'));
        selectedItems.forEach(function (elem) {
            elem.value = 'none';
        });
    };

    // Show some HTML within a container
    // Commonly used for pre-quiz/post-quiz and upgrade/downgrade feedback
    appData.appendHtml = function (html, parentElement, className = '') {
        const htmlContainer = document.createElement('span');
        htmlContainer.innerHTML = html;
        if (className !== '') {
            htmlContainer.classList.add(className);
        }
        parentElement.appendChild(htmlContainer);

        return htmlContainer;
    };

    // Clears the question area
    appData.clearStage = function () {
        this.pageElements.questionArea.innerHTML = '';
        this.pageElements.hintButton.hide();
        this.pageElements.hintBox.hide();
    };

    appData.checkEndConditions = function () {
        let endConditions = [];
        endConditions = this.quizData.endConditions;

        //let currentPool = this.sessionData.currentPool;
        let endConditionsMet = false;

        if (this.hasProperty(this.quizData.showHighestLevelAchieved)) {
            this.getHighestLevelAchieved(this.quizData);
        }

        if (!endConditionsMet && this.hasProperty(endConditions.numQuestionsCorrectToEnd.enabled)) {
            endConditionsMet = this.checkNumCorrectToEnd();
        }

        if (!endConditionsMet && this.hasProperty(endConditions.numQuestionsIncorrectToEnd.enabled)) {
            endConditionsMet = this.checkNumIncorrectToEnd();
        }

        return endConditionsMet;
    };

    appData.checkNumCorrectToEnd = function () {
        let tally = 0;

        this.quizData.questionPools.forEach(function (pool) {
            tally += pool.numCorrectlyAnsweredOverall;
        });

        if (tally >= this.quizData.endConditions.numQuestionsCorrectToEnd.limit) {
            return true;
        }

        return false;
    };

    appData.checkNumIncorrectToEnd = function () {
        let tally = 0;

        this.quizData.questionPools.forEach(function (pool) {
            tally += pool.numIncorrectlyAnsweredOverall;
        });

        if (tally >= this.quizData.endConditions.numQuestionsIncorrectToEnd.limit) {
            return true;
        }

        return false;
    };

    appData.getOverallProgress = function () {
        let tally = 0;
        this.quizData.questionPools.forEach(function (pool) {
            tally += pool.numCorrectlyAnsweredOverall;
        });
        return tally;
    };

    appData.getOverallIncorrect = function () {
        let tally = 0;
        this.quizData.questionPools.forEach(function (pool) {
            tally += pool.numIncorrectlyAnsweredOverall;
        });
        return tally;
    };

    appData.getQuestionPoolProgress = function (questionPool) {
        const correctlyAnswered = questionPool.numCorrectlyAnswered;
        const numRightNeeded = questionPool.numRightBeforeUpgrade;
        return (correctlyAnswered / numRightNeeded) * 100;
    };

    appData.getHighestLevelAchieved = function (quizData) {
        let highestLevel = this.sessionData.highestLevelAchieved;
        let highestPoolName = false;
        quizData.questionPools.forEach(function (pool) {
            if (pool.numCorrectlyAnswered > 0) {
                if (pool.poolLevel > highestLevel) {
                    this.sessionData.highestPoolAchieved = highestPoolName;
                    this.sessionData.highestLevelAchieved = highestLevel;
                }
            }
        });
    };

    appData.triggerHeightReset = function (repeat = true) {
        this.parentElement.removeAttribute('style');
        this.parentElement.setAttribute('style', 'height: auto;');

        if (repeat) {
            setTimeout(function () {
                appData.triggerHeightReset(false);
            }, 1000);
        }
    };

    // Give some unique ids to special pages
    appData.giveIds(appData.specialPages);

    // Augment quiz data with useful data structures
    appData.augmentQuizData();

    // Load first page of the quiz (pre-activity / first question)
    appData.loadFirstPage();
}
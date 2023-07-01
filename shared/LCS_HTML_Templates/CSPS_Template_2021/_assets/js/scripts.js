/* eslint-disable */
/** Code Snippet JavaScript **/
/* Needs to go at top of script file so copies unaltered code */
$.each($('.component-sample'), function () {
    var componentCode = $(this).html();
    var codeReplace = {
        '<': '&lt;',
        '>': '&gt;',
        '  ': '',
    };
    componentCode = componentCode.replace(/<|>|  /gi, function (matched) {
        return codeReplace[matched];
    });
    //var componentCode = componentCode.replace(/(?:\r\n|\r|\n)/gi, '');
    $(this).append(
        '<pre class="code-sample copy-this card bg-light"><code>' +
            componentCode +
            '</code></pre><p><button class="btn copy-btn" data-toggle="tooltip" data-placement="top" title="Copy Code To Clipboard">Copy Code</button></p>'
    );
});

/** Copy Button JavaScript **/
$('.copy-btn').on('click', function () {
    var copyText = $(this).parent().prev('.copy-this');
    /* copyToClipBoard(copyText[0].textContent); */
    var copyTextString = String(copyText[0].textContent);
    var tempTextArea = document.createElement('textarea');
    tempTextArea.value = copyTextString;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
    $(this).html('Code Copied');
});

/** Create Buttons in Lesson JavaScript **/
//Lessons strips out buttons using the insert stuff > enter embed code workflow - replacing with p tags with classes and then replacing on page load
$.each($('p.btn'), function () {
    $(this).attr('type', 'button');
    $(this).replaceWith(function () {
        return this.outerHTML.replace('<p', '<button').replace('</p', '</button');
    });
});

/** Accordions JavaScript **/

/** Accordions - dynamically add id **/
$.each($('.accordion'), function (index) {
    $(this).attr('id', 'accordion_' + parseInt(index + 1));
});

/** Accordions - dynamically add interaction **/
$.each($('.accordion .card'), function (index, value) {
    var num = index + 1;
    $(value)
        .children('.card-header')
        .attr('id', 'heading_acc_' + num);
    $(value)
        .find('.card-header > .card-title')
        .wrapInner('<button  class="btn btn-link" type="button" role="button" data-toggle="collapse" aria-expanded="false"></button>');
    $(value)
        .find('.card-header > .card-title > button')
        .attr({
            'data-target': '#collapse_acc_' + num,
            'aria-controls': 'collapse_acc_' + num,
        });
    $(value)
        .children('.collapse')
        .attr({
            id: 'collapse_acc_' + num,
            'aria-labelledby': 'heading_acc_' + num,
        })
        .attr('role', 'region');
});

/** Tabccordions - dynamically add id **/
$.each($('.tabccordion > .accordion'), function (index) {
    $(this).attr('id', 'tabccordion_' + parseInt(index + 1));
    $(this)
        .find('.card.tabccordion-card > .collapse')
        .attr({
            'data-parent': '#tabccordion_' + (index + 1),
        });
});

/** clone the accordion titles and add them to the button group for the tabs controls**/
let tabccordion_accordions = document.querySelectorAll('.tabccordion .accordion');
for (let i = 0; i < tabccordion_accordions.length; i++) {
    let id = tabccordion_accordions[i].id;
    let btnGroup = document.querySelector(`.accordion#${id} .btn-group`);
    let cardTitles = document.querySelectorAll(`.accordion#${id} .card-title`);
    for (let a = 0; a < cardTitles.length; a++) {
        let cardTitle = cardTitles[a];
        let copyCardTitle = cardTitle.cloneNode(true);
        btnGroup.appendChild(copyCardTitle);
    }
}

/** add the tabccordion class to the buttons in the btn-group**/
$('.btn-group button[data-toggle="collapse"]').addClass('tabccordion-title');

/** Prevent toggle on the active tab/ accordion, stops the tabs from ever not having content **/
$('.tabccordion .btn-link[data-toggle="collapse"]').on('click', function (e) {
    var target = $(event.target).data('target');
    var isOpen = $(target).hasClass('show');
    var isOtherOpen = !!$(target).siblings('.collapse.show').length;
    if (isOpen && !isOtherOpen) event.stopPropagation();
    if (isOtherOpen) $('.collapse').collapse('hide');
});

for (let i = 0; i < tabccordion_accordions.length; i++) {
    let id = tabccordion_accordions[i].id;
    //get the first tab button in a tabccordion group
    let firsttabtitle = document.querySelectorAll(`.accordion#${id} .tabccordion-title`).item(0);
    //set the aria controls
    firsttabtitle.setAttribute('aria-expanded', 'true');
    //get the first accordion button in a tabccordion group
    let firstaccordiontitle = document.querySelectorAll(`.accordion#${id} .tabccordion-card .card-title .btn-link`).item(0);
    //set the aria controls
    firstaccordiontitle.setAttribute('aria-expanded', 'true');
    //get the first card body of the tabccordion group
    let firstcardbody = document.querySelectorAll(`.accordion#${id} .tabccordion-card .collapse`).item(0);
    //expand the first card body
    firstcardbody.classList.add('show');
}

/* button to open & close all accordion slides. */
$.each($('button.expandall'), function (index) {
    $(this).attr('aria-expanded', 'false');
});
// Comment out to use custom accordion button
$('.expandall').on('click', function () {
    var nextAccordion = $(this).parent().next('.accordion');
    /* in case button is not in p tag */
    if ($(this).next('.accordion').length > 0) {
        nextAccordion = $(this).next('.accordion');
    }
    var nextAccId = '#' + nextAccordion.attr('id');
    if ($(nextAccId).hasClass('show-all')) {
        //$(nextAccId + ' .collapse.show').collapse('hide');
        $(nextAccId + ' > .card  > .collapse.show').collapse('hide');
        $(nextAccId).removeClass('show-all');
        $(this).attr('aria-expanded', 'false');

        const lang = document.documentElement.lang;

        if (lang === 'fr') {
            $(this).text('Ouvrir tous les panneaux');
        } else {
            $(this).text('Open All Panels');
        }
    } else {
        //$(nextAccId + ' .collapse:not(".show")').collapse('show');
        $(nextAccId + '  > .card  > .collapse:not(".show")').collapse('show');
        $(nextAccId).addClass('show-all');
        $(this).attr('aria-expanded', 'true');
        const lang = document.documentElement.lang;

        if (lang === 'fr') {
            $(this).text('Fermer tous les panneaux');
        } else {
            $(this).text('Close All Panels');
        }
    }
});

/*Uncomment this section out to change accordion button name */

// $(".expandall").each( function (index) {
//    var acbtn = $(this);
//    console.log($(this));
//    var acbtn_open =  $(this).attr('data-panel-open');
//    console.log(acbtn_open);
//    $(this).empty().append(acbtn_open);
//   });
//   /* button to open & close all accordion slides. */
//   $('.expandall').on('click', function () {

//    var acbtn = $(this);
//    var acbtn_close = $(this).attr('data-panel-close');
//    var acbtn_open =  $(this).attr('data-panel-open');
//   $(this).html = acbtn_open;

//    var nextAccordion = $(this).parent().next('.accordion');
//    /* in case button is not in p tag */
//    if ($(this).next('.accordion').length > 0) {
//     nextAccordion = $(this).next('.accordion');
//    }
//    var nextAccId = '#' + nextAccordion.attr('id');
//    if ($(nextAccId).hasClass("show-all")) {
//     $(nextAccId + ' .collapse.show').collapse('hide');
//     $(nextAccId).removeClass("show-all");
//     $(this).attr("aria-expanded", "false");
//     $(this).text(acbtn_open);
//    } else {
//     $(nextAccId + ' .collapse:not(".show")').collapse('show');
//     $(nextAccId).addClass("show-all");
//     $(this).attr("aria-expanded", "true");
//     $(this).text(acbtn_close);

//    }
//   });

//dynamically add aria attributes to tabs

$('.card-header')
    .find('button')
    .click(function () {
        // Any time an accordion is clicked, we want to check if any of the panels are open
        var expanded = false;
        // Check each of the accordions
        for (var x = 0; x < $('.card-header').find('button').length; x++) {
            // If the accordion matches the one we clicked on
            if (this === $('.card-header').find('button')[x]) {
                // We need to check if its false, because at this time, the panel won't have expanded yet, but it will
                if ($($('.card-header').find('button')[x]).attr('aria-expanded') === 'false') {
                    expanded = true;
                    break;
                }
            } else {
                // Otherwise, we just check if the panel is expaned
                if ($($('.card-header').find('button')[x]).attr('aria-expanded') === 'true') {
                    expanded = true;
                    break;
                }
            }
        }
        // From where the accordion is situated, we go up to the nearest container and then look for the expandall button
        var acc = $(this).closest('.accordion')[0];
        var ea = $(this).closest('.accordion').prev('.expandall')[0];
        // If any of the accordion panels are expanded
        if (expanded === true) {
            // Change the button to Close All Panels
            $(acc.id + ' .collapse:not(".show")').collapse('show');
            $(acc).addClass('show-all');
            const lang = document.documentElement.lang;
            if (lang === 'fr') {
                $(ea).text('Fermer tous les panneaux');
            } else {
                $(ea).text('Close All Panels');
            }
            $(ea).attr('aria-expanded', 'true');
        } else {
            // Otherwise, set the button to Open All Panels
            $(acc.id + '.collapse .show').collapse('hide');
            $(acc).removeClass('show-all');
            const lang = document.documentElement.lang;

            if (lang === 'fr') {
                $(ea).text('Ouvrir tous les panneaux');
            } else {
                $(ea).text('Open All Panels');
            }
            $(ea).attr('aria-expanded', 'false');
        }
    });

/** Background Image JavaScript **/
/* Get all the elements with the class bg-img-wrapper on page */
var bgImgWrapper = document.getElementsByClassName('bg-img-wrapper');
/* Cycle through the elements we want to have a background image */
for (var bgImgIndex = 0; bgImgIndex < bgImgWrapper.length; bgImgIndex++) {
    /* Declare variable bgImgId */
    var bgImgWrapperId = 'bg-img-wrapper-' + parseInt(bgImgIndex);
    /* Add bgImgWrapperId as unique ID to each element with class .bg-img-wrapper */
    document.querySelectorAll('.bg-img-wrapper')[bgImgIndex].setAttribute('id', bgImgWrapperId);
    /* Get the background image from the source of the first child image */
    var bgImg = document.getElementById(bgImgWrapperId).getElementsByTagName('img')[0].src;
    /* Set the background image on each element with class .bg-img-wrapper */
    document.querySelectorAll('.bg-img-wrapper')[bgImgIndex].setAttribute('style', 'background-image: url(' + bgImg + ');');
}

/** Buttons JavaScript **/

/** Click and Reveal JavaScript **/
$.each($('.card-reveal'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.card-body > .card-text > .btn-reveal')
        .attr({
            'data-target': '#c2r' + num,
            id: 'c2s' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            role: 'button',
        });
    $(value)
        .find('.card-body > .card-text > .collapse')
        .attr({
            id: 'c2r' + num,
            'aria-labelledby': 'c2s' + num,
            tabindex: '0',
            role: 'region',
        });
});

/** Click and Reveal: Inline Question w/ Hero Headline JavaScript **/
$.each($('.overlay-reveal'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.btn')
        .attr({
            'data-target': '#collapseExample' + num,
            'aria-controls': 'collapseExample' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'collapseExample' + num,
            role: 'region',
        });
});

/** Click and Reveal: Table JavaScript **/
$.each($('.table-reveal tr'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.btn-reveal')
        .attr({
            'data-target': '#tc2r' + num,
            id: 'tc2s' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'tc2r' + num,
            'aria-labelledby': 'tc2s' + num,
            tabindex: '0',
            role: 'region',
        });
});

/* Disable button onclick */
$('.btn-reveal').on('click', function () {
    var $_this = $(this);
    setTimeout(function () {
        $_this.attr('disabled', true);
    }, 500);
});

/** Flipcards JavaScript **/
$.each($('.flip-card-content'), function (index) {
    $(this).attr({
        tabindex: '0',
        role: 'button',
    });
});
$('.flip-card-content').on('click', function () {
    $(this).toggleClass('apply-flip');
    if ($(this).children('.flip-card-back').attr('aria-hidden')) {
        $(this).children('.flip-card-back').removeAttr('aria-hidden');
    } else {
        $(this).children('.flip-card-back').attr('aria-hidden', 'true');
    }

    if ($(this).children('.flip-card-front').attr('aria-hidden')) {
        $(this).children('.flip-card-front').removeAttr('aria-hidden');
    } else {
        $(this).children('.flip-card-front').attr('aria-hidden', 'true');
    }
});

//add attributes to all flip cards dynamically
const flipCards = document.body.getElementsByClassName('flip-card-content');
if (flipCards.length > 0) {
    Array.from(flipCards).forEach((flipCard) => {
        flipCard.setAttribute('aria-live', 'polite');
        flipCard.setAttribute('aria-relevant', 'removals');
    });
}

const flipCardBacks = document.body.getElementsByClassName('flip-card-back');
if (flipCards.length > 0) {
    Array.from(flipCardBacks).forEach((flipCardBack) => {
        flipCardBack.setAttribute('aria-hidden', 'true');
    });
}

/** Trigger Click on Focus + Enter  **/
$('.flip-card-content').keydown(function (e) {
    var keyCode = e.keyCode ? e.keyCode : e.which;
    if (keyCode === 13) {
        $(e.target).trigger('click');
    }
});

/** Links/ Icons JavaScript **/
/*add class based on link attributes */
$("a[target='_blank']").addClass('new-window');
$('a[download]').addClass('download');

/* Prevent link icons wrapping */
$('.download, .new-window').html(function () {
    var text = $(this).text().split(' ');
    // console.log(text.length);
    if (text.length > 1) {
        text = $(this).text().split(' ');
        var last = text.pop();
        return text.join(' ') + (text.length > 0 ? ' <span class="lastWord">' + last + '</span>' : last);
    } else {
        $(this).wrapInner(' <span class="lastWord"></span>');
    }
});

/*Add a space after the link icon */
$(function () {
    // $('.download, .new-window').after('&#8288;');
    $('.download, .new-window').after('&nbsp;');
});

/** Links JavaScript **/
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

/* Check for links in document */
var links = document.querySelectorAll('a');
/* Create index for download links unique id*/
var downloadIndex = 0;
/* Create index for new window links unique id*/
var newWindowIndex = 0;
/* Check links on page */
for (var linkIndex = 0; linkIndex < links.length; linkIndex++) {
    /* Creating a span to wrap the screen-reader text */
    var srTxtWrapper = document.createElement('span');
    /* Add class .sr-only to screen-reader span */
    srTxtWrapper.classList.add('sr-only');

    if (links[linkIndex].classList.contains('download')) {
        /* Add download attribute */
        // links[linkIndex].setAttribute("download", "");
        /* Add unique id to download link */
        links[linkIndex].setAttribute('id', 'download-file-' + downloadIndex);
        /* Add title attribute saying download file */
        const lang = document.documentElement.lang;
        if (lang === 'fr') {
            links[linkIndex].setAttribute('title', 'télécharge un fichier');
        } else {
            links[linkIndex].setAttribute('title', 'download file');
        }
        /* Add data-toggle tooltip data attribute */
        links[linkIndex].setAttribute('data-toggle', 'tooltip');
        /* Creating the screen-reader text */
        if (lang === 'fr') {
            var srTxt = document.createTextNode('(Ce lien télécharge un fichier)');
        } else {
            var srTxt = document.createTextNode('(this link downloads a file)');
        }
        /* Adding the screen-reader text to the span*/
        srTxtWrapper.appendChild(srTxt); //uncommenting
        links[linkIndex].append(srTxtWrapper); //uncommenting
        /* Increase downloadIndex by one for next download link */
        downloadIndex++;
    } else if (links[linkIndex].classList.contains('new-window')) {
        /* Add target _blank attribute for link to open in new window */
        links[linkIndex].setAttribute('target', '_blank'); //uncommenting
        /* Add unique id to new window link */
        links[linkIndex].setAttribute('id', 'new-window' + newWindowIndex);
        /* Add title attribute saying link opens in new window */
        const lang = document.documentElement.lang;

        if (lang === 'fr') {
            links[linkIndex].setAttribute('data-original-title', 'Ouvre dans une nouvelle fenêtre/onglet');
        } else {
            links[linkIndex].setAttribute('data-original-title', 'opens in new window/tab');
        }

        /* Add data-toggle tooltip data attribute */
        links[linkIndex].setAttribute('data-toggle', 'tooltip');
        /* Add rel="noopener" for security - see https://developers.google.com/web/tools/lighthouse/audits/noopener and https://mathiasbynens.github.io/rel-noopener/ */
        links[linkIndex].setAttribute('rel', 'noopener');
        /* Creating the screen-reader text */
        if (lang === 'fr') {
            var srTxt = document.createTextNode('(Ouvre dans une nouvelle fenêtre/onglet)');
        } else {
            var srTxt = document.createTextNode('(this link opens in a new window/tab)');
        }

        /* Adding the screen-reader text to the span*/
        srTxtWrapper.appendChild(srTxt); //uncommenting
        links[linkIndex].append(srTxtWrapper); //uncommenting
        newWindowIndex++;
    }
}

/** Modals JavaScript **/
$.each($('p.close'), function () {
    $(this).wrapInner('<span aria-hidden="true"></span>');
    $(this).attr({
        type: 'button',
        'data-dismiss': 'modal',
        'aria-label': 'Close',
    });
    $(this).replaceWith(function () {
        return this.outerHTML.replace('<p', '<button').replace('</p', '</button');
    });
});

$.each($('.modal-set'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.btn')
        .attr({
            'data-target': '#exampleModal' + num,
            'data-toggle': 'modal',
        });
    $(value)
        .find('.modal')
        .attr({
            tabindex: '-1',
            role: 'dialog',
            id: 'exampleModal' + num,
            'aria-labelledby': 'exampleModalLabel' + num,
            'aria-hidden': 'true',
        });
    $(value).find('.modal-dialog').attr({
        role: 'document',
    });
    $(value).find('.modal-content').attr({
        role: 'dialog',
    });
    $(value)
        .find('.modal-title')
        .attr({
            id: 'exampleModalLabel' + num,
        });
    $(value).find(".modal-footer > .btn:contains('Close')").attr({
        'data-dismiss': 'modal',
    });
});

if (window.self !== window.top) {
    $('[data-toggle="modal"]').click(function () {
        /* Gets the top offset position of the button triggering modal */
        /* Check is using the btn-breakout option - see Interest Cards */
        var buttonTopOffset;
        if ($(this).hasClass('btn-breakout')) {
            console.log('btn-breakout found');
            /* if is using the btn-breakout option offsets from parent element (which can be clicked) */
            buttonTopOffset = $(this).parent().offset().top;
        } else {
            /* else offsets from the top of the button */
            buttonTopOffset = $(this).offset().top;
        }
        $('.modal').on('show.bs.modal', function () {
            /* Adds he top offset position of the button as padding-top to the modal  */
            $(this).css('padding-top', buttonTopOffset);
        });
    });
}

/*Stop videos playing inside modals when they close */
$('.modal').on('hide.bs.modal', function () {
    var memory = $(this).html();
    $(this).html(memory);
});

/** Popovers JavaScript **/
$(function () {
    $('[data-toggle="popover-top"]').popover({
        html: true,
    });

    $('[data-toggle="popover-bottom"]').popover({
        html: true,
    });

    $('[data-toggle="popover-left"]').popover({
        html: true,
    });

    $('[data-toggle="popover-right"]').popover({
        html: true,
    });

    /*Closes popover using the Esc key*/
    $(document).keyup(function (event) {
        if (event.which === 27) {
            $('[data-toggle="popover"]').popover('hide');
        }
    });

    //   $('body').on('click', function (e) {
    //     $('[data-toggle="popover"]').each(function () {
    //         //the 'is' for buttons that trigger popups
    //         //the 'has' for icons within a button that triggers a popup
    //         if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
    //             $(this).popover('hide');
    //         }
    //     });
    // });
});

/** Quick Assesments JavaScript **/
/* Quick Assessments - add form element to Quick Assessments - stripped out when use insert stuff in Lessons */
$.each($('.quick-assess'), function () {
    $(this).wrapInner('<form></form>');
});
/* Quick Assessment - Multiple Choice */
$.each($('.quick-assess-mc .form-check'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('label')
        .before('<input type="radio" name="MC-answer" class="" id="MC-ans' + num + '" value="MC-ans' + num + '">')
        .attr({
            for: 'MC-ans' + num,
        });
    $(value).html(
        $(value)
            .html()
            .replace('[[Y]]', '<span class="fas fa-check ans-symbol invisible float-right"></span>')
            .replace('[[N]]', '<span class="fas fa-times ans-symbol invisible float-right"></span>')
    );
});

/* Adding attributes to Quick Assessment - Multiple Choice */
$.each($('.quick-assess-mc'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.btn-quick-assess')
        .attr({
            'data-target': '#MC-QuizFeedback' + num,
            'aria-controls': 'MC-QuizFeedback' + num,
            id: 'MC-QuizButton' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            disabled: '',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'MC-QuizFeedback' + num,
            'aria-labelledby': 'MC-QuizButton' + num,
            tabindex: '0',
            role: 'region',
        });
    /* Enable Button to Check Answer */
    var MCQuizButtonID = '#MC-QuizButton' + num;
    $(value)
        .find('input')
        .on('click', function () {
            $(MCQuizButtonID).removeAttr('disabled');
        });
    /* When displaying answer - show answer symbols and disable button and radio buttons */
    $(MCQuizButtonID).click(function () {
        $(value).find('.ans-symbol').removeClass('invisible');
        $(value)
            .find('.collapse')
            .on('shown.bs.collapse', function () {
                $(value).find('.btn-quick-assess, input').prop('disabled', true);
            });
    });
});

/* Quick Assessment - All That Apply (Multi-select) */
$.each($('.quick-assess-ms .form-check'), function (index, value) {
    const num = index + 1;
    $(value)
        .find('label')
        .before('<input type="checkbox" name="MS-answer" class="" id="MS-ans' + num + '" value="MS-ans' + num + '">')
        .attr({
            for: 'MS-ans' + num,
        });
    $(value).html(
        $(value)
            .html()
            .replace('[[Y]]', '<span data-correct="true"  class="fas   ans-symbol invisible float-right"></span>')
            .replace('[[N]]', '<span data-correct="false"   class="fas   ans-symbol invisible float-right"></span>')
    );
});

/* Adding attributes to Quick Assessment - All That Apply (Multi-select)  */
$.each($('.quick-assess-ms'), function (index, value) {
    const num = index + 1;
    $(value)
        .find('.btn-quick-assess')
        .attr({
            'data-target': '#MS-QuizFeedback' + num,
            'aria-controls': 'MS-QuizFeedback' + num,
            id: 'MS-QuizButton' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            disabled: '',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'MS-QuizFeedback' + num,
            'aria-labelledby': 'MS-QuizButton' + num,
            tabindex: '0',
            role: 'region',
        });
    /* Enable Button to Check Answer */
    const MSQuizButtonID = '#MS-QuizButton' + num;
    let MSQuizRadioCheckedTotal = 0; // eslint-disable-line
    $(value)
        .find('input')
        .on('click', function () {
            // let MSQuizRadioCheckedTotal = 0; => removed this line because it breaks the functionality of disabling the button
            // Only allow submit button to be enabled if at least one item is checked
            $(this).prop('checked') ? MSQuizRadioCheckedTotal++ : MSQuizRadioCheckedTotal--;
            if (MSQuizRadioCheckedTotal > 0) {
                $(MSQuizButtonID).prop('disabled', false);
            } else {
                $(MSQuizButtonID).prop('disabled', true);
            }
        });
    /* When displaying answer - show answer symbols and disable button and radio buttons */
    $(MSQuizButtonID).click(function () {
        $.each($('.quick-assess-ms .form-check'), function (index, value) {
            const num = index + 1;
            const correctAnswer = $(value).find('.ans-symbol')[0].getAttribute('data-correct') === 'true';
            const usersAnswer = $(value)
                .find('#MS-ans' + num)
                .prop('checked');
            const resultIcon = $(value).find('.ans-symbol')[0];
            // logic to display icon once multi select is submitted
            if (correctAnswer) {
                if (usersAnswer) {
                    // the answer is correct and the input is checked
                    $(resultIcon).addClass('fa-check');
                } else {
                    // the answer is correct and input is not checked
                    $(resultIcon).addClass('fa-arrow-right');
                }
            } else {
                if (usersAnswer) {
                    // the answer is incorrect and the input is checked
                    $(resultIcon).addClass('fa-times');
                }
                // item is not check and the answer is incorrect => do nothing
            }
        });

        $(value).find('.ans-symbol').removeClass('invisible');
        $(value)
            .find('.collapse')
            .on('shown.bs.collapse', function () {
                $(value).find('.btn-quick-assess, input').prop('disabled', true);
            });
    });
});

/* Quick Assessment - Short Answers (Fill in the Blank) */
/* Replacing [[BLANK]] with input field */
$.each($('.quick-assess-sa .shortanswer'), function (index, value) {
    var num = index + 1;
    $(value).html(
        $(value)
            .html()
            .replace(/\[\[BLANK\]\]/g, '<label  class="sr-only">your answer </label>')
    );
    $(value)
        .find('label')
        .after('<input type="text" placeholder="your answer" required="true" aria-required="true" id="FIB-answer1' + num + '">')
        .attr({
            for: 'FIB-answer' + num,
        });
});
/* Adding attributes to Quick Assessment - Short Answers (Fill in the Blank)  */
$.each($('.quick-assess-sa'), function (index, value) {
    var num = index + 1;
    /*  Enable Button to Check Answer */
    $(value)
        .find('input[type=text], input[type=number]')
        .keyup(function () {
            var noInput = false;
            $(value)
                .find('input[type=text], input[type=number]')
                .each(function () {
                    if ($(this).val() == '') {
                        noInput = true;
                    }
                });
            if (noInput) {
                $(value).find('.btn-quick-assess').prop('disabled', true);
            } else {
                $(value).find('.btn-quick-assess').removeAttr('disabled');
            }
        });

    $(value)
        .find('.btn-quick-assess')
        .attr({
            'data-target': '#FIB-QuizFeedback' + num,
            'aria-controls': 'FIB-QuizFeedback' + num,
            id: 'FIB-QuizButton' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            disabled: '',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'FIB-QuizFeedback' + num,
            'aria-labelledby': 'FIB-QuizButton' + num,
            tabindex: '0',
            role: 'region',
        });
    /* When displaying answer disable buttons and form fields */
    var FIBButtonID = '#FIB-QuizButton' + num;
    $(FIBButtonID).click(function () {
        $(value)
            .find('.collapse')
            .on('shown.bs.collapse', function () {
                $(value).find('.btn-quick-assess, input').prop('disabled', true);
            });
    });
});
/* Adding attributes to Quick Assessment - Short Answers (Fill in the Blank)  */
$.each($('.quick-assess-sa .shortanswer'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('label')
        .attr({
            for: 'FIB-answer' + num,
        });
    $(value)
        .find('input')
        .attr({
            id: 'FIB-answer' + num,
        });
});

/* Quick Assessment - Drop Down */

$.each($('.quick-assess-dd'), function (index, value) {
    var num = index + 1;
    /* Switching text wrapped with {{LABEL}} to label tag and creating drop down options from text with [[option1|option2|]] format*/
    $(value).html(
        $(value)
            .html()
            .replace(/\{\{/g, '<label>')
            .replace(/\}\}/g, '</label>')
            .replace(/\[\[/g, '<select class="options">')
            .replace(/\]\]/g, '</select>')
    );
    $(value)
        .find('select.options')
        .each(function () {
            var ddOptions = $(this).html().split('|');
            $(this).html(
                '<option disabled="" selected="" value="">...</option>' +
                    $.map(ddOptions, function (v) {
                        return '<option>' + v + '</option>';
                    }).join('') +
                    ''
            );
        });
    /* Enable Button to Check Answer  */
    $(value)
        .find('select')
        .change(function () {
            var noInput = false;
            $(value)
                .find('select')
                .each(function () {
                    if ($(this).val() == null) {
                        noInput = true;
                    }
                });
            if (noInput) {
                $(value).find('.btn-quick-assess').prop('disabled', true);
            } else {
                $(value).find('.btn-quick-assess').removeAttr('disabled');
            }
        });
    $(value)
        .find('.btn-quick-assess')
        .attr({
            'data-target': '#DD-QuizFeedback' + num,
            'aria-controls': 'DD-QuizFeedback' + num,
            id: 'DD-QuizButton' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
            disabled: '',
            role: 'button',
        });
    $(value)
        .find('.collapse')
        .attr({
            id: 'DD-QuizFeedback' + num,
            'aria-labelledby': 'DD-QuizButton' + num,
            tabindex: '0',
            role: 'region',
        });
    /* When displaying answer disable buttons and form fields */
    var DDButtonID = '#DD-QuizButton' + num;
    $(DDButtonID).click(function () {
        $(value)
            .find('.collapse')
            .on('shown.bs.collapse', function () {
                $(value).find('.btn-quick-assess, select').prop('disabled', true);
            });
    });
});
/* Adding attributes to Quick Assessment - Drop Down  */
$.each($('.quick-assess-dd label'), function (index) {
    $(this).attr({
        for: 'DD-answer' + parseInt(index + 1),
    });
});
$.each($('.quick-assess-dd select'), function (index) {
    const lang = document.documentElement.lang;
    let optionTitle;
    if (lang === 'fr') {
        optionTitle = 'La liste déroulante ';
    } else {
        optionTitle = 'Dropdown ';
    }
    $(this).attr({
        id: 'DD-answer' + parseInt(index + 1),
        name: 'select' + parseInt(index + 1),
        title: optionTitle + parseInt(index + 1),
    });
});

/** Tabs JavaScript **/
/** Tabs - dynamically add interaction **/
/* .list-group add ID */
$.each($('.list-group'), function (index) {
    $(this).attr({
        id: 'list-tab_' + parseInt(index + 1),
        role: 'tablist',
    });
});
/* .list-group-item add attributes */
$.each($('.list-group > .list-group-item'), function (index, value) {
    var num = index + 1;
    $(value).attr({
        id: 'list-' + num + '-list',
        href: '#list-' + num,
        'aria-controls': 'list-' + num,
        'data-toggle': 'list',
        role: 'tab',
    });
});
/* .tab-content add ID */
$.each($('.tab-content'), function (index) {
    $(this).attr('id', 'nav-tabContent_' + parseInt(index + 1));
});
/* .tab-pane add attributes */
$.each($('.tab-content > .tab-pane'), function (index, value) {
    var num = index + 1;
    $(value).attr({
        id: 'list-' + num,
        'aria-labelledby': 'list-' + num + '-list',
        role: 'tabpanel',
        tabindex: '0',
    });
});

/** Tooltip JavaScript **/
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.popovers-link').popover({
        html: true,
        trigger: 'focus',
    });
});

/** Video JavaScript **/

/** WheelNav JavaScript **/
$('.btn-reveal1').click(function () {
    $('.collapse').collapse('hide');
});

// Add button that will toggle contenteditable=true when in dev
$(document).ready(function () {
    if (window.location.href.indexOf('localhost:3000') > 0) {
        let toggle = document.createElement('button');
        toggle.innerHTML = 'Editor View (disabled)';
        toggle.style = 'position: fixed; top: 0; left: 0; display: block; background: pink;';
        toggle.onclick = function () {
            if (document.body.getAttribute('contenteditable') === 'true') {
                document.body.setAttribute('contenteditable', 'false');
                toggle.style.background = 'pink';
                toggle.innerHTML = 'Editor View (disabled)';
            } else {
                document.body.setAttribute('contenteditable', 'true');
                toggle.style.background = 'lightgreen';
                toggle.innerHTML = 'Editor View (enabled)';
            }
        };
        document.body.appendChild(toggle);
    }
});

// (function ($) {
//     'use strict';
//     $(document).ready(function () {
//         'use strict';

//         //Scroll back to top

//         var progressPath = document.querySelector('.progress-arrow path');
//         var pathLength = progressPath.getTotalLength();
//         progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
//         progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
//         progressPath.style.strokeDashoffset = pathLength;
//         progressPath.getBoundingClientRect();
//         progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';
//         var updateProgress = function () {
//             var scroll = $(window).scrollTop();
//             var height = $(document).height() - $(window).height();
//             var progress = pathLength - (scroll * pathLength) / height;
//             progressPath.style.strokeDashoffset = progress;
//         };
//         updateProgress();
//         $(window).scroll(updateProgress);
//         var offset = 50;
//         var duration = 1000;
//         jQuery(window).on('scroll', function () {
//             if (jQuery(this).scrollTop() > offset) {
//                 jQuery('.progress-arrow').addClass('active-progress');
//             } else {
//                 jQuery('.progress-arrow').removeClass('active-progress');
//             }
//         });
//         jQuery('.progress-arrow').on('click', function (event) {
//             event.preventDefault();
//             jQuery('html, body').animate(
//                 {
//                     scrollTop: 0,
//                 },
//                 duration
//             );
//             return false;
//         });
//     });
// })(jQuery);

// window.onscroll = function () {
//     progressScroll();
// };

// function progressScroll() {
//     var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
//     var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
//     var scrolled = (winScroll / height) * 100;
//     document.getElementById('myBar').style.width = scrolled + '%';
// }

/** Progression Slides */

$('.slider').hide();

$.each($('.slider'), function (index) {
    //Unless specified, add a horizontal rule before slide content.
    if (!$(this).hasClass('no-break')) {
        $(this).prepend('<hr>');
    }

    let animation;
    //Use data-attribute to determine entrance animation, otherwise use slideInRight as default.
    if ($(this).attr('data-attribute')) {
        animation = $(this).attr('data-attribute');
    } else {
        animation = 'slideInRight';
    }

    //Determine delay based on class 'instant' - no class, 1s delay as default.
    if ($(this).hasClass('instant')) {
        $(this).addClass('animated slow ' + animation + ' slider_' + parseInt(index));
    } else {
        $(this).addClass('animated slow delay-1s ' + animation + ' slider_' + parseInt(index));
    }
});

//Set up for slide buttons that also reveal collapsed information on click.
$.each($('.slider-reveal'), function (index, value) {
    var num = index + 1;
    $(value)
        .find('.btn-reveal')
        .attr({
            'data-target': '#c2r' + num,
            id: 'c2s' + num,
            'data-toggle': 'collapse',
            'aria-expanded': 'false',
        });

    $(value)
        .find('.collapse')
        .attr({
            id: 'c2r' + num,
            'aria-labelledby': 'c2s' + num,
            tabindex: '0',
        });
});

//Disable buttons after they animate a slide.
$.each($('.btn-slider'), function (index) {
    $(this).addClass('slider_' + parseInt(index));

    $(this).on('click', function () {
        $('.slider_' + parseInt(index)).show();

        var $_this = $(this);
        setTimeout(function () {
            $_this.attr('disabled', true);
        }, 1000);
    });
});

$('a .btn-slider').on('click', function (event) {
    if ($(this).hasClass('disabled')) {
        event.preventDefault();
    }
    $(this).addClass('disabled');
});

const sortableListInput = document.getElementById('sortable-list-input');

if (sortableListInput) {
    const inputList = document.getElementById('sortable-list-input');
    inputList.style.display = 'none';

    const sortable_list = document.getElementById('sortable-list');
    const checkList = document.getElementById('sortable-list-check');
    const resetList = document.getElementById('sortable-list-reset');

    const Rank = inputList.innerHTML.split(', ');

    const listItems = [];

    //for mouse + keyboard
    let startIndex = '';
    let endIndex = '';

    createList();

    //insert list items into DOM
    function createList() {
        [...Rank]
            .map((a) => ({
                value: a,
                sort: Math.random(),
            }))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => a.value)
            .forEach((rank, index) => {
                const listItem = document.createElement('li');
                listItem.setAttribute('data-index', index);
                listItem.setAttribute('tabindex', 0);
                listItem.setAttribute('listener', 'true');
                listItem.classList.add('list-item');

                const eventHandler = (e) => {
                    if (e.type === 'click') {
                        if (startIndex !== '') {
                            endIndex = index;
                            swapItems(startIndex, endIndex);
                            endIndex = '';
                            startIndex = '';
                            listItem.classList.remove('over');
                        } else if (startIndex === '') {
                            startIndex = index;
                            listItem.classList.add('over');
                        }
                    } else if (e.type === 'keypress' && e.key === 'Enter') {
                        if (startIndex !== '') {
                            endIndex = index;
                            swapItems(startIndex, endIndex);
                            endIndex = '';
                            startIndex = '';
                            listItem.classList.remove('over');
                        } else if (startIndex === '') {
                            startIndex = index;
                            listItem.classList.add('over');
                        }
                    } else if (e.type === 'touchstart') {
                        e.preventDefault();
                        if (startIndex !== '') {
                            endIndex = index;
                            swapItems(startIndex, endIndex);
                            endIndex = '';
                            startIndex = '';
                            listItem.classList.remove('over');
                        } else if (startIndex === '') {
                            startIndex = index;
                            listItem.classList.add('over');
                        }
                    }
                };

                //adding click event listeners
                listItem.addEventListener('click', eventHandler);

                //adding event listeners for keyboard keyboard accessibility
                listItem.addEventListener('keypress', eventHandler);

                //adding event listeners for touch
                listItem.addEventListener('touchstart', eventHandler);

                const listContainer = document.createElement('div');
                listContainer.setAttribute('sortable', 'true');
                listContainer.classList.add('sortable');

                const listNumber = document.createElement('span');
                listNumber.classList.add('number');

                listNumber.innerHTML = index + 1;

                const listName = document.createElement('p');
                listName.classList.add('list-item');
                listName.innerHTML = rank;

                const icon = document.createElement('i');
                icon.classList.add('fas', 'fa-grip-lines', 'icon');

                listContainer.appendChild(listName);
                listContainer.appendChild(icon);
                listItem.appendChild(listNumber);
                listItem.appendChild(listContainer);

                listItems.push(listItem);

                sortable_list.appendChild(listItem);
            });
    }

    //swap elements using data attribute added to each list item (source: Brad Traversy, https://traversymedia.com)
    function swapItems(fromIndex, toIndex) {
        if (fromIndex !== null && toIndex !== null) {
            const itemOne = listItems[fromIndex].querySelector('.sortable');
            const itemOneParent = itemOne.parentElement;
            itemOneParent.classList.remove('over');
            const itemTwo = listItems[toIndex].querySelector('.sortable');
            if (itemOne !== itemTwo) {
                listItems[fromIndex].appendChild(itemTwo);
                listItems[toIndex].appendChild(itemOne);
            }
        }
    }
    //check order on button click
    function checkOrder() {
        listItems.forEach((listItem, index) => {
            const Name = listItem.querySelector('.sortable').innerText.trim();
            listItem.classList.remove('over');

            if (Name !== Rank[index]) {
                listItem.classList.add('wrong');
                const icon = listItem.getElementsByTagName('i')[0];
                icon.classList.remove('fa-grip-lines');
                icon.classList.remove('fa-check');
                icon.classList.add('fa-times');
                icon.style.color = 'red';
            } else if (listItem.getAttribute('listener') === 'true') {
                //remove event listeners on new correct answers only

                listItem.classList.remove('wrong');
                listItem.classList.add('right');
                const icon = listItem.getElementsByTagName('i')[0];
                icon.classList.remove('fa-times');
                icon.classList.remove('fa-grip-lines');
                icon.classList.add('fa-check');
                icon.style.color = 'green';

                const newElement = listItem.cloneNode(true);
                listItem.parentNode.replaceChild(newElement, listItem);
                listItem.setAttribute('listener', 'false');
            }
            startIndex = '';
            endIndex = '';
        });

        const answerList = listItems.map((item) => item.querySelector('.sortable').innerText.trim());

        const equal = arraysEqual(answerList, Rank);
        if (equal) {
            const message = document.getElementById('message');
            message.innerHTML = 'You have completed this activity!';
        } else {
            const message = document.getElementById('message');
            message.innerHTML = 'Not quite! Keep trying!';
        }
    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = arr1.length; i--; ) {
            if (arr1[i] !== arr2[i]) return false;
        }

        return true;
    }

    function resetActivity() {
        const message = document.getElementById('message');
        message.innerHTML = '';
        sortable_list.innerHTML = '';

        listItems.length = 0;

        startIndex = '';
        endIndex = '';

        startIndexForTouch = '';
        endIndexForTouch = '';
        createList();
    }

    checkList.addEventListener('click', checkOrder);
    resetList.addEventListener('click', resetActivity);
}

//code to make tabs and graphic tabs accessible

const tabsVertical = document.getElementsByClassName('tabs-vertical');
const tabsHorizontal = document.getElementsByClassName('tabs-horizontal');
const tabsGraphic = document.getElementsByClassName('graphic-tabs');

if (tabsVertical.length > 0 || tabsHorizontal.length > 0 || tabsGraphic.length > 0) {
    //dynanamically convert a tags to buttons in tabs if not already buttons

    const aTags = $('.tabs-wrapper, .graphic-tabs').find('a.list-group-item');

    $.each($(aTags), function (i) {
        $(this).replaceWith(function () {
            return this.outerHTML.replace('<a', '<button').replace('</a', '</button');
        });
    });

    const buttonsNotActive = $('.tabs-wrapper, .graphic-tabs').find('button').not('.active');
    $.each($(buttonsNotActive), function () {
        $(this).attr('tabindex', '-1');
    });

    /*
     *   This content is licensed according to the W3C Software License at
     *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
     */

    ('use strict');

    (function () {
        var tablist = document.querySelectorAll('[role="tablist"]')[0];
        var tabs;
        var panels;

        generateArrays();

        function generateArrays() {
            tabs = document.querySelectorAll('[role="tab"]');
            panels = document.querySelectorAll('[role="tabpanel"]');
        }

        // For easy reference
        var keys = {
            end: 35,
            home: 36,
            left: 37,
            up: 38,
            right: 39,
            down: 40,
            delete: 46,
            enter: 13,
            space: 32,
        };

        // Add or subtract depending on key pressed
        var direction = {
            37: -1,
            38: -1,
            39: 1,
            40: 1,
        };

        // Bind listeners
        for (var i = 0; i < tabs.length; ++i) {
            addListeners(i);
        }

        function addListeners(index) {
            tabs[index].addEventListener('click', clickEventListener);
            tabs[index].addEventListener('keydown', keydownEventListener);
            tabs[index].addEventListener('keyup', keyupEventListener);

            // Build an array with all tabs (<button>s) in it
            tabs[index].index = index;
        }

        // When a tab is clicked, activateTab is fired to activate it
        function clickEventListener(event) {
            var tab = event.target;
            activateTab(tab, false);
        }

        // Handle keydown on tabs
        function keydownEventListener(event) {
            var key = event.keyCode;

            switch (key) {
                case keys.end:
                    event.preventDefault();
                    // Activate last tab
                    focusLastTab();
                    break;
                case keys.home:
                    event.preventDefault();
                    // Activate first tab
                    focusFirstTab();
                    break;

                // Up and down are in keydown
                // because we need to prevent page scroll >:)
                case keys.up:
                case keys.down:
                    determineOrientation(event);
                    break;
            }
        }

        // Handle keyup on tabs
        function keyupEventListener(event) {
            var key = event.keyCode;

            switch (key) {
                case keys.left:
                case keys.right:
                    determineOrientation(event);
                    break;
                case keys.delete:
                    determineDeletable(event);
                    break;
                case keys.enter:
                case keys.space:
                    activateTab(event.target);
                    break;
            }
        }

        // When a tablistâ€™s aria-orientation is set to vertical,
        // only up and down arrow should function.
        // In all other cases only left and right arrow function.
        function determineOrientation(event) {
            var key = event.keyCode;
            var vertical = tablist.getAttribute('aria-orientation') == 'vertical';
            var proceed = false;

            if (vertical) {
                if (key === keys.up || key === keys.down) {
                    event.preventDefault();
                    proceed = true;
                }
            } else {
                if (key === keys.left || key === keys.right) {
                    proceed = true;
                }
            }

            if (proceed) {
                switchTabOnArrowPress(event);
            }
        }

        // Either focus the next, previous, first, or last tab
        // depending on key pressed
        function switchTabOnArrowPress(event) {
            var pressed = event.keyCode;

            if (direction[pressed]) {
                var target = event.target;
                if (target.index !== undefined) {
                    if (tabs[target.index + direction[pressed]]) {
                        tabs[target.index + direction[pressed]].focus();
                    } else if (pressed === keys.left || pressed === keys.up) {
                        focusLastTab();
                    } else if (pressed === keys.right || pressed == keys.down) {
                        focusFirstTab();
                    }
                }
            }
        }

        // Activates any given tab panel
        function activateTab(tab, setFocus) {
            setFocus = setFocus || true;
            // Deactivate all other tabs
            deactivateTabs();

            // Remove tabindex attribute
            tab.removeAttribute('tabindex');

            // Set the tab as selected
            tab.setAttribute('aria-selected', 'true');

            // Get the value of aria-controls (which is an ID)
            var controls = tab.getAttribute('aria-controls');

            // // Remove is-hidden class from tab panel to make it visible
            // document.getElementById(controls).classList.remove('is-hidden');

            // Set focus when required
            if (setFocus) {
                tab.focus();
            }
        }

        // Deactivate all tabs and tab panels
        function deactivateTabs() {
            for (var t = 0; t < tabs.length; t++) {
                tabs[t].setAttribute('tabindex', '-1');
                tabs[t].setAttribute('aria-selected', 'false');
            }

            // for (var p = 0; p < panels.length; p++) {
            //     panels[p].classList.add('is-hidden');
            // }
        }

        // Make a guess
        function focusFirstTab() {
            tabs[0].focus();
        }

        // Make a guess
        function focusLastTab() {
            tabs[tabs.length - 1].focus();
        }

        // Detect if a tab is deletable
        function determineDeletable(event) {
            var target = event.target;

            if (target.getAttribute('data-deletable') !== null) {
                // Delete target tab
                // deleteTab(event, target);

                // Update arrays related to tabs widget
                generateArrays();

                // Activate the closest tab to the one that was just deleted
                if (target.index - 1 < 0) {
                    activateTab(tabs[0]);
                } else {
                    activateTab(tabs[target.index - 1]);
                }
            }
        }

        // Deletes a tab and its panel
        function deleteTab(event) {
            var target = event.target;
            var panel = document.getElementById(target.getAttribute('aria-controls'));

            target.parentElement.removeChild(target);
            panel.parentElement.removeChild(panel);
        }
    })();
}

const videos = document.getElementsByTagName('video');

if (videos) {
    Array.from(videos).forEach((video) => {
        video.volume = 0.2;
    });
}

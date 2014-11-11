/// <reference path="jquery-1.9.1.min.js" />

(function ($) {

    var octaves = [];
    var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    $(function () {
        initializeOctaves();
    });

    function initializeOctaves() {
        for (var i = 1; i <= 4; i++) {
            $(notes).each(function (index, note) {
                var noteName = i + note.replace('#', 'sharp');
                octaves.push(noteName);
                var audio = $('<audio>')
                            .attr({
                                id: 'note' + noteName,
                                src: 'tabplayer/sounds/' + noteName + '.ogg',
                                preload: 'auto'
                            });
                $('body').append(audio);
            });
        }
    }

    $.fn.setupTabPlayer = function () {
        return this.each(function (index, pre) {
            var tabPlayerInstance = new TabPlayer({ index: index, pre: pre });
        });
    };

    var TabPlayer = function (params) {
        this.setup(params);
    }

    var generateUUID = function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
        return uuid;
    };

    $.extend(TabPlayer.prototype, {
        el: undefined,
        BAR_LENGTH: 18,
        channel_max: 100,
        audiochannels: new Array(),
        setup: function (params) {
            var me = this;
            this.el = params.pre;
            this.initializePlayerVars();
            this.tabPlayerId = generateUUID();
            this.initializeAudioChannels();
            this.initializeGuitarStrings();
            this.createControlPanel();
            this.setupBarTime();
            this.setupTuning();
            this.formatPre();
        },
        initializePlayerVars: function() {
            var me = this;
            me.tabPlayerId =  undefined;
            me.step = 0;
            me.noteSeq = 0;
            me.guitarStrings = [{
                openString: 'e',
                currentNoteIndex: 0
            }, {
                openString: 'B',
                currentNoteIndex: 0
            }, {
                openString: 'G',
                currentNoteIndex: 0
            }, {
                openString: 'D',
                currentNoteIndex: 0
            }, {
                openString: 'A',
                currentNoteIndex: 0
            }, {
                openString: 'E',
                currentNoteIndex: 0
            }],
            me.interval = undefined;
            me.isPaused = false;
            me.volume = 1;
            me.barTime = 3000;
            me.isShowingTuning = true;
        },
        initializeGuitarStrings: function () {
            var me = this;
            me.guitarStrings[0].octaveNoteIndex = 28;
            me.guitarStrings[1].octaveNoteIndex = 23;
            me.guitarStrings[2].octaveNoteIndex = 19;
            me.guitarStrings[3].octaveNoteIndex = 14;
            me.guitarStrings[4].octaveNoteIndex = 9;
            me.guitarStrings[5].octaveNoteIndex = 4;
        },
        initializeAudioChannels: function () {
			var me = this;
            for (a = 0; a < me.channel_max; a++) {									// prepare the channels
                this.audiochannels[a] = new Array();
                this.audiochannels[a]['channel'] = new Audio();						// create a new audio object
                this.audiochannels[a]['finished'] = -1;							// expected end time for this channel
            }
        },
        createControlPanel: function () {
            var me = this;
            var aPlay = $('<a>')
                .addClass('playerButton')
                .addClass('play')
                .click(function () {
                    me.play();
                });
            var imgPlay = $('<img>');

            $(aPlay).append(imgPlay);

            var aPause = $('<a>')
            .addClass('disabled')
            .addClass('playerButton')
            .addClass('pause')
            .click(function () {
                me.pause();
            });
            $(aPause).append($('<img>'));
            
            var aStop = $('<a>')
             .addClass('disabled')
            .addClass('playerButton')
            .addClass('stop')
            .click(function () {
                me.stop();
            });
            $(aStop).append($('<img>'));

            var aSettings = $('<a>')
            .addClass('playerButton')
            .addClass('settings')
            .click(function () {
                me.settings();
            });
            $(aSettings).append($('<img>'));

            var aPreMinimize = $('<a>')
            .addClass('playerButton')
            .addClass('minimize')
            .click(function () {
                me.resizeToMinimize();
            });
            $(aPreMinimize).append($('<img>'));

            var aPreWindow = $('<a>')
            .addClass('playerButton')
            .addClass('window')
            .click(function () {
                me.resizeToWindow();
            });
            $(aPreWindow).append($('<img>'));

            var aPreMaximize = $('<a>')
            .addClass('playerButton')
            .addClass('maximize')
            .click(function () {
                me.resizeToMaximize();
            });
            $(aPreMaximize).append($('<img>'));

            var lblTempo = $('<span>').append('Bar duration (ms)');

            var ddlTempo = $('<select>').addClass('ddlTempo');
            for (var i = 500; i < 5000; i += 100) {
                var option = $('<option>').val(i).html(i);
                $(ddlTempo).append($(option));
            }

            var lblTuning = $('<span>').append('Tuning');

            var ddlTuning1 = $('<select>').addClass('ddlTuning1');
            $(ddlTuning1).append('<option note="C" value="0">C</option>');
            $(ddlTuning1).append('<option note="C#" value="1">C#</option>');
            $(ddlTuning1).append('<option note="D" value="2">D</option>');
            $(ddlTuning1).append('<option note="D#" value="3">D#</option>');
            $(ddlTuning1).append('<option note="E" value="4" selected>E</option>');
            var ddlTuning2 = $('<select>').addClass('ddlTuning2');
            $(ddlTuning2).append('<option note="F" value="5">F</option>');
            $(ddlTuning2).append('<option note="F#" value="6">F#</option>');
            $(ddlTuning2).append('<option note="G" value="7">G</option>');
            $(ddlTuning2).append('<option note="G#" value="8">G#</option>');
            $(ddlTuning2).append('<option note="A" value="9" selected>A</option>');
            var ddlTuning3 = $('<select>').addClass('ddlTuning3');
            $(ddlTuning3).append('<option note="A#" value="10">A#</option>');
            $(ddlTuning3).append('<option note="B" value="11">B</option>');
            $(ddlTuning3).append('<option note="C" value="12">C</option>');
            $(ddlTuning3).append('<option note="C#" value="13">C#</option>');
            $(ddlTuning3).append('<option note="D" value="14" selected>D</option>');
            var ddlTuning4 = $('<select>').addClass('ddlTuning4');
            $(ddlTuning4).append('<option note="D#" value="15">D#</option>');
            $(ddlTuning4).append('<option note="E" value="16">E</option>');
            $(ddlTuning4).append('<option note="F#" value="17">F</option>');
            $(ddlTuning4).append('<option note="F" value="18">F#</option>');
            $(ddlTuning4).append('<option note="G" value="19" selected>G</option>');
            $(ddlTuning4).append('<option note="G#" value="20">G#</option>');
            $(ddlTuning4).append('<option note="A" value="21">A</option>');
            var ddlTuning5 = $('<select>').addClass('ddlTuning5');
            $(ddlTuning5).append('<option note="G" value="19">G</option>');
            $(ddlTuning5).append('<option note="G#" value="20">G#</option>');
            $(ddlTuning5).append('<option note="A" value="21">A</option>');
            $(ddlTuning5).append('<option note="A#" value="22">A#</option>');
            $(ddlTuning5).append('<option note="B" value="23" selected>B</option>');
            $(ddlTuning5).append('<option note="C" value="24">C</option>');
            $(ddlTuning5).append('<option note="C#" value="25">C#</option>');
            $(ddlTuning5).append('<option note="D" value="26">D</option>');
            var ddlTuning6 = $('<select>').addClass('ddlTuning6');
            $(ddlTuning6).append('<option note="C" value="24">C</option>');
            $(ddlTuning6).append('<option note="C#" value="25">C#</option>');
            $(ddlTuning6).append('<option note="D" value="26">D</option>');
            $(ddlTuning6).append('<option note="D#" value="27">D#</option>');
            $(ddlTuning6).append('<option note="E" value="28" selected>E</option>');

            var divTabPlayerControls = $('<div>').addClass('tabPlayerControls').attr('tabPlayerId', me.tabPlayerId);
            $(me.el).attr('tabPlayerId', me.tabPlayerId);

            $(divTabPlayerControls).append($(aPlay));
            $(divTabPlayerControls).append($(aPause));
            $(divTabPlayerControls).append($(aStop));
            $(divTabPlayerControls).append($(aSettings));

            $(divTabPlayerControls).append($(aPreMaximize));
            $(divTabPlayerControls).append($(aPreWindow));
            $(divTabPlayerControls).append($(aPreMinimize));

            var divTempo = $('<div>').hide().addClass('barTime');
            $(divTempo).append($(lblTempo));
            $(divTempo).append($(ddlTempo));
            $(divTabPlayerControls).append($(divTempo));

            var divTuning = $('<div>').addClass('tuning');
            $(divTuning).append($(lblTuning));
            $(divTuning).append($(ddlTuning1));
            $(divTuning).append($(ddlTuning2));
            $(divTuning).append($(ddlTuning3));
            $(divTuning).append($(ddlTuning4));
            $(divTuning).append($(ddlTuning5));
            $(divTuning).append($(ddlTuning6));
            $(divTabPlayerControls).append($(divTuning));

            $(me.el).before($(divTabPlayerControls));
        },
        setupBarTime: function() {
            var me = this;
            var barTime = $(me.el).attr('barTime');
            if (barTime) {
                me.barTime = barTime;
                var option = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + '] select.ddlTempo option[value=' + barTime + ']');
                if (option.length > 0) {
                    $(option).prop('selected', true);
                }
            }
        },
        setupTuning: function () {
            var me = this;
            var tuning = $(me.el).attr('tuning');
            if (tuning) {
                var note = '';
                var stringIndex = 0;
                for (var i = tuning.length - 1; i >= 0; i--) {
                    note = tuning[i] + note;
                    var option = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + '] select.ddlTuning' + (6 - stringIndex) + ' option[note=' + note + ']');
                    if (option.length > 0) {
                        $(option).prop('selected', true);
                        note = '';
                        stringIndex++;
                    }
                }
            }
        },
        formatPre: function () {
            var me = this;
            var lines = $(me.el).html().split('\n');
            var html = ''

            var lineIndex = 0;
            var tabStripLine = -1;
            $(lines).each(function (index, line) {
                if (line.indexOf('-') >= 0 && line.indexOf('|') >= 0) {
                    var isNewTabStrip = false;
                    if (tabStripLine == -1) {
                        tabStripLine = index;
                        isNewTabStrip = true;
                    }

                    html += line.replace(/(\d+)/gm, function (expression, n1, n2) {
                        var noteName = 'note' + octaves[parseInt(me.guitarStrings[lineIndex].octaveNoteIndex) + parseInt(expression)];
                        return '<span class="note" title="' + noteName.replace(/\d/, '').replace('note', '') + '" string="' + lineIndex + '" pos="' + n2 + '" tabStripLine="' + tabStripLine + '">' + expression + '</span>';
                    }) + '\n';
                    lineIndex++;
                    if (lineIndex == 6)
                        lineIndex = 0;
                }
                else {
                    lineIndex = 0;
                    html += line + '\n';
                    tabStripLine = -1;
                }
            });
            $(me.el).html(html);

            var noteId = 1;
            $($(me.el).find('span.note')).each(function (index, span) {
                $(span).attr({ noteId: noteId++});
            });
        },

        play_multi_sound: function (s, stringIndex, volume) {
            var me = this;
            for (a = 0; a < me.audiochannels.length; a++) {
                var volume = me.audiochannels[a]['channel'].volume;
                me.audiochannels[a]['channel'].volume = (volume - .2) > 1 ? volume - .2 : volume;
            }

            for (a = 0; a < me.audiochannels.length; a++) {
                thistime = new Date();
                if (me.audiochannels[a]['finished'] < thistime.getTime()) {			// is this channel finished?
                    if (document.getElementById(s)) {
                        me.audiochannels[a]['finished'] = thistime.getTime() + document.getElementById(s).duration * 1000;
                        me.audiochannels[a]['channel'].src = document.getElementById(s).src;
                        me.audiochannels[a]['channel'].load();
                        me.audiochannels[a]['channel'].volume = [0.4, 0.5, 0.6, 0.7, 0.9, 1.0][stringIndex];
                        me.audiochannels[a]['channel'].play();
                        
                        break;
                    }
                }
            }
        },

        play: function () {
            var me = this;
            me.enablePauseButton();
            if (me.isPaused) {
                me.isPaused = false;
                return;
            }
            $(me.el).find('span.note').removeClass('played');
            var ddlTempo = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + '] select.ddlTempo');
            me.barTime = $(ddlTempo).val();

            $(me.guitarStrings).each(function (stringIndex, guitarString) {
                var ddlTuning = $('div[tabPlayerId=' + me.tabPlayerId + '] .ddlTuning' + (6 - stringIndex));
                me.guitarStrings[stringIndex].octaveNoteIndex = ddlTuning.val();
                me.guitarStrings[stringIndex].currentNoteIndex = 0;
            });

            var pre = $(me.el);
            var lines = $(pre).html().split('\n');
            var tabLines = ['', '', '', '', '', ''];
            var lineIndex = 0;
            $(lines).each(function (index, line) {
                if (line.indexOf('-') >= 0 && line.indexOf('|') >= 0) {
                    tabLines[lineIndex] = tabLines[lineIndex] + line.trim().substring(1).replace(/(<([^>]+)>)/ig, "");;
                    lineIndex++;
                    if (lineIndex == 6)
                        lineIndex = 0;
                }
                else {
                    lineIndex = 0;
                }
            });

            var stepCount = tabLines[0].trim().length

            var checkStep = function () {
                $(tabLines).each(function (index, tabLine) {
                    tabLine = tabLine.trim();
                    var fretValue = tabLine[step];
                    if (index == 0 && (fretValue == '|' || ('EADGBe'.indexOf(fretValue) >= 0))) {

                        var sub = tabLine.substring(step + 3);
                        var barLength = sub.indexOf('|');
                        if (barLength > 0) {
                            step += 1;
                            configureInterval(barLength);
                        }
                    }
                });
            }

            var playStep = function () {
                var stepCharLength = 1;
                var stepHasDoubleDigitNote = false;
                $(tabLines).each(function (index, tabLine) {
                    tabLine = tabLine.trim();
                    if (!isNaN(tabLine[step]) && !isNaN(tabLine[step + 1])) {
                        stepHasDoubleDigitNote = true;
                        return false;
                    }
                });

                $(tabLines).each(function (index, tabLine) {
                    tabLine = tabLine.trim();

                    var guitarString = me.guitarStrings[index];
                    var fretValue = '';
                    if (stepHasDoubleDigitNote) {
                        fretValue = (tabLine[step] + '' + tabLine[step + 1]).replace('-', '');
                        stepCharLength = 2;
                    }
                    else {
                        fretValue = tabLine[step];
                    }


                    if (!isNaN(fretValue)) {
                        var span = $(me.el).find('span.note[string=' + index + ']:eq(' + me.guitarStrings[index].currentNoteIndex + ')');
                        $(span).addClass('played').addClass(fretValue.length == 1 ? 'onedigit' : 'twodigits');
                        fretValue = parseInt(span.html());
                        me.guitarStrings[index].currentNoteIndex++;

                        var noteName = 'note' + octaves[parseInt(guitarString.octaveNoteIndex) + parseInt(fretValue)];

                        me.play_multi_sound(noteName, index, me.volume);
						
                        me.volume = .5;
                
                        me.noteSeq++;						
                    }
                });
                return stepCharLength;
            }

            var configureInterval = function (newBarLength) {
                if (me.interval)
                    clearInterval(me.interval);

                me.interval = setInterval(function () {
                    if (!me.isPaused) {
                        checkStep();
                        var stepCharLength = playStep();
                        step += stepCharLength;
                        if (step >= stepCount) {
                            clearInterval(me.interval);
                            me.enablePlayButton();
                        }
                    }
                }, me.barTime / me.BAR_LENGTH);
            }

            var step = 0;

            configureInterval(me.BAR_LENGTH);
        },
        
        stop: function () {
            var me = this;
            me.step = 0;
            clearInterval(me.interval);
            me.enablePlayButton();
        },

        pause: function() {
            var me = this;
            me.isPaused = !me.isPaused;
            if (me.isPaused)
                me.disableStopButton();
            else 
                me.enableStopButton();
        },

        settings: function() {
            var me = this;
            me.isShowingTuning = !me.isShowingTuning;

            var playerControls = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + ']');
            if (me.isShowingTuning) {
                $(playerControls).find('div.tuning').show();
                $(playerControls).find('div.barTime').hide();
            } else {
                $(playerControls).find('div.barTime').show();
                $(playerControls).find('div.tuning').hide();
            }
        },

        enablePlayButton: function () {
            var me = this;
            var playerControls = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + ']');
            $(playerControls).find('.playerButton.play').removeClass('disabled');
            $(playerControls).find('.playerButton.pause').addClass('disabled');
            $(playerControls).find('.playerButton.stop').addClass('disabled');
        },

        enablePauseButton: function () {
            var me = this;
            var playerControls = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + ']');
            $(playerControls).find('.playerButton.play').addClass('disabled');
            $(playerControls).find('.playerButton.pause').removeClass('disabled');
            $(playerControls).find('.playerButton.stop').removeClass('disabled');
        },

        enableStopButton: function () {
            var me = this;
            var playerControls = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + ']');
            $(playerControls).find('.playerButton.stop').removeClass('disabled');
        },

        disableStopButton: function () {
            var me = this;
            var playerControls = $('div.tabPlayerControls[tabPlayerId=' + me.tabPlayerId + ']');
            $(playerControls).find('.playerButton.stop').addClass('disabled');
        },

        resizeToMinimize: function () {
            var me = this;
            var pre = $('pre[tabPlayerId=' + me.tabPlayerId + ']');
            $(pre).removeClass('window').addClass('minimize');
        },

        resizeToWindow: function () {
            var me = this;
            var pre = $('pre[tabPlayerId=' + me.tabPlayerId + ']');
            $(pre).removeClass('minimize').addClass('window');
        },

        resizeToMaximize: function () {
            var me = this;
            var pre = $('pre[tabPlayerId=' + me.tabPlayerId + ']');
            $(pre).removeClass('minimize').removeClass('window');
        }
    });

}(jQuery));

$(function () {
    $('pre[lang=tabplayer]').setupTabPlayer();
});

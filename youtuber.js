// -*- indent-tabs-mode: nil; -*-

/* Copyright (C) 2013-2014 Volker Sobek
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */


var LOAD_N_MORE_ENTRIES = 15;
var START_LIMIT = 15;
var PLAYER_HEIGTH = 390;
var MAX_RESULTS = 5; // how many entries to fetch per channel?

var currentlyPlayingItem = undefined;
var channelsSelect;
var videos = [];
var lastEntry = undefined;
var indexNextVideo = 0;
var nextContent = undefined;
var endReached = false;
var spinnerTimeoutID = undefined;
var videoList;
var progressText;
var bottomElement;
var playerBox;
var updateButton;
var infoBox;
var infoBoxText = '<p>There are no channels specified in ./channels.js. \
You can follow channels by creating the file channels.js containing content of the form:</p>'
    + '<p>channels="channel_1 channel_2 ..."</p>'
    + '<p>to follow www.youtube.com/user/channel_1, www.youtube.com/user/channel_2, ...'
    + '<p>and then reload this page.</p>'

// String.contains not available in webkit
if (!('contains' in String.prototype))
    String.prototype.contains = function(str, startIndex) {
        return -1 !== String.prototype.indexOf.call(this, str, startIndex);
    };

// Creates a new Channel object for the given youtube channel @id. @id
// can be an old-style channel name, too.
function Channel(id) {
    this.id = id;
    this.name = undefined;
    this.videos = undefined;
}

// yts.html loads channels from the channels variable in ./channels.js
if (channels == "") {
    window.console.log("Warning: Falling back to default channels!");
    channels = "google youtube"
}

window.console.log("channels: " + channels);

// This can be old style www.youtube.com/user/name channel names or new style
// www.youtube.com/channel/UC{user id} here.
channelIDs = channels.trim().split(/\s+|\s*,\s*/);
channels = [];
channelIDs.forEach(function(id) {
    var c = new Channel(id);
    channels.push(c);
});

function sortAndUniqueArray(array) {
    var result = [];
    if (array.length > 0) {
        array.sort();
        result[0] = array[0];
        for (var i = 1; i < array.length; i++) {
            if (array[i] != array[i - 1])
                result.push(array[i]);
        }
    }
    return result;
}

// From https://developers.google.com/youtube/iframe_api_reference
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: PLAYER_HEIGTH,
        width: '640',
        //videoId: '',
        events: {
            'onReady': onPlayerReady,
            // 'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    window.console.log("Player ready!");
    if (videos[0])
        player.cueVideoById(videos[0].media$group.yt$videoid.$t);
    // event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
// var done = false;
// function onPlayerStateChange(event) {
//     if (event.data == YT.PlayerState.PLAYING && !done) {
//         setTimeout(stopVideo, 6000);
//         done = true;
//     }
// }
// function stopVideo() {
//     player.stopVideo();
// }


// DEBUG function
function printListDates() {
    videos.forEach(function (e) {
        window.console.log(e.published.$t);
    });
}

function StatisticsBar(entry) {
    this.entry = entry;
    this.element = document.createElement("div");

    this.views = document.createElement("div");

    this.statisticsBarBackground = document.createElement("div");
    this.likesBar = document.createElement("div");
    this.dislikesBar = document.createElement("div");

    this.infoString = document.createElement("div");
    this.infoString.className = "statistics-bar-info-string";

    this.noVotesInfo = document.createElement("div");
    this.noVotesInfo.id = "no-votes-info";
    this.noVotesInfo.innerHTML = "Statistics Unavaiable";

    this.element.className = "statistics-bar";
    this.views.className = "views";
    this.statisticsBarBackground.className = "statistics-bar-background";
    this.likesBar.className = "statistics-bar-likes";
    this.dislikesBar.className = "statistics-bar-dislikes";

    this.element.appendChild(this.views);
    this.statisticsBarBackground.appendChild(this.likesBar);
    this.statisticsBarBackground.appendChild(this.dislikesBar);
    this.element.appendChild(this.statisticsBarBackground);
    this.element.appendChild(this.infoString);
}

StatisticsBar.prototype.updateValues =  function() {
    try {
        this.views.innerHTML = "Views: "+ addThousandsSep(this.entry.yt$statistics.viewCount);
    } catch (error) {
        this.views.innerHTML = "Views: not available";
    }

    try {
        var numLikes = Number(this.entry.yt$rating.numLikes);
        var numDislikes = Number(this.entry.yt$rating.numDislikes);
        var sum = numLikes + numDislikes;
        if (sum <= 0) {
            this.likesBar.style.visibility = "hidden";
            this.dislikesBar.style.visibility = "hidden";
        } else {
            this.likesBar.style.width = (numLikes / sum * 100) + "%";
            this.dislikesBar.style.width = (numDislikes / sum * 100) + "%";
            this.likesBar.style.visibility = "visible";
            this.dislikesBar.style.visibility = "visible";
            this.statisticsBarBackground.style.backgroundColor = "#eeeeee";
        }
        this.infoString.innerHTML = "+"
            + addThousandsSep(numLikes) + " / -"
            + addThousandsSep(numDislikes);
    } catch (error) {
        this.infoString.innerHTML = "+/- not available";
        this.statisticsBarBackground.style.backgroundColor = "gray";
    }
}

function addThousandsSep(number) {
    number = String(number);
    var a = [];
    while (number.length > 0) {
        a.push(number.slice(-3));
        number = number.slice(0, -3);
    }
    a.reverse();
    return a.join(",");
}

function timeStringFromSeconds(totalSeconds) {
    // Convert seconds to a human readable string
    //
    // The returned string is of the form HH:MM:SS with the HH: part
    // omitted if hours are 0, and with the MM: using a filling 0 if
    // the HH: part exists.
    var totalMinutes;
    var totalHours;
    var minutes;
    var seconds;
    var string = "";

    seconds = totalSeconds % 60;
    totalMinutes = (totalSeconds - seconds) / 60;
    minutes = totalMinutes % 60;
    totalHours = (totalMinutes - minutes) / 60;

    seconds = seconds < 10 ? "0" + seconds : seconds;

    if (totalHours > 0) {
        minutes = minutes < 10 ? "0" + minutes : minutes;
        string = totalHours > 0 ? totalHours + ":" : "";

    }

    return string + minutes + ":" + seconds;

}

function humanDeltaTimeFromSeconds(seconds) {
    var minInSecs = 60;
    var hourInSecs = 3600;
    var dayInSecs = 24 * hourInSecs;
    var weekInSecs = 7 * dayInSecs;
    var monthInSecs = 31 * dayInSecs;
    var yearInSecs = 356 * dayInSecs;

    if (seconds >= yearInSecs) {
        var years = Math.floor(seconds / yearInSecs);
        return years + (years > 1 ? " years" : " year") + " ago";
    } else if (seconds >= monthInSecs) {
        var months = Math.floor(seconds / monthInSecs);
        return months + (months > 1 ? " months" : " month") + " ago";
    } else if (seconds >= weekInSecs) {
        var weeks = Math.floor(seconds / weekInSecs);
        return weeks + (weeks > 1 ? " weeks" : " week") + " ago";
    } else if (seconds >= dayInSecs) {
        var days = Math.floor(seconds / dayInSecs);
        return days + (days > 1 ? " days" : " day") + " ago";
    } else if (seconds >= hourInSecs) {
        var hours = Math.floor(seconds / hourInSecs);
        return hours + (hours > 1 ? " hours" : " hour") + " ago";
    } else if (seconds >= minInSecs) {
        var mins = Math.floor(seconds / minInSecs);
        return mins + (mins > 1 ? " minutes" : " minute") + " ago";
    } else {
        var seconds = Math.floor(seconds / secondInSecs);
        return "Less than a minute ago";
    }

}

function clearVideosOnPage() {
    while (videoList.firstChild) {
        videoList.removeChild(videoList.firstChild);
    }
    indexNextVideo = 0;
}

function reload() {
    window.console.log("reload ...");
    clearVideosOnPage();
    videos = [];
    //localStorage.clear();
    update();
}

// Fetch updates for all channels
function update() {
    window.console.log("update ...");
    if (channels.length == 0) {
        progressText.innerHTML = "No channels given!";
        infoBox.style.display = "block";
        return;
    }
    infoBox.style.display = "none";

    progressText.innerHTML = "Checking for updates ...";

    // Remove color marks from previously new items.
    // We can't search for 'item new' here, since the collection is updated live,
    // and would change when 'new' class was removed from element.
    var previouslyNewItems = document.getElementsByClassName("item");
    for (var i = 0; i < previouslyNewItems.length; i++) {
        var item = previouslyNewItems[i];
        item.className = item.className.replace("new", "");
    }

    var button = document.getElementById("updateButton");
    button.disabled = true;

    // This will call updateVideosOnPage() once all gdata requests have finished
    requestVideoEntries(channels, updateVideosOnPage);
}

function replaceVideosOnPage(newList) {
    videos = [];
    clearVideosOnPage();
    updateVideosOnPage(newList);
}

function updateVideosOnPage(newList) {
    //window.console.log("updateVideosOnPage: " + newList);
    var newVideos = []; // list of the videos that are new (not in @videos)
    var lim;
    var updateDate;
    var button = document.getElementById("updateButton");
    var topElement = document.getElementById("topElement");
    var timeString;
    var alreadyHaveVideos = videos.length != 0;
    var updateFinished = false;

    newList.sort(sortEntriesByDateFn);

    if (alreadyHaveVideos) {
        // incremental update

        // Update information for all videos already shown on the page
        for (var i = 0; i < indexNextVideo; i++) {
            var element = document.getElementById(videos[i].media$group.yt$videoid.$t);
            if (element) {
                element.videoEntry.updateValues (videos[i]);
            }
        }
        window.console.log("Updated %i video entries on page", indexNextVideo);

        // Push new videos in the @newVideos array
        for (var i = 0; i < newList.length; i++) {
            // FIXME: This fails badly when videos[0] has been deleted,
            // because then we wrongly consider all videos as new and
            // prepend them again.
            if (newList[i].id.$t == videos[0].id.$t) {
                break;
            } else {
                newVideos.push(newList[i]);
                indexNextVideo++;
            }
        }

        // no limit for incremental update
        lim = newVideos.length;

    } else {
        // we didn't have any videos so far
        newVideos = newList;
        // limit number of initially shown videos
        lim = Math.min(START_LIMIT, newVideos.length);
        indexNextVideo = lim;
    }
    videos = newList;
    // FIXME: Not using local storage atm because this exceeds local
    // storage in firefox if you have ~ 100 channels
    //localStorage.setItem('videos', JSON.stringify(videos));
    addNewVideos(newVideos, lim, alreadyHaveVideos);

    updateDate = new Date();
    timeString = ("0" + updateDate.getHours()).slice(-2);
    timeString += ":";
    timeString += ("0" + updateDate.getMinutes()).slice(-2);
    progressText.innerHTML = "Last Update: " + timeString;

    button.disabled = false;
    // Show the most recent video in the player, if no video is
    // playing currently

    // if(videos[0] &&
    //    // is the player ready?
    //    player.cueVideoById &&

    //    // player.getPlayerState(): Number Returns the state of the
    //    // player. Possible values are unstarted (-1), ended (0),
    //    // playing (1), paused (2), buffering (3), video cued (5).
    //    [1, 2, 3].indexOf(player.getPlayerState()) == -1) {
    //     window.console.log("cueVideoById: "+ videos[0].media$group.yt$videoid.$t);
    //     player.cueVideoById(videos[0].media$group.yt$videoid.$t);
    // }
    if (! videos[indexNextVideo])
        bottomElement.style.display = "none";
    updateSelectBox();
}

function movePlayerToElement(element) {
    if (element == currentlyPlayingItem)
        return;

    // shrink / expand
    element.className = "item playing";
    if (currentlyPlayingItem)
        currentlyPlayingItem.className = "item expanded";

    var p = document.getElementById('player-box');
    p.style.top = (element.getBoundingClientRect().top +
                   window.scrollY - PLAYER_HEIGTH - 6) + "px";
    p.style.left = (element.getBoundingClientRect().left + "px");
    currentlyPlayingItem = element;
    document.getElementById('player-box').style.display = "inline";

    // Start playing the current video, if player was was already
    // playing, otherwise just cue it.
    if (player.getPlayerState() == 1)
        player.loadVideoById(element.id)
    else
        player.cueVideoById(element.id);
}

function VideoEntry(entry) {
    //window.console.log("VideoEntry:", entry);
    //var id = entry.id.$t.split(":")[3]
    this.element = document.createElement("li");

    var id = entry.media$group.yt$videoid.$t;
    this.element.id = id;
    this.element.videoEntry = this;

    this.imgLink = document.createElement("div");
    this.img = document.createElement("img");
    this.duration = document.createElement("span");

    this.infoBox = document.createElement("div");
    this.title = document.createElement("h4");
    this.titleLink = document.createElement("a");
    this.titleLink.target = "_blank";
    this.author = document.createElement("a");
    this.author.target = "_blank";
    this.description = document.createElement("p");
    this.commentsCount = document.createElement("a");
    this.commentsCount.target = "_blank";
    this.time = document.createElement("div");

    this.videoUrl = "https://www.youtube.com/watch?v=" + id;
    this.channelUrl = "https://www.youtube.com/channel/UC" + entry.author[0].yt$userId.$t;

    this.duration.className = "duration";
    this.duration.innerHTML = timeStringFromSeconds(Number(entry.media$group.yt$duration.seconds));
    this.imgLink.className = "thumb";
    this.imgLink.appendChild(this.img);
    this.imgLink.appendChild(this.duration);
    this.imgLink.onclick = function() {
        movePlayerToElement(this);
    }.bind(this.element);

    this.titleLink.href = this.videoUrl;
    this.title.className = "title";
    this.title.appendChild(this.titleLink);

    this.author.className = "author";
    this.author.href = this.channelUrl;

    this.description.className = "description";

    this.commentsCount.className = "comments-count";
    this.commentsCount.href = "https://www.youtube.com/all_comments?v=" + id;
    this.commentsCount.title = "https://www.youtube.com/all_comments?v=" + id;

    this.time.className = "time";

    this.infoBox.className = "info-box";
    this.infoBox.appendChild(this.title);
    this.infoBox.appendChild(document.createTextNode(" by "));
    this.infoBox.appendChild(this.author);
    this.infoBox.appendChild(this.time);
    this.infoBox.appendChild(this.description);
    this.infoBox.appendChild(this.commentsCount);

    this.statisticsBar = new StatisticsBar(entry);
    this.infoBox.appendChild(this.statisticsBar.element);

    this.element.className = "item";
    this.element.appendChild(this.imgLink);
    this.element.appendChild(this.infoBox);

    this.updateValues(entry);
}

// Updates all values that can change
VideoEntry.prototype.updateValues = function(entry) {
    this.entry = entry;

    this.img.src = this.entry.media$group.media$thumbnail[1].url;

    this.titleLink.title = this.entry.media$group.media$title.$t;
    this.titleLink.innerHTML = this.entry.media$group.media$title.$t;

    this.author.innerHTML = this.entry.author[0].name.$t;
    this.description.innerHTML = this.entry.media$group.media$description.$t;

    this.commentsCount.innerHTML = "Comments: " + (this.entry.gd$comments ? this.entry.gd$comments.gd$feedLink.countHint : 'not available');

    var timeDiff = (new Date() - new Date(this.entry.published.$t)) / 1000;
    this.time.innerHTML = humanDeltaTimeFromSeconds(timeDiff); // + "(" + this.entry.published.$t + ")";

    // Update the statistics bar
    try {
        this.statisticsBar.updateValues();
    } catch (error) {
        window.console.info("Can't access rating because of: ", error);
    };
}

function addNewVideos(newVideos, lim, markNewVideos) {
    var parentNode = document.getElementById("video-list");
    var newItem;
    var entry;
    var oldTopVideo = parentNode.firstChild;
    if (newVideos[0]) {
        for (var i = 0; i < lim ; i++) {
            entry = newVideos[i];
            //TODO think this over
            if (!entry) {
                break;
            }
            newItem = new VideoEntry(entry);
            newItem.element.className = markNewVideos ? "item new" : "item";
            parentNode.insertBefore (newItem.element, oldTopVideo);
            window.setTimeout(function () {
                this.className += " expanded";
            }.bind(newItem.element), 100);
        }
    }
}

function sortEntriesByDateFn(a, b){
    if (a.published.$t > b.published.$t) return -1;
    if (a.published.$t < b.published.$t) return 1;
    return 0;
}

// Fetches the video entries for each channel in @channels and pushes
// each entry to the @videoEntries array. Once no more requests are in
// progress, call @onCompleteCb(@videoEntries).
function requestVideoEntries(channels, onCompleteCb) {
    var waitingForNRequestFeed = 0;
    var videoEntries = [];
    channels.forEach(function (chan) {
        var request = new XMLHttpRequest();
        request.addEventListener("load", function() {
            if (request.responseText) {
                // window.console.log("channel:", chan);
                response = eval('(' + request.responseText + ')');
                //window.console.log("response: " + response);

                // Make sure chan.id is the new style user id, and
                // store the user's name seperately
                try {
                    chan.id = response.feed.author[0].yt$userId.$t;
                } catch (e) {
                    window.console.info("Channel " + chan.id + " has no youtube user id yet" );
                };
                chan.name = response.feed.author[0].name.$t;

                //window.console.log("chan.id: " + chan.id);
                //window.console.log("chan.name: " + chan.name);
                //window.console.log(response.feed);
                var entries = response.feed.entry || [];
                chan.videos = entries;
                entries.forEach(function (e) {
                    videoEntries.push(e);
                })
                if (--waitingForNRequestFeed == 0) {
                    updateSelectBox;
                    onCompleteCb(videoEntries);
                }
            }
            else {
                window.console.log("Could not evaluate response for channel " + chan);
            }
        });
        window.console.log("getting http://gdata.youtube.com/feeds/api/users/" +
                           chan.id + "/uploads?alt=json&v=2&orderby=published&max-results=" + MAX_RESULTS);
        request.open("GET", "http://gdata.youtube.com/feeds/api/users/" +
                     chan.id + "/uploads?alt=json&v=2&orderby=published&max-results=" + MAX_RESULTS, true);
        waitingForNRequestFeed++;
        request.send();
    });
}

function addMoreContent(numberOfEntries) {
    numberOfEntries = numberOfEntries ? numberOfEntries : LOAD_N_MORE_ENTRIES;
    var parentNode = document.getElementById("video-list");
    var nextItem;
    // log("parentNode: ", parentNode);
    var count;
    var entry;

    if ((spinnerTimeoutID != undefined) || endReached)
        return;

    if (! nextContent) {
        nextContent = [];
        count = 0;
        while (count < numberOfEntries && videos[indexNextVideo + count]) {
            entry = videos[indexNextVideo + count];
            // log(VideoEntry(entry));
            nextItem = new VideoEntry(entry);
            nextContent.push(nextItem.element);
            count++;
        };
        indexNextVideo += count;
    }

    if (nextContent[0]) {
        // bottomElement.style.backgroundImage = "url(spinner.gif)";
        spinnerTimeoutID = window.setTimeout(
            function() {
                bottomElement.style.backgroundImage = "none";
                spinnerTimeoutID = undefined;
                //  cancel the loading if the page was scrolled up again
                //  during the timeout
                if (window.scrollY >= document.body.clientHeight - window.innerHeight - 10) {
                    nextContent.forEach(function(element) {
                        parentNode.appendChild(element);
                        element.className = "item expanded";
                    })
                    nextContent = undefined;
                }
            },
            100);
    }

    if (! videos[indexNextVideo]) {
        bottomElement.style.display = "none";
        endReached = true;
    } else {
        bottomElement.style.display = "block";
    }
}

window.onscroll = function() {
    if  (window.scrollY >= document.body.clientHeight - window.innerHeight - 10){
        addMoreContent();
    }
};

function onChannelInputEvent(event) {
    var string = event.target.value.toLowerCase();
    var matches = "";

    // // Start Debug
    // channels.forEach(function (channel) {
    //  if (channel.toLowerCase().contains(string)) {
    //      matches += channel + " ";
    //  }
    // })
    // window.console.log ('Matching channels for "' + event.target.value + '":' + matches);
    // // End Debug

    // Hide non-matchin options. .hidden only works in Firefox!
    for (var i = 0; i < channelsSelect.options.length; i++) {
        channelsSelect.options[i].hidden =
            ! channelsSelect.options[i].text.toLowerCase().contains(string);
    }
}

function onAddChannels() {
    window.console.log("Adding channels from input string: '" + channelInput.value + "'");
    var channelsToAdd = channelInput.value.trim().split(/\s+|\s*,\s*/);
    channelInput.value = "";
    //Note: When the string is empty, split returns an array
    //containing one empty string, rather than an empty array.
    if (channelsToAdd[0] == "")
        return;

    var newChannelsToAdd = [];
    channelsToAdd = sortAndUniqueArray(channelsToAdd);
    channelsToAdd.forEach(function (chanID) {
        var i = -1;
        var alreadyPresent = false;
        while (channels[++i]) {
            if (channels[i].id == chanID || channels[i].name == chanID) {
                alreadyPresent = true;
                break;
            }
        }
        if (!alreadyPresent)
            newChannelsToAdd.push({ id: chanID,
                                    name : undefined,
                                  });
    });

    if (newChannelsToAdd.length == 0) {
        window.console.log("Already following all given channels: "
                           + channelsToAdd.join(", "));
        return;
    }

    channels = channels.concat(newChannelsToAdd);
    channels.sort(function (a, b) {
        return a.name < b.name;
    });

    // Only request video entries for the new channels, not the old ones
    requestVideoEntries(newChannelsToAdd, function (resultList) {
        var newList = videos.concat(resultList);
        replaceVideosOnPage(newList);
        //localStorage.setItem('channels', JSON.stringify(channels));
    });
}

function getChanByNameOrID() {
}

function onDeleteChannles() {
    var selection = [];
    for (var i = 0; i < channelsSelect.options.length; i++) {
        if (channelsSelect.options[i].selected) {
            selection.push(channelsSelect.options[i].id);
        }
    }
    if (selection.length != 0) {
        window.console.log("Deleting channels: " + selection);
        selection.forEach (function (chanID) {
            // delete channels
            var i = -1;
            while (channels[++i]) {
                if (channels[i].id == chanID) {
                    channels.splice(i, 1);
                    break;
                }
            }
            deleteVideosOfChannel(chanID);

        });
        updateSelectBox();
        //localStorage.setItem('channels', JSON.stringify(channels));
        //localStorage.setItem('videos', JSON.stringify(videos));
        replaceVideosOnPage(videos);
        //window.console.log("channels atfer deleting: " + channels)
    } else {
        window.console.log ("Can't delete; no channels selected");
    }
    channelInput.value = "";
}

function deleteVideosOfChannel(chanID) {
    videos = videos.filter(function (entry) {
        return (entry.author[0].yt$userId && entry.author[0].yt$userId.$t != chanID) &&
            (entry.author[0].name.$t != chanID)
    });
}

function updateSelectBox() {
    while (channelsSelect.firstChild)
        channelsSelect.removeChild(channelsSelect.firstChild);
    channels.forEach(function (channel) {
        var o = document.createElement("option");
        //o.value = "xxx"
        o.id = channel.id;
        o.text = channel.name ? channel.name : channel.id;
        channelsSelect.add(o);
    });
}

function init() {
    window.console.log ("init ...");
    progressText = document.getElementById("progress-text");
    bottomElement = document.getElementById("bottom-element");
    channelsSelect = document.getElementById("channels-select");
    channelInput = document.getElementById("channels-input");
    videoList = document.getElementById("video-list");
    infoBox = document.getElementById("info-box");

    channelInput.oninput = onChannelInputEvent;
    infoBox.innerHTML = infoBoxText;
    infoBox.style.display = "none";

    // window.scrollY = 0;

    
    // var localChannels = JSON.parse(localStorage.getItem('channels'))

    // if (localChannels.length > 0) {
    //     channels = localChannels;
    //     window.console.log("Using channels from local storage");
    // } else {
    //     channels = sortAndUniqueArray(channels);
    //     localStorage.setItem('channels', JSON.stringify(channels));
    // }
    updateSelectBox();

    // var localVideos = JSON.parse(localStorage.getItem('videos'));
    // if (localVideos) {
    //     window.console.log("Using video list from local storage");
    //     progressText.innerHTML = "Loaded video list from local storage";
    //     videos = [];
    //     updateVideosOnPage(localVideos);
    // } else {
    //     update();
    // }
    update();
}

window.onload = init;

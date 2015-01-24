youtuber
========

The place to follow all your favorite YouTube channels *without any
kind of account or registration*. And of course it's free. You can
start using it right now at http://imftc.github.io/youtuber/!


How it works
------------

youtuber fetches the latest video uploads for the given
channels using Google's Data API (gdata), presents them
chronologically and allows playing them in place.

The page doesn't collect any kind of data related to YouTube, it
doesn't even know what channels you add or videos you watch; all
communication with youtube.com is happening between your browser and
youtube.com directly. Because you don't need any kind of account,
saving your channel list must be done in the local storage of your
browser. Therefore you have to make sure that the local storage for
http://imftc.github.io/youtuber/ is not cleared when quitting your
browser, otherwise the next time you visit the page your channel list
will only show the two default channels 'google' and 'youtube' again.


Usage
-----

1. Visit http://imftc.github.io/youtuber/
2. Add channels
3. Watch videos!


Local Usage
-----------

Instead of visiting http://imftc.github.io/youtuber/ directly you can
clone this repo and open index.html with your browser. You can then
also create a file named channels.js in that directory to permanently
store the list of your channels. The file channels.js.sample contains
more information on that.


Help welcome!
-------------

The page works currently good enough for me, so I don't plan to work
on it in the near future. But of course it could be a lot better here
and there and offer more features and look nicer. So, if you have
ideas/fixes, open a pull request here so that everyone can profit!
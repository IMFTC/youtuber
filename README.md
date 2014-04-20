youtuber
========

About
-----

youtuber is a simple web page for following and watching the latest
video uploads on your favorite YouTube channels, *without the need of
a Google account*. It fetches the latest video uploads for the given
channels (using Google's Data API (gdata)),presents them
chronologically and allows playing them in place.

Usage
-----

1. Open the youtuber.html file with your browser
2. Add channels
3. Click the Update button to check for new videos

Important
---------

To permanently store the channels you follow, add their names in the
channels.js file. Otherwise added channels will be forgotten once you
delete cookies, since local storage is deleted together with cookies
in most browsers. Local storage support is possible but currently
disabled (commented out) because it causes loading of the page to fail
when you reach around 100 channels firefox allows.

Even more important
-------------------

I know the code is messy and buggy and I have no ambitions to clean
this up atm! ;)


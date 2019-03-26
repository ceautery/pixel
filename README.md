Pixel
=====

Pixel is a node.js game server paired with a vanilla Javascript pixel editor, for intro game design classes. Students use Google auth to connect to their own workspace, and can create low-res animations for characters in some simple arcade games.

## Included games

* Space Invaders

A game with a similar look and feel to the arcade classic.

* Dark Blue

Design talking points
=====================

* Web server vs. application server (serve-index vs. nginx redirects)
* Mapping users to workspaces
* Templates for game characters
* Building a UI without an MVC framework
  - Skipping transpilers and bundlers (babel, gulp, webpack, sass)
  - API calls with async/await and fetch
* Building animations from spritesheets
* Scaling without blurring
* How to write an image editor
  - Kids click on things to see what they do
  - Iterating from feedback and observing users
  - SAVE!!!
* Time-travel editing with websocket-based autosave and infinite undo

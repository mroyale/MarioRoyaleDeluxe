# Mario Royale Deluxe Patch Notes
## Version 2.11.1
### 2023-03-11 - Hotfix
* Added Lost Levels W1 to world select

## Version 2.11.0
### 2023-03-10 - Content Patch
* Happy MAR10 day! (if you’re in America)
* Added World 1 from The Lost Levels

## Version 2.10.0
### 2023-03-09 - Improvements
* Fixed koopas falling very fast
* Bowser’s dying behavior is closer to the original SMB game
* Added parameters to Piranha Plant: Direction, static and no offset
* The game looks better on phones and smaller displays now
* Saving a world in the editor results in a much cleaner output that’s easier to read

## Version 2.9.0
### 2023-03-08 - Editor Patch
* The editor now tells you where platforms move
>   You can toggle this with the L key

## Version 2.8.1
### 2023-03-07 - Bugfix
* Fixed keyboard rebinding and testing not working while in-game

## Version 2.8.0
### 2023-03-06 - Content Patch
* Added new tile: Player Barrier
* Bugfixes and improvements

## Version 2.7.3
### 2023-03-05 - Editor Dark Mode
* The editor’s dark mode looks much better now. No more white input boxes or anything

## Version 2.7.2
### 2023-03-05 - Editor Patch
* When resizing a zone, objects, warps and spawnpoints no longer change their vertical position

## Version 2.7.1
### 2023-03-05 - Patches
* The test color for the controls menu is gold instead of green, so that you can see it better
* Fixed issues with metal spiny not working
* Fixed the brick block in 4-2 missing the star powerup
>   Thanks to Captain for this fix!

## Version 2.7.0
### 2023-03-04 - Content Patch
* The controls menu is now part of the main page
* You can also now change your controls while in-game!
* And the keyboard controls are now human-readable!!
>   Note that the key shown may be different due to keyboard layout differences.
* Added metal variant to spinies
>   These metal spinies behave like the ones in Mario Forever; they can’t be killed with fireballs. The only way to take them out is with the Star and Super Leaf.
* Reduced data usage with fetching leaderboard data

## Version 2.6.1
### 2023-03-03 - Hotfix
* Flag object is no longer required for flagpole sliding

## Version 2.6.0
### 2023-03-01 - Content and Technical Patches
* Happy Bosnian Independence Day!
>   Random but I want to celebrate my country’s holiday :)
* Added dev menu for developers
>   Just backporting things from Legacy. Moderation tools.
* Various small improvements and bugfixes

## Version 2.5.0
### 2023-02-26 - Game and Editor Improvements
* While ingame, you can go to the settings menu to return to the main menu or the lobby instantly
* Returning to the main menu now skips the disclaimer
>   You still have to wait at it for a second or two since the background needs to load
* Added tooltips to object parameters in the editor
* Warp pipes and tiles now use a dropdown menu so you won’t need to memorize warp IDs in the editor

## Version 2.4.0
### 2023-02-22 - Content Patch
* Added flip blocks
>   No worlds use this, again, for more variety for world builders
* Fixed death sprite being.. well.. weird

## Version 2.3.1
### 2023-02-22 - 99% Bugfixes
* Added a debug option to set your powerup
* Fixed funky sprite offsets while transforming from small to big forms
* Fixed a Super Leaf exploit allowing you to clip through tiles while crouch jumping
* Fixed being stuck in the idle animation if you were hit while crouch jumping
* Changed data type info in the editor to what it’s supposed to be

## Version 2.3.0
### 2023-02-21 - Content Patch
* Added crouch jumping
* Added a toggle in the settings to disable backgrounds
>   This is to improve performance on underpowered devices especially for worlds like Blackout Ring. However, this feature may not work completely since some worlds rely on backgrounds and such don’t use a reasonable background color.
* Small form now uses 16×32 instead of 16×16 sprites
>   To make modders’ lives easier
* The life icon uses the proper character head instead of their idle sprite
* Updated character select sprites so they don’t shrink
>   Not applied to Infringio since he was already fine. Thanks to Captain for helping with this!

## Version 2.2.2
### 2023-02-20 - Hotfix
* Fixed incorrect editor tool instructions

## Version 2.2.1
### 2023-02-20 - Hotfix
* Reverted leaderboard request interval adjustment

## Version 2.2.0
### 2023-02-20 - Content Patch
* New PvP world: Blackout Ring
>   This is an original map created by Sir Sins, Ray, Captain, Noemi, Syembol and Scyrulean. Enjoy!
* Slightly changed the disabled nickname icon

## Version 2.1.2
### 2023-02-19 - Hotfix
* Adjusted leaderboard request interval
>   This patch comes alongside server changes that fix database issues caused by the leaderboard. Due to the severity, we had to rollback to yesterday’s database, so some stats were lost. We apologize for the inconvenience.

## Version 2.1.1
### 2023-02-19 - Hotfix
* Slightly adjusted jump physics again

## Version 2.1.0
### 2023-02-19 - Content Patch
Leaderboards are back!
>   Press the leaderboards button on the main menu while logged in to see who are the best Mario Royale players!
* Improved control when crouching under a block
* You can now jump instead of just sliding, allowing you to move in both directions
* Enemies now use the proper stomping sound effect
* Slightly adjusted the physics
* Jumping physics are now slightly more like in SMB1, shorter jumps and all

## Version 2.0.0
### 2023-02-18 - The Wario Update
* Added Wario as the 4th character!
>   “How could you forget Wario’s tremendous wit? You can’t claim the Wit Star Stamp yet!”
* Added our beloved contributors to the credits area in the lobby

## Version 1.10.0
### 2023-02-18 - Content Patch
* Editor parameters are now separated into different input boxes instead of a single input box
* Added the Giant Gate, the Super Mario World goal pole
>   No worlds currently use this, this is just to future proof the Super Mario World... world
* You can set the number of tiles the goal post moves; this also corresponds to the post’s vertical hitbox
* Added 1-tile warp pipes
>   Still warp pipes, just ones that aren’t 2 tiles big
* Lobby music is now randomized
>   Instead of there being only one music track for the lobby, there’s now four! These include SMB3 worlds 1 and 4 map themes, Yoshi’s Island and the SMW special theme. We might even take suggestions from you guys in the Discord!
* Fixed different fireball positions depending on the direction you’re facing

## Version 1.9.0
### 2023-02-18 - Content Patch
* Made it so that you can’t change your nickname to be someone else’s name
* Added new tiles: Camera Lock/Unlock Y
>   Locks or unlocks the scrolling of the camera’s Y axis
* Fixed koopas not being able to break bricks
* Added a name filter so that you can’t have slurs in your name
>   Or generally any swear words in your name

## Version 1.8.0
### 2023-02-17 - Content Patch
* Fixed SMB2 (PvP) missing a block hit sprite
* Outline is now configurable in the text object
* Mario walks slower after sliding down a flagpole or touching an axe
>   This was done to prevent the level end jingle from cutting off in some worlds.
* Added toolbar to editor info screen, and also moved about button to it
* Added tiles: Warp pipe slow/fast and Conveyor left/right
* Revamped the patch notes and control remapping pages to look even better
>   This is a stopgap. We plan to move these pages to screens on the main menu in the future.

## Version 1.7.1
### 2023-02-16 - Hotfix
* Trimmed Mario Kart star music to loop better
* This ended up not doing as much as we would’ve liked. You probably won’t notice anything.
* Added disclaimer tooltip to the private button (for now)

## Version 1.7.0
### 2023-02-16 - Content Patch
* Added a new tile: Item Regen
>   When hit, the block regenerates after 5 seconds allowing it to be hit again. This tile has been added to all PvP maps.
* Fixed Fire Bros ignoring the player when it should only ignore enemies
* Fixed tile collision glitches
* Fixed item hierarchy; Fire Flower and Super Leaf are now treated as the same class
* Fixed a softlock that could be caused by infinite power transforming by removing hold times
* Bullet Bills explode after 10 seconds now since in some worlds they explode before even getting to the player

## Version 1.6.1
### 2023-02-15 - Stats Patch
* Fixed stats being added to your account if you’re in a private lobby

## Version 1.6.0
### 2023-02-15 - Content Patch
* New PvP world: Ice
>   This is a vertical stage based on the snow map from NSMB Mario Vs. Luigi. Have fun!
* Fire Bro fireballs no longer interact with other enemies
* HUD buttons are slightly larger now
* Reduced Piranha Plant vertical hitbox by 20%

## Version 1.5.0
### 2023-02-14 - Content Patch
* The HUD buttons in the top right corner are now SMAS styled
>   Thanks Pyriel!
* Your kills are now displayed in the top left corner below the coin counter
Bullet Bills now explode 5 seconds after being fired

## Version 1.4.0
### 2023-02-14 - Content Patch
* Added two buttons after reaching the podium: Return to Main and Return to Lobby
* The former will return you to the main menu, the latter will return you to the lobby.

## Version 1.3.0
### 2023-02-14 - Valentine’s Day Patch
* Happy Valentine’s Day! We’ve themed the lobby for the special day!
* Added a new tile: Random Warp
>   This warps you to a random point in the level. No worlds currently use it though.
* General bugfixes

## Version 1.2.0
### 2023-02-13 - Content Patch
* You can now use a slider to control the music and sound volume
* Infringio now uses a custom made fireball-throwing Glock-18 made in Germany

## Version 1.1.0
### 2023-02-12 - Content Patch
* In the Choose Game menu, hovering over a gamemode will display how many players are playing that gamemode
* Fixed axes displaying as flags in the menu background

## Version 1.0.1
### 2023-02-12 - Bugfix
* Fix Connection Interrupted screen when idling on the title screen for a few minutes

## Version 1.0.0
### 2023-02-11 - The Game
>   You just lost The Game.
* Welcome to Mario Royale Deluxe!
>   You can view pre-release commits [here](https://github.com/mroyale/MarioRoyaleDeluxe/commits/4708f064ac41be5b67fc550b85aa18d1bc012e8c).
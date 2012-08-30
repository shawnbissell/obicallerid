# Obi Caller ID Name Growl Notifications
Sends Caller ID and Name information to Growl on your Mac (or Windows PC) from your Obihai ATA device

Imports contact name information from Outlook 2011 and Address Book on startup of service

If contact information is not available then it looks up CNAM information from opencam (https://www.opencnam.com/)

## Installation for Mac
Install Node JS
    http://nodejs.org/download/

Install Growl from AppStore
    http://itunes.apple.com/ca/app/growl/id467939042

Install growlnotify command line application
    http://growl.info/extras.php#growlnotify

Install obicallerid using Node Package Manager
    $ sudo npm install -g obicallerid

## Installation for Windows
Install Node JS
    http://nodejs.org/download/

Install Growl for Windows
    http://www.growlforwindows.com/gfw/

Install growlnotify
    http://www.growlforwindows.com/gfw/help/growlnotify.aspx
Ensure it the .exe is either on your global PATH or copied to you \Windows\system32\ dir

Install obicallerid using node package manager
    $ npm install -g obicallerid

##Obi Setup

In Obitalk website -> Obi Expert Config

    System Management -> Device Admin
      Syslog
        Server =  <IP Address of where you are running obicallerid>
        Port = 7000
        Level = 7
    Voice Service -> SPx Service
      X_SipDebugOption = Log All Except REGISTER Message

##Usage
    $ cd <dir of your choice>
    $ obicallerid

info messages will be output to console

debug messages will be logged to output.log

##Installing as a service

## License
Copyright (c) 2012 Shawn Bissell
Licensed under the MIT license.
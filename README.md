# Obi Caller ID Name Growl Notifications for Mac OSX
Sends Caller ID and Name information to Growl on your Mac from your Obihai ATA device

Imports contact name information from Outlook 2011 and Address Book on startup of service

If contact information is not available then it looks up CNAM information from opencam (https://www.opencnam.com/)


## Installation
Install Growl from AppStore

Install growlnotify command line application http://growl.info/extras.php#growlnotify

    $ sudo npm install -g obicallerid

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

## License
Copyright (c) 2012 Shawn Bissell
Licensed under the MIT license.
# Obi Caller ID Name Growl Notifications for Mac OSX
  Sends Caller ID and Name information to Growl on your Mac from your Obihai ATA device

  Looks up contact name information from Outlook 2011 and Address Book

  If number is not in either looks up CNAM information from opencam (https://www.opencnam.com/)


## Installation
  Install Growl from AppStore

  Install growlnotify command line application http://growl.info/extras.php#growlnotify

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

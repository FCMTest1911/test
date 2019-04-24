import { FirebaseService } from './../providers/firebase-service';
import { Component } from '@angular/core';
import { Platform , ToastController, AlertController, ModalController } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { GeofenceService } from '../geofence-module/providers/geofence-service';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from 'angularfire2/database';
import { Firebase } from '@ionic-native/firebase';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { FcmProvider } from '../providers/fcm';
import * as $ from 'jquery';

// import { AndroidPermissions } from '@ionic-native/android-permissions';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;
  prompt:any;
  games: any;
  game: any;
  gameID: string;
  todaysGames: any;
  gameNum: number;

  constructor(
    public platform: Platform,
    public toastCtrl:ToastController, 
    public geofenceService: GeofenceService,
    private splashScreen: SplashScreen,
    public firebaseService: FirebaseService,
    private alertCtrl:AlertController,
    private ga: GoogleAnalytics,
    public afd: AngularFireDatabase,
    private firebase: Firebase,
    private storage: Storage,
    public fcm: FcmProvider,
    // private androidPermissions: AndroidPermissions,
    private modalCtrl:ModalController) {
    platform.ready().then(() => {
      setTimeout(() => {
        this.splashScreen.hide();
      }, 100);

      // this.androidPermissions.requestPermissions([
      //   this.androidPermissions.PERMISSION.CAMERA,
      //   this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION,
      //   this.androidPermissions.PERMISSION.READ_CALENDAR,
      //   this.androidPermissions.PERMISSION.WRITE_CALENDAR
      // ]);
      this.fcm.getToken();
      this.fcm.subscribeToTopics();
      this.ga.debugMode();
      this.ga.startTrackerWithId('UA-92624414-1',1);
      this.ga.enableUncaughtExceptionReporting(true)
          .then((_success) => {
            console.log(_success)
          }).catch((_error) => {
            console.log(_error)
            this.ga.trackEvent('error',_error);
          });

      firebaseService.authState.subscribe(user => {
        if (user) {
          console.log(user);
          this.getDate();
          this.rootPage = 'TabsPage';
        } else {
          this.rootPage = 'WelcomePage';
        }
      });

      geofenceService.init()
        .then(() => {
          console.log('GEOFENCE SERVICE INITIALIZED');
          geofenceService.removeAll()
            .then(() => console.log("added all fences..."),
              (err) => "An error was encountered when adding fences..."
          );
          geofenceService.getTransitions()
            .subscribe((transition) => {
              if(transition != null) {
                this.handleTransitions(transition);
              }
          });
        },
        // (err) => this.firebaselogger.logEvent('error_message',err)
      )
    });
  }

  sendPush(name){
    console.log('sendPush');
    if(localStorage.getItem('token')){
      $.ajax({
        type : 'POST',
        url : "https://fcm.googleapis.com/fcm/send",
        headers : {
            Authorization : 'key=AAAA2Hv5ku0:APA91bEUutRnkB82OgF1dKBsvx-vUd2LncpKlRCdVlnSVPe7VtAN4pK7BCQNjwW9Ew_OjzTNWjIyF1VfrzdZIyiECIEXLWIHX3xPPY3-1f0qP5GTv-Cw-MbHeVxvVXXcu868aHGncku5'
        },
        contentType : 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            "to": localStorage.getItem('token'), 
            "notification": {
                "title":"UBALLN Alert",
                "body":'Are you hooping at '+name+'?'
            }
        }),
        success : function(response) {
            console.log(response);
        },
        error : function(xhr, status, error) {
            console.log(xhr.error);
        }
      });  
    }
  }

  handleTransitions(transition){
    this.firebaseService.storeGames();
    if (transition[0].transitionType == 1){
      let name = transition[0].name;
      this.sendPush(name);
      sessionStorage.setItem('courtName', transition[0].name);
      this.storage.get('allTheGames')
        .then((val) => {
          this.games = val;
          let todaysGames = [];
          for (let game of this.games) {
            let today = localStorage.getItem('today').replace(/-/g,'/');
            let gameDate = game.gameDate.replace(/-/g,'/');
            if (gameDate == today && game.name == sessionStorage.getItem('courtName')){
              todaysGames.push(game);
            }
          }

        let gameNum = todaysGames.length;

      if (gameNum == 1){
        let gameInfo = todaysGames.shift();
        sessionStorage.setItem('gameID', gameInfo.gameID)
        // this.firebaselogger.logEvent('user_action',{geofenceEntered:transition[0].notification.court});
        
          this.afd.object('/games/' + gameInfo.gameID)
          .subscribe(data => {
            this.storage.set('currentGame', data);
          })
          return Promise.resolve(undefined)
        .then(()=>{
          setTimeout(function(){},1000)
          Promise.resolve(undefined)
          .then(()=>{
            let modal = this.modalCtrl.create('GamePageModal');
            modal.present();
          })
        })
      } else {
        let gameID = localStorage.getItem('today') + '_' + Math.floor(10000000000000000000 + Math.random() * 90000000000000000000);
        let prettyDate = new Date().toDateString();
        let gameTime = new Date().toTimeString().split(' ')[0].slice(0, -3);
        let gameHour = gameTime.substr(0,2);
        let gameMinutes = gameTime.substr(2,4);

        // Format AM/PM
        if (parseInt(gameHour) >= 13){
          gameTime = parseInt(gameHour) - 12 + gameMinutes + 'PM'
        } else {
          gameTime = gameTime + 'AM'
        }
        localStorage.setItem('gameID', gameID);
        sessionStorage.setItem('startNewGame', 'true');
        let myID = localStorage.getItem('userID');
        let currentGame = {
          address: transition[0].address,
          created: JSON.stringify(Date.now()),
          creator: localStorage.getItem('userID'),
          creatorIMG: localStorage.getItem('img'),
          gameDate: localStorage.getItem('today'),
          gameDateFormatted: prettyDate,
          gameStart: gameTime,
          img: transition[0].img,
          name: transition[0].name,
          gameID: gameID,
          players: {
            [myID]:{
              age: localStorage.getItem('ageCount'),
              alias: localStorage.getItem('name'),
              experience: localStorage.getItem('experience'),
              img: localStorage.getItem('img'),
              status: 'active',
              uid: localStorage.getItem('userID')
            }
          },
          stats: {
            ageTotal: localStorage.getItem('ageCount'),
            avgAge: localStorage.getItem('ageCount'),
            avgExp: localStorage.getItem('experience'),
            expTotal: localStorage.getItem('experience'),
            playerTotal: '1'
            }
          }
            this.storage.set('currentGame', currentGame);
            return Promise.resolve(undefined)
              .then(()=>{
                // this.firebaseService.attributePoints(10, 'joined a game');
                  setTimeout(function(){},1000)
                  Promise.resolve(undefined)
                  .then(()=>{
                    let modal = this.modalCtrl.create('GamePageModal');
                    modal.present();
                  })
                })
              }
            })
    }else{ 
      this.firebaseService.leaveGame(localStorage.getItem('gameID'))
      .then(()=>{
        // this.firebaselogger.logEvent('user_action',{geofenceExited:transition[0].notification.court});
        let toast = this.toastCtrl.create({
          message: 'You left ' + transition[0].notification.court,
          duration: 2000
        });
        toast.present();
        localStorage.removeItem('gameID')
        this.storage.remove('currentGame');
      })
    }
  }
  getDate() {
    let x = new Date();
    let y = x.getFullYear().toString();
    let m = (x.getMonth() + 1).toString();
    let d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    let yyyymmdd = y + '-' + m + '-' + d;
    localStorage.setItem('today',yyyymmdd);
  }
  
}

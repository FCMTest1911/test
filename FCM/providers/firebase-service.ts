import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toPromise';
import * as $ from 'jquery';
import { Badge } from '@ionic-native/badge';
import { ToastController, Platform, ModalController } from 'ionic-angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { Facebook } from '@ionic-native/facebook';
import { FcmProvider } from '../providers/fcm';

@Injectable()
export class FirebaseService {
  public avatar: string;
  public user: firebase.User;
  public authState: Observable<firebase.User>;
  public users$: FirebaseListObservable<any>;
  public todaysGames$: FirebaseListObservable<any>;
  public currUser: Object;
  public Games: any;
  public gameID: any;
  public playerID: any;
  public age: any;
  public alias: any;
  public experience: any;
  public img: any;
  public friendData: any;
  public friends: any;
  public friendNum: any;
  public myUsername: string;
  public loading: any;
  public myID: string;
  public messages: any;
  public messageID: string;
  public MessageData: any;
  public messageNum: any;
  public unreadMessages: any;
  public userDOB: any;
  public Date: any;
  public activePlayers: any;
  public inactivePlayers: any;
  public timeNow: any;
  public userEmail: string;
  public userName: string;
  public userUid: string;


  constructor(
    private afAuth: AngularFireAuth,
    public afd: AngularFireDatabase,
    private toastCtrl: ToastController,
    public platform: Platform,
    public modalCtrl: ModalController,
    public ga: GoogleAnalytics,
    public facebook: Facebook,
    public badge: Badge,
    public fcm: FcmProvider,
    private storage: Storage) {
    this.authState = afAuth.authState;
    this.authState.subscribe(user => {
      this.user = user;
    });
  }

  signUp(name, email, password) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
    .then(newUser => {
      localStorage.setItem('userID', newUser.uid);
      localStorage.setItem('username',name);
      this.afd.list('/users')
        .update(
          newUser.uid, 
          {email: email,
            username:name});
    })
    .then(()=>{
      this.ga.trackEvent('userAction','signUp',password);
    })
    .catch(error => {
      alert(error)
      this.ga.trackEvent('error','signUp',JSON.stringify(error))
    })
  }

  loginUser(email, password) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
       .catch(error => {
         alert(error)
         this.ga.trackEvent('error','login',JSON.stringify(error))
        });
  }

  logoutUser() {
    let uid = localStorage.getItem('userID');

    // Clear all storage
    if (localStorage.getItem('setupNeeded')){
      localStorage.clear();
      localStorage.setItem('setupNeeded','true');
    }else{
      localStorage.clear();
    }
    this.storage.clear();
    this.badge.clear();
    
    // Track the logout
    this.ga.trackEvent('userAction','logoutUser', uid);

    return this.afAuth.auth.signOut()
    .then(()=>{
      this.ga.trackEvent('auth','logout',uid)
    })
    .catch(error => { 
      alert(error)
      this.ga.trackEvent('error','logout',JSON.stringify(error))
    });
  }

  resetPassword(email) {
    this.ga.trackEvent('userAction','resetPassword',email);

    return this.afAuth.auth.sendPasswordResetEmail(email)
    .catch(error => { 
      alert(error)
      this.ga.trackEvent('error','resetPassword',JSON.stringify(error))
    });
  }

  facebookLogin(){
    return this.facebook.login(['email'])
      .then((response) => {
        let credential = firebase.auth.FacebookAuthProvider
          .credential(response.authResponse.accessToken);

        firebase.auth().signInWithCredential(credential)
          .then(info => {
            this.userEmail = info['email'];
            this.userName = info['displayName'];
            this.userUid = info['uid'];
            let facebookUserId = info.providerData.uid;
            let photoUrl = 'https://graph.facebook.com/'+facebookUserId+'/picture?height=500';

            localStorage.setItem('img',photoUrl);
            this.afd.object('users/'+this.userUid).update({
              img: 'data:image/png;base64,'+photoUrl
            })

            // this.convertToDataURLviaCanvas(photoUrl,'image/png')
            // .then((base64)=>{
            //   localStorage.setItem('img','data:image/png;base64,'+base64)
            //   this.afd.object('users/'+this.userUid).update({
            //     img: 'data:image/png;base64,'+base64
            //   })
            // })
              
            localStorage.setItem('currUserEmail', this.userEmail);
            localStorage.setItem('currUserName', this.userName);
            localStorage.setItem('userID', this.userUid);
            console.log(localStorage.getItem('img'));
        });
    })
}

// convertToDataURLviaCanvas(url, outputFormat){
//   return new Promise((resolve, reject) => {
//   this.img = new Image();
//   this.img.crossOrigin = 'Anonymous';
//   this.img.onload = () => {
//     let canvas = <HTMLCanvasElement> document.createElement('CANVAS'),
//       ctx = canvas.getContext('2d'),
//       dataURL;
//     canvas.height = this.img.height;
//     canvas.width = this.img.width;
//     ctx.drawImage(this.img, 0, 0);
//     dataURL = canvas.toDataURL(outputFormat);
//     resolve(dataURL);
//     canvas = null;
//   };
//   this.img.src = url;
// });
// }

  getUserList(){
    return this.afd.list('/users');
  }

  getAllUsers(): Promise<any>{

    this.afd.list('/users', { preserveSnapshot: true})
      .subscribe(snapshots=>{
        let userData = [];
          snapshots.forEach(snapshot => {
              userData.push(snapshot.val());
          });
          this.storage.set('allUsers',userData);
      })
    return Promise.resolve(undefined)
    .catch(error =>{
      this.ga.trackEvent('systemAction','getAllUsers',error);
    })
  }
  
  getGames() {
    return this.afd.list('/games');
  }

  storeGames(){
    this.afd.list('/games')
    .subscribe((data)=>{
      this.storage.set('allTheGames', data);
    })
  }

  getGameDetails(gameID) {
    let gameDetails = this.afd.list('/games' + gameID)
      this.storage.set('gameDetails', gameDetails)
      return Promise.resolve(undefined);
  }

  setupGame(gameInfo){
    let uid = localStorage.getItem('userID');

    this.ga.trackEvent('userAction','setupGame',gameInfo.gameID);

    this.afd.object('/games/' + gameInfo.gameID).update({
        address: gameInfo.address,
        created: gameInfo.created,
        creator: gameInfo.creator,
        creatorIMG: gameInfo.creatorIMG,
        gameDate: gameInfo.gameDate,
        gameDateFormatted: gameInfo.gameDateFormatted,
        gameID: gameInfo.gameID,
        gameStart: gameInfo.gameStart,
        img: gameInfo.img,
        name: gameInfo.name,
        players:{
          [uid]:{
            alias: localStorage.getItem('username'),
            age: parseInt(localStorage.getItem('ageCount')),
            uid: uid,
            experience: parseInt(localStorage.getItem('experience')),
            img: localStorage.getItem('img'),
            status: 'active'
          }
        }
      })
      .catch(error =>{
        this.ga.trackEvent('error','setupGame',error + ', ' + gameInfo.gameID);
      })
}

  getGamePlayers(){
    return this.afd.list('/games'+this.gameID+'/players');
  }

  getCourts(): Promise<any>{
    this.afd.list('/courts', { preserveSnapshot: true})
      .subscribe(snapshots => {
        let myPlaces = [];
          snapshots.forEach(snapshot => {
              myPlaces.push(snapshot.val());
          });
          this.storage.set('courts',myPlaces);
      })
    return Promise.resolve(undefined)
    .catch(error => { 
      console.log(error)
      this.ga.trackEvent('error','getCourts',JSON.stringify(error))
    });
  }

  getUserData(uid) {
    this.afd.list('/users/'+uid, { preserveSnapshot: true})
      .subscribe(snapshots=>{
          snapshots.forEach(snapshot => {
            localStorage.setItem(snapshot.key, snapshot.val());
            if (snapshot.img){
              this.storage.set('img',snapshot.img)
            }
          });
      })
    this.avatar = localStorage.getItem('img')
    return Promise.resolve(undefined)
    .catch(error => { 
      console.log(error)
      this.ga.trackEvent('error','getUserData',JSON.stringify(error))
    });
  }

  getRequestor(uid) {
    return this.afd.list('/users/'+uid)
      .subscribe(data => {
        data.forEach(userData => {
          sessionStorage.setItem('requestor-' + userData.uid, userData);
        });
      })
  }

  updateUserProfile() {
    let uid = localStorage.getItem('userID');
    let birthday = localStorage.getItem('birthday');
    const yearsFromToday  = new Date(+new Date - +new Date(birthday)).getFullYear()-1970
    const numYears = yearsFromToday.toString();
  
    this.ga.trackEvent('userAction','updateProfile',uid);

    return this.afd.object('/users/' + uid).update({
      ageCount: numYears,
      name: localStorage.getItem('username'),
      height: localStorage.getItem('height'),
      weight: localStorage.getItem('weight'),
      experience: localStorage.getItem('experience'),
      played: localStorage.getItem('played'),
      birthday: localStorage.getItem('birthday'),
      gender: localStorage.getItem('gender'),
      img: localStorage.getItem('img'),
      uid: localStorage.getItem('userID'),
      username: localStorage.getItem('username'),
      registrationCompleted: localStorage.getItem('registrationCompleted')
    })
    .catch(error => { 
      console.log(error)
      this.ga.trackEvent('error','updateProfile',JSON.stringify(error))
    });
  }

  attributePoints(int, action){

    if (localStorage.getItem('pointTotal') == null){
        let pointTotal = 0;
        localStorage.setItem('pointTotal', int)
        return this.afd.object('/users/' + this.user.uid).update({
          pointTotal: pointTotal
        });
      } else {
        let pointTotal = parseInt(localStorage.getItem('pointTotal')) + int;
        localStorage.setItem('pointTotal', parseInt(localStorage.getItem('pointTotal')) + int)
        return this.afd.object('/users/' + this.user.uid).update({
          pointTotal: pointTotal
        })
        .then(()=>{
          let toast = this.toastCtrl.create({
            message: 'Congratulations! You just got ' + int + ' points because you '+ action +'!',
            duration: 5000,
            position: 'top'
          });
          toast.present();
        })
        .catch(error =>{
          this.ga.trackEvent('error','attributePoints',JSON.stringify(error));
        })
      }
  }

  welcomeMessage(uid){
    this.myUsername = localStorage.getItem('username');
    this.messageID = JSON.stringify(Math.floor(10000000000000000000 + Math.random() * 90000000000000000000));

    return this.afd.object('/users/' + uid + '/messages/' + this.messageID)
      .update({
        avatar: "https://firebasestorage.googleapis.com/v0/b/uballn-basketball-2f8d6.appspot.com/o/profileImage%2Fuballn-brand02.jpg?alt=media&token=7288b557-8627-49b9-9758-f0c350ee4977",
        buttonText: "Find a Game Nearby",
        previewHeader: "Welcome",
        previewMessage: "Welcome",
        img1: "https://firebasestorage.googleapis.com/v0/b/uballn-basketball-2f8d6.appspot.com/o/companyMessageImages%2Fwelcome1.png?alt=media&token=b2b84250-f7d0-43ca-8c6b-b24c409815d8",
        img2: "https://firebasestorage.googleapis.com/v0/b/uballn-basketball-2f8d6.appspot.com/o/companyMessageImages%2Fwelcome2.png?alt=media&token=e00e5f15-3953-4e6c-a7b0-2fa9f9aaa948",
        messageHeader: "Here a few points to help get you started on the court.",
        messageBody1: "Just because we wanted to say thank you for being one of the firsts to download our App, here are 50 points to help you get ahead of your friends on the court or toward supercharging your profile, helping you level-up. Now get to hoopin!",
        messageBody2: "We reward your dedication to the game with points every time you play. Later cash in those points for something sweet or just keep building.",
        messageID: this.messageID,
        page: "QuickPlayPage",
        read: false,
        requestorName: "UBALLN",
        requestorID: "5nW26skMB5RSjW16a7oiVR3oVX13",
        type: "companyMessage"
      })
      .catch(error =>{
        this.ga.trackEvent('error','welcomeMessage',JSON.stringify(error));
      })
  }

  addRemoveFriend() {
    let uid = localStorage.getItem('userID');
    let playerID = sessionStorage.getItem('CurrPlayerID');
    // let playerToken = sessionStorage.getItem('CurrPlayer.token');
    // let playerName = sessionStorage.getItem('CurrPlayer.username');
    // let topic = 'friendInvitation';
    if ($(event.target).hasClass('trueFriends')){

      this.ga.trackEvent('userAction','RemoveFriend',uid + ', '+playerID);

      $('#friendButton').removeClass('trueFriends');
      $('#friendButton').html('Add Friend');
      return this.afd.object('/users/' + uid +'/friends/'+ playerID).update({
        img: null,
        squad: null,
        status: null,
        uid: null,
        username: null
      })
    } else {

      this.ga.trackEvent('userAction','addFriend',uid + ', '+playerID);

      $('#friendButton').addClass('pending');
      $('#friendButton').html('Pending');
      this.myID = localStorage.getItem('userID');
      let token = this.afd.object('/users/'+ uid + '/token');

      // If player token has been saved, send them a push
      if(token){
        this.myUsername = localStorage.getItem('username');
        let title = 'UBALLN Friend Request';
        let message = this.myUsername + ' wants to be friends.';
        let messageCount = this.afd.object('users/'+playerID+'/messageCount');

        // If messageCount is null or undefined consider it to be 0
        if (messageCount == null || messageCount == undefined){
          let messageCount = 0;
          this.fcm.sendRequestPush(token, messageCount, title, message);
        }else{
          this.fcm.sendRequestPush(token, messageCount, title, message);
        }
          this.sendfriendRequest(playerID, uid, token);
      }
      return this.afd.object('/users/' + this.myID + '/friends/' + uid).update({
        img: sessionStorage.getItem('CurrPlayer.img'),
        squad: 'false',
        status: 'pending',
        uid: sessionStorage.getItem('CurrPlayer.uid'),
        username: sessionStorage.getItem('CurrPlayer.username')
      })
    }
  }

  sendfriendRequest(playerID, uid, token){
    this.myUsername = localStorage.getItem('username');
    this.messageID = JSON.stringify(Math.floor(10000000000000000000 + Math.random() * 90000000000000000000));

    let title = 'UBALLN Friend Request';
    let message = this.myUsername + ' wants to be friends.';
    this.fcm.sendRequestPush(token, uid, title, message);

    return this.afd.object('/users/' + playerID + '/messages/' + this.messageID).update({
      avatar: localStorage.getItem('img'),
      previewHeader: 'Friend Request',
      previewMessage: this.myUsername + ' wants to be friends.',
      messageHeader: 'Friend Request',
      messageID: this.messageID,
      read: false,
      requestorID: localStorage.getItem('userID'),
      requestorName: localStorage.getItem('username'),
      type: 'friendRequest'
    })
  }

  friendRequestAccepted(playerID){
    this.ga.trackEvent('userAction','friendRequestAccepted',playerID);

    this.myUsername = localStorage.getItem('username');
    this.messageID = JSON.stringify(Math.floor(10000000000000000000 + Math.random() * 90000000000000000000));
    return this.afd.object('/users/' + playerID + '/messages/' + this.messageID).update({
      avatar: localStorage.getItem('img'),
      previewHeader: 'Friend Request Accepted',
      previewMessage: this.myUsername + ' accepted your friend request.',
      messageBody1: 'Congratulations on your new friend!',
      messageHeader: 'Friend Request Accepted',
      messageID: this.messageID,
      read: false,
      requestorID: localStorage.getItem('userID'),
      response: 'accepted',
      requestorName: localStorage.getItem('username'),
      type: 'friendRequestAccepted'
    })
    .catch(error => {
      console.log(error);
      this.ga.trackEvent('error','friendRequestAccepted',JSON.stringify(error));
    })
  }

  squadRequestAccepted(playerID){
    this.ga.trackEvent('userAction','squadRequestAccepted',playerID);

    this.myUsername = localStorage.getItem('username');
    this.messageID = JSON.stringify(Math.floor(10000000000000000000 + Math.random() * 90000000000000000000));
    return this.afd.object('/users/' + playerID + '/messages/' + this.messageID).update({
      avatar: localStorage.getItem('img'),
      previewHeader: 'Squad Request Accepted',
      previewMessage: this.myUsername + ' accepted your squad request.',
      messageBody1: 'Congratulations on your new squad member!',
      messageHeader: 'Squad Request Accepted',
      messageID: this.messageID,
      read: false,
      requestorID: localStorage.getItem('userID'),
      response: 'accepted',
      requestorName: localStorage.getItem('username'),
      type: 'squadRequestAccepted'
    })
    .catch(error => {
      console.log(error);
      this.ga.trackEvent('error','squadRequestAccepted',JSON.stringify(error));
    })
  }

  inviteFriendToGame(playerID){
    this.ga.trackEvent('userAction','inviteFriendToGame',playerID);

    this.myUsername = localStorage.getItem('username');
    this.storage.get('gameInfo').then((val)=> {
      let gameDetailInfo = val;

    this.messageID = JSON.stringify(Math.floor(10000000000000000000 + Math.random() * 90000000000000000000));
    return this.afd.object('/users/' + playerID + '/messages/' + this.messageID).update({
      avatar: localStorage.getItem('img'),
      previewHeader: 'Game Invite',
      previewMessage: this.myUsername + ' invited you to a game.',
      messageID: this.messageID,
      locationImg: gameDetailInfo.img,
      inviteMessage: this.myUsername + ' invited you to a game.',
      location: gameDetailInfo.name,
      dateTime: gameDetailInfo.gameDateFormatted + ' @ ' + gameDetailInfo.gameStart,
      address: gameDetailInfo.address,
      read: false,
      requestorID: sessionStorage.getItem('CurrPlayer.uid'),
      requestorName: sessionStorage.getItem('CurrPlayer.username'),
      type: 'gameInvite'
    })
  })
  .catch(error =>{
    this.ga.trackEvent('error','inviteFriendToGame',JSON.stringify(error));
    })
  }

  gameDetails(){
    this.afd.list('/games')
        .subscribe(games =>{
          games.forEach((game) => {
            // Get Current Time
            let today = localStorage.getItem('today');
            let noDashes = today.replace(/-/g,'/');
            let result = noDashes.substr(4) + '/'+ noDashes.substr(0, 4);
            let date = result.substr(1);
            let timeNow = date + ' ' + new Date().toTimeString().split(' ')[0].slice(0, -3);

            let gameTime = game.gameStart.slice(0, -2);
            let gameTimeMin = gameTime.substr(gameTime.length - 2);
            let gameTimeHr = parseInt(gameTime.slice(0, -2)) + 1;

            let gameTimeFormatted;
            if (game.gameStart.substr(game.gameStart.length - 2) == 'PM'){
              gameTimeFormatted = date + ' ' + gameTimeHr + 12 + ':' + gameTimeMin;
            }else{
              gameTimeFormatted = date + ' ' + gameTimeHr + ':' + gameTimeMin;
            }

            // Check for active players
            this.activePlayers = [];
            this.inactivePlayers = [];
            for (var key in game.players) {
              if (key === localStorage.getItem('userID')){
                sessionStorage.setItem('playing','true');
              }
              if (game.players[key].status === 'active'){
                this.activePlayers.push(game.players[key]);
              } else {
                this.inactivePlayers.push(game.players[key]);
              }
            }
            let gameDate = game.gameDate.replace(/-/g,'/');
            let todayDate = localStorage.getItem('today').replace(/-/g,'/');

            console.log(gameDate);
            console.log(todayDate);

            if (gameDate > todayDate){
              return this.afd.object('/games/' + game.gameID).update({
                timing: 'future'
              });

            } else if (gameDate === todayDate){
              // This game is today
              // Compare gameStart with current time and check for active users
              if (Date.parse(gameTimeFormatted) < Date.parse(timeNow) && this.activePlayers.length < 1){
                this.afd.object('/games/' + game.gameID).update({
                  players: null
                });
                this.afd.object('/games_archive/' + game.gameID).update({
                  address: game.address,
                  created: game.created,
                  creator: game.creator,
                  creatorIMG: game.creatorIMG,
                  gameDate: game.gameDate,
                  gameDateFormatted: game.gameDateFormatted,
                  gameID: game.gameID,
                  gameStart: game.gameStart,
                  img: game.img,
                  players: game.players,
                  stats: game.stats,
                  timing: 'past'
                });
                console.log('gameID: ' + game.gameID + ' gameDate: ' + game.gameDate)
              } else {
                this.afd.object('/games/' + game.gameID).update({
                  timing: 'today'
                });
              }
            }else{
              // This is a past game
              // Check for active users
              if (this.activePlayers.length < 1){
                this.afd.object('/games/' + game.gameID).update({
                  address: null,
                  created: null,
                  creator: null,
                  creatorIMG: null,
                  gameDate: null,
                  gameDateFormatted: null,
                  gameID: null,
                  gameStart: null,
                  img: null,
                  name: null,
                  players: null,
                  stats: null,
                  timing: null
                });
                this.afd.object('/games_archive/' + game.gameID).update({
                  address: game.address,
                  created: game.created,
                  creator: game.creator,
                  creatorIMG: game.creatorIMG,
                  gameDate: game.gameDate,
                  gameDateFormatted: game.gameDateFormatted,
                  gameID: game.gameID,
                  gameStart: game.gameStart,
                  img: game.img,
                  players: game.players,
                  stats: game.stats,
                  timing: 'past'
                });  
              }
            }
          })
        })
    }

  joinActiveGame() {
    this.playerID = localStorage.getItem('userID');
    this.gameID = sessionStorage.getItem('gameID');

    this.ga.trackEvent('userAction','joinActiveGame',this.playerID + ', ' + this.gameID);

    return this.afd.object('/games/' + this.gameID + '/players/' + this.playerID)
      .update({  
        alias: localStorage.getItem('username'),
        age: parseInt(localStorage.getItem('ageCount')),
        uid: localStorage.getItem('userID'),
        experience: parseInt(localStorage.getItem('experience')),
        img: localStorage.getItem('img'),
        status: 'active'
      })
      .catch(error => {
        console.log(error);
        this.ga.trackEvent('error','joinActiveGame',error + ', ' + this.playerID + ', ' + this.gameID);
      })
  }

  joinGame() {
    this.playerID = localStorage.getItem('userID');
    this.gameID = sessionStorage.getItem('gameID');

    this.ga.trackEvent('userAction','joinGame',this.playerID + ', ' + this.gameID);

    return this.afd.object('/games/' + this.gameID + '/players/' + this.playerID)
      .update({  
        alias: localStorage.getItem('username'),
        age: parseInt(localStorage.getItem('ageCount')),
        uid: localStorage.getItem('userID'),
        experience: parseInt(localStorage.getItem('experience')),
        img: localStorage.getItem('img'),
        status: 'inactive'
      })
      .catch(error => {
        console.log(error);
        this.ga.trackEvent('error','joinGame',error + ', ' + this.playerID + ', ' + this.gameID);
      })
  }

  leaveGame(gameID){
    this.playerID = localStorage.getItem('userID');
    this.gameID = sessionStorage.getItem('gameID');

    this.ga.trackEvent('userAction','leaveGame',this.playerID + ', ' + this.gameID);

    return this.afd.object('/games/' + this.gameID + '/players/' + this.playerID)
      .update({  
        alias: null,
        age: null,
        uid: null,
        experience: null,
        img: null,
        status: null
      })
      .catch(error => {
        console.log(error);
        this.ga.trackEvent('error','leaveGame',error + ', ' + this.playerID + ', ' + this.gameID);
      })
  }

  updateFriends(uid): Promise<any>{
    this.ga.trackEvent('userAction','updateFriends',uid);

    this.afd.list('/users/'+uid, { preserveSnapshot: true})
    .subscribe(snapshots=>{
        snapshots.forEach(snapshot => {
          localStorage.setItem(snapshot.key, snapshot.val());
          this.storage.remove('myFriends');
          if (snapshot.key === 'friends'){
            this.storage.set('myFriends', snapshot.val());
            console.log(snapshot.val());
          }

        })
        this.saveFriendData();
    })
    return Promise.resolve(undefined)
    .catch(error => {
      console.log(error);
      this.ga.trackEvent('error','updateFriends',error + ', ' + uid);
    })
  }

  saveFriendData(){
    let uid = localStorage.getItem('userID');

      this.storage.get('myFriends').then((val) => {
        this.friends = val;
        this.friendData = [];
        for (var key in this.friends) {
          this.friendData.push(this.friends[key]);
        }
        this.friendNum = this.friendData.length;
        localStorage.setItem('friendNum',this.friendNum);
    })
  }

  checkMessages(uid){
    // Call firebase to get messages and loop through them
    this.afd.list('/users/'+ uid + '/messages')
      .subscribe(messages=>{

            // Clear MessageNum from localStorage
            localStorage.removeItem('MessageNum');

            // Clear MessageData from IonicStorage
            this.storage.remove('MessageData');
            
            // Track checkMessage action in analytics
            this.ga.trackEvent('userAction','checkMessages',uid);

            // Empty MessageData Array
            this.MessageData = [];

            // Empty unreadMessages Array
            this.unreadMessages = [];

          messages.forEach(message => {
            // If any message is unread push it into unreadMessages Array
            if (message.read == false || message.read == 'false'){
                this.unreadMessages.push(message.messageID);
            }

            // Unread or not, push into MessageData array
            this.MessageData.push(message);
          });

            // Remove duplicates if they exist
            var unreadMessages = $.unique(this.unreadMessages);
          
            // Get total number of unread messages
            let FirebaseMessageCount = unreadMessages.length;

            // Get number of messages stored locally
            let LocalMessageCount = parseInt(localStorage.getItem("unreadMessageCount"));
          
          // Check if there are any messages in unreadMessages array
          if (FirebaseMessageCount > 0){

            // Clear the notifications
            $('.notify').remove();
            // Add notification to messages icon
            $('.navIcon.messages').after('<span class="notify"></span>');

              // Check if LocalMessageCount and FirebaseMessageCount are equal
              if(LocalMessageCount == FirebaseMessageCount){
                console.log('No new messages.');
              }else{
                // If not, print count
                console.log('Message change.');
                console.log('MessageCount: ',FirebaseMessageCount);

                // Set the icon badge to the number of unread messages
                this.badge.set(FirebaseMessageCount);

                // Update messageCount in Firebase
                this.afd.object('/users/'+ uid)
                  .update({messageCount: FirebaseMessageCount})
              }
          }else{
            // If there are no messages in unreadMessages array
            // Log count
            console.log('MessageCount: '+this.unreadMessages.FirebaseMessageCount);

            // Set MessageData to null
            this.storage.set('MessageData',null);

            // Remove notification from message icon
            $('.notify').remove();

            // Clear badge
            this.badge.clear();
          }

          // Set unreadMessageCount count
          localStorage.setItem('unreadMessageCount', JSON.stringify(FirebaseMessageCount));

          // Set MessageData count
          this.storage.set('MessageData',this.MessageData);
      })
    }
}

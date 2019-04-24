import { Injectable } from '@angular/core';
import { Firebase } from '@ionic-native/firebase';
import { Platform } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { Badge } from '@ionic-native/badge';
import * as $ from 'jquery';
// import { AngularFirestore } from 'angularfire2/firestore';


@Injectable()
export class FcmProvider {

  constructor(
    public firebaseNative: Firebase,
    public afd: AngularFireDatabase,
    // public afs: AngularFirestore,
    private platform: Platform,
    // private badge: Badge
  ) {}

  // Get permission from the user
  async getToken() {
    let token;
    let userID = localStorage.getItem('userID')
    if (this.platform.is('android')) {
      token = await this.firebaseNative.getToken();
      if(localStorage.getItem('token')){
        console.log('Token already stored.');
      }else{
        localStorage.setItem('token',token);

        this.afd.object('/users/' + userID).update({
          token: token
        })
        console.log('New token stored.');
        console.log(token);
      }
    } 
  
    if (this.platform.is('ios')) {
      token = await this.firebaseNative.getToken();
      await this.firebaseNative.grantPermission();
      
      if(localStorage.getItem('token')){
        console.log('Token already stored.');
      }else{
        localStorage.setItem('token',token);

        this.afd.object('/users/' + userID).update({
          token: token
        })
        console.log('New token stored.');
        console.log(token);
      }
    }
  }

  subscribeToTopics() {
    this.firebaseNative.subscribe('news');
    this.firebaseNative.subscribe('companyMessage');
    alert('Subscribed to \'news\' and \'companyMessage\'!');
  }

  unsubscribeFromTopics() {
    this.firebaseNative.unsubscribe('news');
    this.firebaseNative.unsubscribe('companyMessage');
    alert('Unsubscribed from \'news\' and \'companyMessage\'!');
  }

  sendRequestPush(token, messageCount, title, message){
    $.ajax({
      type : 'POST',
      url : "https://fcm.googleapis.com/fcm/send",
      headers : {
          Authorization : 'key=AAAA2Hv5ku0:APA91bEUutRnkB82OgF1dKBsvx-vUd2LncpKlRCdVlnSVPe7VtAN4pK7BCQNjwW9Ew_OjzTNWjIyF1VfrzdZIyiECIEXLWIHX3xPPY3-1f0qP5GTv-Cw-MbHeVxvVXXcu868aHGncku5'
      },
      contentType : 'application/json',
      dataType: 'json',
      data: JSON.stringify({
          "to": token,
          "notification" : {
            "body" : message,
            "title" : title,
            "content_available" : true,
            "priority" : "high",
            "badge": parseInt(messageCount) + 1
            }
      }),
      success : function(response) {
          console.log(response);
      },
      error : function(xhr, status, error) {
          console.log(xhr.error);
          console.log(status);
          console.log(error);
      }
  });
  }


}
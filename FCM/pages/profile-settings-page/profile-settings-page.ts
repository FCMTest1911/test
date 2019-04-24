import { FirebaseService } from './../../providers/firebase-service';
import { Observable } from 'rxjs/Observable';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, ToastController } from 'ionic-angular';
import { ActionSheetController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { Camera } from '@ionic-native/camera';
import { Storage } from '@ionic/storage';
import { App } from 'ionic-angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { FcmProvider } from '../../providers/fcm';

@IonicPage()
@Component({
  selector: 'page-profile-settings',
  templateUrl: 'profile-settings-page.html',
})
export class ProfileSettingsPage {
  @ViewChild('fileInput') fileInput;
  isReadyToSave: boolean;
  invitations: Observable<any[]>;
  profileData: any;
  currUserName: string;
  name: string;
  experience: string;
  gender: string;
  height: string;
  weight: string;
  birthday: string;
  played: string;
  uid: string;
  updateUserIMG: string;
  subscribed: boolean;
  private imageSrc: string;

  constructor(
    public navCtrl: NavController,
    public firebaseService: FirebaseService,
    public toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public actionSheetCtrl: ActionSheetController,
    public storage: Storage,
    public ga: GoogleAnalytics,
    public fcm: FcmProvider,
    private app: App,
    public camera: Camera) {

      this.subscribed = true;
      this.name = localStorage.getItem('username');
      this.birthday = localStorage.getItem('birthday');
      this.experience = localStorage.getItem('experience');
      this.gender = localStorage.getItem('gender');
      this.height = localStorage.getItem('height');
      this.weight = localStorage.getItem('weight');
      this.updateUserIMG = localStorage.getItem('img');
  }

  ionViewWillEnter() {
    this.ga.trackEvent('pageView','profileSettingsPage','BETA');
    let profilePic;
    if (localStorage.getItem('userPhoto') === 'null'){
      profilePic = 'https://mydjapp.jnashdev.com/images/kanye.jpg';
      localStorage.setItem('userPhoto', profilePic)
    }else{
      profilePic = localStorage.getItem('userPhoto');
    };
  }

  updateUser() {
    localStorage.setItem('name',this.name);
    localStorage.setItem('height', this.height);
    localStorage.setItem('weight', this.weight);
    localStorage.setItem('experience', this.experience);
    localStorage.setItem('gender', this.gender);
    localStorage.setItem('birthday', this.birthday);

    switch (this.experience) {
      case '1':
          this.played = 'Recreational'
          break;
      case '2':
          this.played = 'High School'
          break;
      case '3':
          this.played = 'AAU/CLub'
          break;
      case '4':
          this.played = 'College'
          break;
      case '5':
          this.played = 'Semi-Pro'
          break;
      case '6':
          this.played = 'Professional'
          break;
      default:
        this.played = 'Recreational'
    }

    localStorage.setItem('played', this.played);

    this.firebaseService.updateUserProfile()
      .then(() => {
        this.presentToast('Profile Updated!');
      })
      .then(()=>{
        this.navCtrl.pop();
      })
  }

  showVersionInfo() {
    let modal = this.modalCtrl.create('AboutVersionPage');
    modal.present();
  }

  showPrivacyPolicy() {
    let modal = this.modalCtrl.create('PolicyPage');
    modal.present();
  }

  showTerms() {
    let modal = this.modalCtrl.create('TermsPage');
    modal.present();
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'top'
    });
    toast.present();
  }

  photoOptions(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Upload Photo',
      buttons: [
        {
          text: 'From Camera',
          handler: () => {
            this.takePicture();
          }
        },{
          text: 'From Photo Library',
          handler: () => {
            this.getPicture();
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
    this.ga.trackEvent('userAction','changePhoto',localStorage.getItem('userID'));
  }

  getPicture() {
    if (Camera['installed']()) {
      this.camera.getPicture({
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        destinationType: this.camera.DestinationType.DATA_URL,
        quality: 100,
        targetWidth: 500,
        targetHeight: 500,
        encodingType: this.camera.EncodingType.JPEG,
        correctOrientation: true
      }).then((data) => {
        this.storage.set('profilePic', data);
        localStorage.setItem('img', 'data:image/png;base64,'+data);
        this.updateUserIMG = 'data:image/png;base64,'+data;
      }, (err) => {
        alert('Unable to take photo');
      })
    } else {
      this.fileInput.nativeElement.click();
    }
  }

  takePicture() {
    if (Camera['installed']()) {
      this.camera.getPicture({
        sourceType: this.camera.PictureSourceType.CAMERA,
        destinationType: this.camera.DestinationType.DATA_URL,
        quality: 100,
        targetWidth: 500,
        targetHeight: 500,
        encodingType: this.camera.EncodingType.JPEG,
        correctOrientation: true
      }).then((data) => {
        this.storage.set('profilePic', data);
        localStorage.setItem('img', 'data:image/png;base64,'+data);
        this.updateUserIMG = 'data:image/png;base64,'+data;
      }, (err) => {
        alert('Unable to take photo');
      })
    } else {
      this.fileInput.nativeElement.click();
    }
  }

  processWebImage(event) {
    let reader = new FileReader();
    reader.onload = (readerEvent) => {

      let imageData = (readerEvent.target as any).result;
      this.updateUserIMG = imageData;
      localStorage.setItem('img', imageData);
    };

    reader.readAsDataURL(event.target.files[0]);
  }

  logOut() {
    this.firebaseService.logoutUser().then(() => {
      localStorage.clear();
      this.app.getRootNav().setRoot('WelcomePage');
       this.navCtrl.push('WelcomePage');
    });
  }

  toggleTopicSubscription(){
    console.log(this.subscribed);
    if (this.subscribed == false){
      this.fcm.unsubscribeFromTopics();
    } else if (this.subscribed == true){
      this.fcm.subscribeToTopics();
    }
  }
}

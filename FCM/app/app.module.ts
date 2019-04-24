import { Geolocation } from '@ionic-native/geolocation';
import { Geofence } from '@ionic-native/geofence';
import { FirebaseService } from './../providers/firebase-service';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { IonicStorageModule, Storage } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Settings } from '../providers/providers';
import { MyApp } from './app.component';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireModule } from 'angularfire2';
import { HttpModule } from '@angular/http';
import { Camera } from '@ionic-native/camera';
import { GeofenceModule } from '../geofence-module/geofence.module';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Calendar } from '@ionic-native/calendar';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Firebase } from '@ionic-native/firebase';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { Badge } from '@ionic-native/badge';
import { Facebook } from '@ionic-native/facebook'
import { GooglePlus } from '@ionic-native/google-plus';
import { AdMobFree } from '@ionic-native/admob-free';
import { FcmProvider } from '../providers/fcm';

const firebaseConfig = {
    apiKey: "AIzaSyAHJifVSUazzTFUH-yW7rIc3ZrjYz0phco",
    authDomain: "uballn-basketball-2f8d6.firebaseapp.com",
    databaseURL: "https://uballn-basketball-2f8d6.firebaseio.com",
    projectId: "uballn-basketball-2f8d6",
    storageBucket: "uballn-basketball-2f8d6.appspot.com",
    messagingSenderId: "929792889581"
  };

  export function provideSettings(storage: Storage) {
    return new Settings(storage, {});
  }

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    HttpModule,
    GeofenceModule.forRoot(),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireModule.initializeApp(firebaseConfig),
    IonicModule.forRoot(MyApp,{
      backButtonText: '',
      tabsHideOnSubPages: true
    }),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    SocialSharing,
    Geofence,
    Camera,
    Calendar,
    Firebase,
    GoogleAnalytics,
    AndroidPermissions,
    Badge,
    Facebook,
    GooglePlus,
    AdMobFree,
    Geolocation,
      { provide: Settings,
        useFactory: provideSettings,
        deps: [Storage]
      },
      { provide: ErrorHandler,
        useClass: IonicErrorHandler
      },
    FirebaseService,
    FcmProvider
  ]
})
export class AppModule {}
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProfileSettingsPage } from './profile-settings-page';

@NgModule({
  declarations: [
    ProfileSettingsPage,
  ],
  imports: [
    IonicPageModule.forChild(ProfileSettingsPage),
  ],
  exports: [
    ProfileSettingsPage
  ]
})
export class ProfileSettingsPageModule {}

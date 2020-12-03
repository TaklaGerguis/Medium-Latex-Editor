import { Injectable, NgZone } from '@angular/core';
import { User } from './user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import firebase from 'firebase';
import auth = firebase.auth;

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  _userData: any; // Save logged in user data
  _db: AngularFirestore;

  constructor(
    public db: AngularFirestore,   // Inject Firestore services
    public afAuth: AngularFireAuth, // Inject Firebase auth services
    public router: Router,
    public ngZone: NgZone // NgZone services to remove outside scope warning
  ) {
    this._db = db;
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this._userData = user;
        localStorage.setItem('user', JSON.stringify(this._userData));
        JSON.parse(localStorage.getItem('user'));
        this.UserSigned();
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    });
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null && user.emailVerified !== false);
  }

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth.signInWithPopup(provider)
      .then((result) => {
        this.SetUserData(result.user);
      }).catch((error) => {
        window.alert(error);
      });
  }

  UserSigned() {
    this.ngZone.run(() => {
      this.router.navigateByUrl('/editor');
    });
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument services */
  SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this._db.doc(`users/${user.uid}`);
    const _userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
    return userRef.set(_userData, {
      merge: true
    });
  }

  // Sign out
  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['login']);
    });
  }

  GetText() {
    const user: User = JSON.parse(localStorage.getItem('user'));

    return this._db
      .collection('latex_text')
      .snapshotChanges()
      .pipe( map( actions =>
        actions.filter( a => {
          return a.payload.doc.id === user.uid;
        })
          .map( a => {
              const data: any = a.payload.doc.data();
              const id = a.payload.doc.id;
              return data && data.text;
            }
          )
      ));
  }

  UpdateText(text) {
    const user: User = JSON.parse(localStorage.getItem('user'));

    this._db.collection('latex_text').doc(user.uid).set({
      user_id: user.uid,
      text: text,
    });
  }
}

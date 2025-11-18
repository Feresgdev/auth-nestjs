import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private defaultApp: admin.app.App;
  constructor(private readonly configService: ConfigService) {}
  onModuleInit() {
    const adminConfig: ServiceAccount = {
      projectId: this.configService.getOrThrow('FIREBASE_PROJECT_ID'),
      privateKey: this.configService
        .getOrThrow('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'),
      clientEmail: this.configService.getOrThrow('FIREBASE_CLIENT_EMAIL'),
    };

    this.defaultApp = admin.initializeApp({
      credential: admin.credential.cert(adminConfig),
    });
  }

  getAuth(): admin.auth.Auth {
    return this.defaultApp.auth();
  }

  getFirestore(): admin.firestore.Firestore {
    return this.defaultApp.firestore();
  }
}

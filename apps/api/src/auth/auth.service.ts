import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserProfile } from '@divvai/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

      if (!projectId) {
        this.logger.warn('FIREBASE_PROJECT_ID not set. Firebase Admin will not be initialized.');
        return;
      }

      if (credentialsPath) {
        // Use service account key file
        // Handle both relative and absolute paths
        const path = require('path');
        const fs = require('fs');
        const keyPath = path.isAbsolute(credentialsPath)
          ? credentialsPath
          : path.join(process.cwd(), credentialsPath);
        
        if (!fs.existsSync(keyPath)) {
          this.logger.warn(`Service account key file not found at: ${keyPath}`);
          return;
        }
        
        const serviceAccount = require(keyPath);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
      } else {
        // Use Application Default Credentials (for Cloud Run)
        this.firebaseApp = admin.initializeApp({
          projectId,
        });
      }

      this.logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  async verifyToken(token: string): Promise<User> {
    if (!this.firebaseApp) {
      throw new UnauthorizedException('Firebase Admin not initialized');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get or create user
      const user = await this.getOrCreateUser(decodedToken);
      return user;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async getOrCreateUser(decodedToken: admin.auth.DecodedIdToken): Promise<User> {
    const provider = decodedToken.firebase.sign_in_provider === 'google.com' ? 'google' : 'github';
    const providerId = decodedToken.uid;

    // Try to find existing user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { providerId },
          { email: decodedToken.email },
        ],
      },
    });

    if (user) {
      // Update user if needed
      if (user.providerId !== providerId || user.provider !== provider) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            providerId,
            provider,
            name: decodedToken.name || user.name,
            picture: decodedToken.picture || user.picture,
            updatedAt: new Date(),
          },
        });
      }
      return user as User;
    }

    // Create new user
    if (!decodedToken.email) {
      throw new UnauthorizedException('Email is required');
    }

    user = await this.prisma.user.create({
      data: {
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        picture: decodedToken.picture || null,
        provider,
        providerId,
      },
    });

    this.logger.log(`Created new user: ${user.email}`);
    return user as User;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture || undefined,
    };
  }
}


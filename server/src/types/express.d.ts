import { User, UserProfile, UserSession, Organization, OrganizationMember } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & { profile?: UserProfile | null };
      session?: UserSession;
      orgMember?: OrganizationMember;
      organization?: Organization;
    }
  }
}

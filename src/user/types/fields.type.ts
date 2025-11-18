export type UserFields = {
  id: string;
  roleId: string;
  email: string;
  profilePictureUrl: string;
  password: string;
  refreshToken: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

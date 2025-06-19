import React from 'react';
import { User } from '@/types';
import { UserService } from '@services/userService';
import { Logger } from '@utils/logger';

const logger = new Logger('UserCard');

interface UserCardProps {
  userId: string;
}

export const UserCard: React.FC<UserCardProps> = ({ userId }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const userService = new UserService();
  
  React.useEffect(() => {
    logger.log(`Loading user card for ${userId}`);
    userService.getUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
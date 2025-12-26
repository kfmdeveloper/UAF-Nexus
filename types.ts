
export interface User {
  regNo: string;
  name: string;
  department: string;
  avatar: string;
  password?: string;
  bio?: string;
}

export interface Friendship {
  user1: string;
  user2: string;
  status: 'pending' | 'accepted';
  requester: string;
}

export interface Post {
  id: string;
  authorRegNo: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

export interface Recommendation {
  user: User;
  mutualCount: number;
  mutualFriends: string[];
}

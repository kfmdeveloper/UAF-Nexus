
import { User, Friendship, Post, Message } from '../types';

const STORAGE_KEYS = {
  USERS: 'uaf_nexus_users',
  FRIENDSHIPS: 'uaf_nexus_friendships',
  POSTS: 'uaf_nexus_posts',
  MESSAGES: 'uaf_nexus_messages',
  CURRENT_USER: 'uaf_nexus_current_user'
};

export const StorageService = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),

  getFriendships: (): Friendship[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDSHIPS) || '[]'),
  saveFriendships: (fs: Friendship[]) => localStorage.setItem(STORAGE_KEYS.FRIENDSHIPS, JSON.stringify(fs)),

  getPosts: (): Post[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]'),
  savePosts: (posts: Post[]) => localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)),

  getMessages: (): Message[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]'),
  saveMessages: (msgs: Message[]) => localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs)),

  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null'),
  setCurrentUser: (user: User | null) => localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user)),

  clear: () => localStorage.clear()
};

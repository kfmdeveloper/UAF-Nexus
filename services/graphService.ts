
import { User, Friendship, Recommendation } from '../types';
import { StorageService } from './storageService';

export class GraphService {
  private adjacencyList: Map<string, Set<string>> = new Map();

  constructor() {
    this.buildGraph();
  }

  private buildGraph() {
    const friendships = StorageService.getFriendships().filter(f => f.status === 'accepted');
    const users = StorageService.getUsers();
    
    this.adjacencyList.clear();
    users.forEach(u => this.adjacencyList.set(u.regNo, new Set()));
    
    friendships.forEach(f => {
      this.adjacencyList.get(f.user1)?.add(f.user2);
      this.adjacencyList.get(f.user2)?.add(f.user1);
    });
  }

  getFriends(regNo: string): string[] {
    this.buildGraph();
    return Array.from(this.adjacencyList.get(regNo) || []);
  }

  getMutualFriends(userA: string, userB: string): string[] {
    this.buildGraph();
    const friendsA = this.adjacencyList.get(userA) || new Set();
    const friendsB = this.adjacencyList.get(userB) || new Set();
    return Array.from(friendsA).filter(f => friendsB.has(f));
  }

  /**
   * Enhanced Recommendation Engine
   * Scores potential connections based on:
   * 1. Mutual Friend Count (High weight)
   * 2. Shared Department (Medium weight)
   * 3. Connection Density (Low weight)
   */
  getRecommendations(targetRegNo: string): Recommendation[] {
    this.buildGraph();
    const myFriends = this.adjacencyList.get(targetRegNo) || new Set();
    const scoringMap = new Map<string, { mutuals: string[], score: number }>();
    const users = StorageService.getUsers();
    const me = users.find(u => u.regNo === targetRegNo);

    if (!me) return [];

    // 1. Traverse Level-2: Friends of Friends (Primary Source)
    myFriends.forEach(friend => {
      const friendsOfFriend = this.adjacencyList.get(friend) || new Set();
      friendsOfFriend.forEach(fof => {
        // Don't recommend self or existing friends
        if (fof !== targetRegNo && !myFriends.has(fof)) {
          const data = scoringMap.get(fof) || { mutuals: [], score: 0 };
          if (!data.mutuals.includes(friend)) {
            data.mutuals.push(friend);
            // Each mutual friend adds +10 to score
            data.score += 10;
          }
          scoringMap.set(fof, data);
        }
      });
    });

    // 2. Department-based boost (Discovery Source)
    users.forEach(u => {
      if (u.regNo !== targetRegNo && !myFriends.has(u.regNo)) {
        const data = scoringMap.get(u.regNo) || { mutuals: [], score: 0 };
        
        // Same department boost (+5)
        if (u.department === me.department) {
          data.score += 5;
        }

        // Only add to map if they have some score (either from mutuals or dept)
        if (data.score > 0) {
          scoringMap.set(u.regNo, data);
        }
      }
    });

    return Array.from(scoringMap.entries())
      .map(([regNo, data]) => {
        const user = users.find(u => u.regNo === regNo);
        return {
          user: user!,
          mutualCount: data.mutuals.length,
          mutualFriends: data.mutuals,
          score: data.score // Exporting score implicitly via sort
        };
      })
      .filter(r => r.user)
      .sort((a, b) => (b as any).score - (a as any).score);
  }

  areFriends(userA: string, userB: string): boolean {
    this.buildGraph();
    return this.adjacencyList.get(userA)?.has(userB) || false;
  }
}

export const graphService = new GraphService();

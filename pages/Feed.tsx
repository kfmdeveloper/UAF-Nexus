
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Post } from '../types';
import { Send, Megaphone, Info } from 'lucide-react';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const currentUser = StorageService.getCurrentUser()!;

  useEffect(() => {
    setPosts(StorageService.getPosts().sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      authorRegNo: currentUser.regNo,
      authorName: currentUser.name,
      content: newPost,
      timestamp: Date.now()
    };

    const updated = [post, ...StorageService.getPosts()];
    StorageService.savePosts(updated);
    setPosts(updated);
    setNewPost('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Campus Feed</h1>
        <div className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 flex items-center">
          <Info size={12} className="mr-1" />
          UAF Announcement System
        </div>
      </div>

      {/* Post Composer */}
      <form onSubmit={handlePost} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex space-x-4">
          <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-slate-800" />
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with your campus peers..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 transition-all"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!newPost.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2 transition-all"
          >
            <span>Post</span>
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
              <img src={`https://picsum.photos/seed/${post.authorRegNo}/200`} alt="" className="w-10 h-10 rounded-full ring-1 ring-slate-800" />
              <div>
                <h4 className="text-sm font-bold text-white">{post.authorName}</h4>
                <p className="text-xs text-slate-500">
                  {new Date(post.timestamp).toLocaleDateString()} at {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Megaphone size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">The feed is empty. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

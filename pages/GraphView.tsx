
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { StorageService } from '../services/storageService';
import { graphService } from '../services/graphService';
import { User, Friendship, Post, Message } from '../types';
import { Info, RefreshCcw, Maximize2, Activity, MessageSquare, Rss, UserCheck, Zap, X, Users, UserPlus, Check } from 'lucide-react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'me' | 'friend' | 'other' | 'recommended';
  avatar: string;
  dept: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: 'friendship' | 'recommendation';
}

interface ActivityLog {
  id: string;
  type: 'post' | 'message' | 'connection';
  content: string;
  timestamp: number;
  user: string;
}

const GraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [friendshipVersion, setFriendshipVersion] = useState(0); // Trigger re-renders for side panel
  
  const currentUser = StorageService.getCurrentUser()!;
  const users = StorageService.getUsers();
  
  // Get all friendships for the view
  const friendships = StorageService.getFriendships().filter(f => f.status === 'accepted');
  const recommendations = graphService.getRecommendations(currentUser.regNo);

  // Generate live activity log
  useEffect(() => {
    const posts = StorageService.getPosts().map(p => ({
      id: `p-${p.id}`,
      type: 'post' as const,
      content: `Shared a bulletin: "${p.content.substring(0, 40)}..."`,
      timestamp: p.timestamp,
      user: p.authorName
    }));

    const messages = StorageService.getMessages().slice(-5).map(m => {
      const sender = users.find(u => u.regNo === m.sender)?.name || 'Someone';
      return {
        id: `m-${m.id}`,
        type: 'message' as const,
        content: `Transmitted a data packet (Message).`,
        timestamp: m.timestamp,
        user: sender
      };
    });

    const connections = friendships.slice(-5).map((f, i) => {
      const u1 = users.find(u => u.regNo === f.user1)?.name || 'User';
      const u2 = users.find(u => u.regNo === f.user2)?.name || 'User';
      return {
        id: `c-${i}`,
        type: 'connection' as const,
        content: `Formed an edge with ${u2}.`,
        timestamp: Date.now() - (i * 1000000),
        user: u1
      };
    });

    const combined = [...posts, ...messages, ...connections]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    setActivity(combined);
  }, [friendshipVersion]);

  const initGraph = () => {
    if (!svgRef.current || !containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const nodes: Node[] = users.map(u => {
      let type: Node['type'] = 'other';
      if (u.regNo === currentUser.regNo) type = 'me';
      else if (graphService.areFriends(u.regNo, currentUser.regNo)) type = 'friend';
      else if (recommendations.find(r => r.user.regNo === u.regNo)) type = 'recommended';
      
      return {
        id: u.regNo,
        name: u.name,
        dept: u.department,
        type,
        avatar: u.avatar
      };
    });

    const links: Link[] = friendships.map(f => ({
      source: f.user1,
      target: f.user2,
      type: 'friendship'
    }));

    recommendations.forEach(r => {
      links.push({
        source: currentUser.regNo,
        target: r.user.regNo,
        type: 'recommendation'
      });
    });

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(isFullscreen ? 150 : 100))
      .force("charge", d3.forceManyBody().strength(isFullscreen ? -600 : -400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select(svgRef.current);
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    const defs = svg.append("defs");
    
    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    nodes.forEach(node => {
      defs.append("pattern")
        .attr("id", `pattern-${node.id.replace(/-/g, '')}`)
        .attr("height", 1)
        .attr("width", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("height", 1)
        .attr("width", 1)
        .attr("preserveAspectRatio", "none")
        .attr("href", node.avatar);
    });

    const linkSelection = g.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.type === 'friendship' ? "#3b82f6" : "#6366f1")
      .attr("stroke-dasharray", d => d.type === 'recommendation' ? "4" : "0")
      .attr("stroke-width", d => d.type === 'friendship' ? 1.5 : 1);

    const nodeSelection = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group cursor-pointer")
      .on("click", (e, d) => {
        e.stopPropagation();
        setSelectedNode(d);
        updateHighlight(d);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    nodeSelection.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => d.type === 'me' ? 28 : 22)
      .attr("fill", d => `url(#pattern-${d.id.replace(/-/g, '')})`)
      .attr("stroke", d => {
        if (d.type === 'me') return "#3b82f6";
        if (d.type === 'friend') return "#10b981";
        if (d.type === 'recommended') return "#f59e0b";
        return "#475569";
      })
      .attr("stroke-width", 2.5);

    nodeSelection.append("text")
      .attr("class", "node-label")
      .text(d => d.name.split(' ')[0])
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", "600");

    svg.on("click", () => {
      setSelectedNode(null);
      resetHighlight();
    });

    simulation.on("tick", () => {
      linkSelection
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      nodeSelection.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function updateHighlight(d: Node) {
      const neighbors = new Set<string>();
      neighbors.add(d.id);
      
      links.forEach(l => {
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as Node).id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as Node).id;
        if (sourceId === d.id) neighbors.add(targetId);
        if (targetId === d.id) neighbors.add(sourceId);
      });

      nodeSelection.transition().duration(300)
        .attr("opacity", n => neighbors.has(n.id) ? 1 : 0.15);
      
      nodeSelection.selectAll(".node-circle")
        .transition().duration(300)
        .attr("stroke-width", n => n.id === d.id ? 6 : 2.5)
        .style("filter", n => neighbors.has(n.id) ? "url(#glow)" : "none")
        .attr("stroke", n => {
           if (n.id === d.id) return "#fff";
           if (n.type === 'me') return "#3b82f6";
           if (n.type === 'friend') return "#10b981";
           if (n.type === 'recommended') return "#f59e0b";
           return "#475569";
        });

      linkSelection.transition().duration(300)
        .attr("opacity", l => {
          const sourceId = typeof l.source === 'string' ? l.source : (l.source as Node).id;
          const targetId = typeof l.target === 'string' ? l.target : (l.target as Node).id;
          return (sourceId === d.id || targetId === d.id) ? 1 : 0.05;
        })
        .attr("stroke-width", l => {
          const sourceId = typeof l.source === 'string' ? l.source : (l.source as Node).id;
          const targetId = typeof l.target === 'string' ? l.target : (l.target as Node).id;
          return (sourceId === d.id || targetId === d.id) ? 3 : 1;
        });
    }

    function resetHighlight() {
      nodeSelection.transition().duration(300).attr("opacity", 1);
      nodeSelection.selectAll(".node-circle")
        .transition().duration(300)
        .attr("stroke-width", 2.5)
        .style("filter", "none")
        .attr("stroke", n => {
          if (n.type === 'me') return "#3b82f6";
          if (n.type === 'friend') return "#10b981";
          if (n.type === 'recommended') return "#f59e0b";
          return "#475569";
        });
      linkSelection.transition().duration(300).attr("opacity", 0.6).attr("stroke-width", d => d.type === 'friendship' ? 1.5 : 1);
    }

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  useEffect(() => {
    initGraph();
    window.addEventListener('resize', initGraph);
    return () => window.removeEventListener('resize', initGraph);
  }, [users.length, friendships.length, isFullscreen, friendshipVersion]);

  const getFriendshipStatus = (targetId: string) => {
    const allFs = StorageService.getFriendships();
    const rel = allFs.find(f => 
      (f.user1 === currentUser.regNo && f.user2 === targetId) || 
      (f.user2 === currentUser.regNo && f.user1 === targetId)
    );
    return rel;
  };

  const handleFriendAction = (targetId: string, action: 'add' | 'accept') => {
    const allFs = StorageService.getFriendships();
    
    if (action === 'add') {
      const newRequest: Friendship = {
        user1: currentUser.regNo,
        user2: targetId,
        status: 'pending',
        requester: currentUser.regNo
      };
      StorageService.saveFriendships([...allFs, newRequest]);
    } else {
      const updated = allFs.map(f => {
        if ((f.user1 === targetId && f.user2 === currentUser.regNo) || (f.user2 === targetId && f.user1 === currentUser.regNo)) {
          return { ...f, status: 'accepted' as const };
        }
        return f;
      });
      StorageService.saveFriendships(updated);
    }
    setFriendshipVersion(v => v + 1);
  };

  const getStatusBadge = (type: Node['type']) => {
    switch(type) {
      case 'me': return <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">Self Node</span>;
      case 'friend': return <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">Direct Friend</span>;
      case 'recommended': return <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20 uppercase tracking-widest">Recommended</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-500/20 uppercase tracking-widest">Campus Peer</span>;
    }
  };

  const rel = selectedNode ? getFriendshipStatus(selectedNode.id) : null;

  return (
    <div className="space-y-6">
      <div className={`flex flex-col space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 shadow-2xl overflow-hidden' : 'h-[750px]'}`}>
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
              Nexus Topology Engine
              <span className="ml-3 text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold uppercase tracking-widest">Active Analysis</span>
            </h1>
            <p className="text-slate-400 text-sm">Interactive forced-graph mapping campus cluster relationships.</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:text-white hover:border-slate-700 transition-all shadow-lg" title="Toggle Focus">
              <Maximize2 size={20}/>
            </button>
            <button onClick={() => initGraph()} className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:text-white hover:border-slate-700 transition-all shadow-lg" title="Recalculate Equilibrium">
              <RefreshCcw size={20}/>
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-[#060b18] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl group" ref={containerRef}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <svg ref={svgRef} className="w-full h-full relative z-10" />
          
          {/* Legend - Floating UI */}
          <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-5 rounded-2xl text-[10px] space-y-3 pointer-events-none shadow-2xl z-20">
            <p className="font-bold text-slate-500 mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">Cluster Metadata</p>
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              <span className="text-slate-300 font-medium">Root Node (You)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span className="text-slate-300 font-medium">Verified Edge (Friend)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
              <span className="text-slate-300 font-medium">Predicted Node (Rec)</span>
            </div>
          </div>

          {/* Enhanced Selected Node Side Panel */}
          {selectedNode && (
            <div className="absolute top-8 right-8 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-3xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-500 shadow-2xl z-30 ring-1 ring-white/5">
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Node Analysis</span>
                <button onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }} className="text-slate-400 hover:text-white bg-slate-700 rounded-full p-1 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <img src={selectedNode.avatar} alt="" className="w-24 h-24 rounded-2xl border-2 border-blue-500 shadow-2xl" />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                    <Zap size={12} className="text-white fill-white" />
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                   {getStatusBadge(selectedNode.type)}
                </div>

                <h4 className="font-bold text-white text-lg tracking-tight mt-4 text-center">{selectedNode.name}</h4>
                <p className="text-xs text-blue-500 font-mono mt-0.5 text-center">{selectedNode.id}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold px-3 py-1 bg-slate-800 rounded-full text-center">{selectedNode.dept}</p>
                
                {/* Node Action Buttons */}
                {selectedNode.type !== 'me' && (
                  <div className="w-full mt-6 flex flex-col space-y-2">
                    {(!rel) ? (
                      <button 
                        onClick={() => handleFriendAction(selectedNode.id, 'add')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-900/40 transform active:scale-95"
                      >
                        <UserPlus size={14} />
                        <span>Add Friend</span>
                      </button>
                    ) : rel.status === 'pending' ? (
                      rel.requester === currentUser.regNo ? (
                        <button disabled className="w-full bg-slate-800 text-slate-500 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 border border-slate-700">
                          <Check size={14} />
                          <span>Request Sent</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleFriendAction(selectedNode.id, 'accept')}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-900/40 transform active:scale-95"
                        >
                          <Check size={14} />
                          <span>Accept Request</span>
                        </button>
                      )
                    ) : (
                      <button className="w-full bg-slate-800/50 text-emerald-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 border border-emerald-500/20 cursor-default">
                        <Users size={14} />
                        <span>Connected</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="w-full mt-8 grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center"><Network size={8} className="mr-1" /> Degree</p>
                    <p className="text-lg font-bold text-white">{graphService.getFriends(selectedNode.id).length}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center"><Users size={8} className="mr-1" /> Mutuals</p>
                    <p className="text-lg font-bold text-blue-400">{graphService.getMutualFriends(currentUser.regNo, selectedNode.id).length}</p>
                  </div>
                </div>

                <div className="w-full mt-6 pt-6 border-t border-slate-800 space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Network Cluster (Mutual Paths)</h5>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {graphService.getMutualFriends(currentUser.regNo, selectedNode.id).length > 0 ? (
                      graphService.getMutualFriends(currentUser.regNo, selectedNode.id).slice(0, 5).map(mReg => {
                        const mUser = users.find(u => u.regNo === mReg);
                        return mUser ? (
                          <img key={mReg} src={mUser.avatar} title={mUser.name} className="w-8 h-8 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-help" />
                        ) : null;
                      })
                    ) : (
                      <p className="text-[10px] text-slate-600 italic">No direct mutual paths found.</p>
                    )}
                    {graphService.getMutualFriends(currentUser.regNo, selectedNode.id).length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                        +{graphService.getMutualFriends(currentUser.regNo, selectedNode.id).length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Nexus Pulse - Activity Stream */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
              <Activity size={20} className="mr-3 text-emerald-400 animate-pulse" />
              Nexus Pulse Live
            </h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Real-time Network Telemetry</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl flex items-start space-x-4 hover:bg-slate-800/60 transition-all border-l-4 border-l-blue-600/50"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`p-2.5 rounded-xl bg-slate-900 shadow-inner shrink-0 ${
                    item.type === 'post' ? 'text-indigo-400' : item.type === 'message' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {item.type === 'post' ? <Rss size={16} /> : item.type === 'message' ? <MessageSquare size={16} /> : <UserCheck size={16} />}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-slate-200 truncate">{item.user}</p>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
            {activity.length === 0 && (
              <div className="text-center py-12">
                <Activity size={40} className="mx-auto text-slate-800 mb-3 opacity-20" />
                <p className="text-slate-600 text-sm">Quiet clusters... Monitoring network heartbeat.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-800/40 text-center border-t border-slate-800/50">
            <div className="flex items-center justify-center space-x-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span> Edge Sync: OK</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> Node Density: High</span>
              <span className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span> Protocol: V1.Nexus</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Local icon fallback for Network
const Network = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>
  </svg>
);

export default GraphView;

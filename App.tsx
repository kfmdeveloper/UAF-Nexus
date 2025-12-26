
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Friends from './pages/Friends';
import GraphView from './pages/GraphView';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import { StorageService } from './services/storageService';
import { User, Friendship } from './types';

// Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = StorageService.getCurrentUser();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  useEffect(() => {
    // Master list of students provided by the user
    const studentData = [
      ["2021-ag-9423", "Sharafat Ali"], ["2022-ag-8625", "Ali Raza"], ["2022-ag-9117", "Noor Abbas"],
      ["2022-ag-9119", "Hira Kanwal"], ["2022-ag-9121", "Abdul Kareem"], ["2022-ag-9123", "M. Numan Akhtar"],
      ["2022-ag-9125", "Syed Wasi Akbar"], ["2022-ag-9127", "Raveeha Sajid"], ["2022-ag-9129", "Aqib Siddique"],
      ["2022-ag-9131", "M. Salman"], ["2022-ag-9133", "M. Abu Bakar"], ["2022-ag-9135", "M. Zain Ul Abideen"],
      ["2022-ag-9137", "Shahroz Khan"], ["2022-ag-9139", "Waqar Ahmad"], ["2022-ag-9141", "Mehboob Ashraf"],
      ["2022-ag-9143", "M. Soban Umer"], ["2022-ag-9145", "Sadia Bibi"], ["2022-ag-9147", "Amanat Ali"],
      ["2022-ag-9151", "M. Moneem Raza"], ["2022-ag-9153", "Fiza Gul"], ["2022-ag-9155", "Hafiz Zain Ul Abideen"],
      ["2022-ag-9157", "M. Anas"], ["2022-ag-9159", "Ahmad Sajid"], ["2022-ag-9161", "M. Waqar Younas"],
      ["2022-ag-9163", "Arzish Fatima"], ["2022-ag-9165", "M. Talha Saeed"], ["2022-ag-9167", "M. Adnan"],
      ["2022-ag-9169", "Tauqeer Arif"], ["2022-ag-9171", "Kashif Anwar"], ["2022-ag-9174", "M. Arslan Aslam"],
      ["2022-ag-9175", "Irha Ijaz"], ["2022-ag-9176", "Hassan Saeed"], ["2022-ag-9178", "Safa Ishaq"],
      ["2022-ag-9180", "Kashif Javed"], ["2022-ag-9184", "Nisma Akram"], ["2022-ag-9186", "Faheem Ahmed Anjum"],
      ["2022-ag-9188", "Shahzaib Khan"], ["2022-ag-9192", "Nageen Rai"], ["2022-ag-9196", "M. Umar"],
      ["2022-ag-9199", "Haroon Ur Rasheed"], ["2022-ag-9201", "Mudassar Yasin"], ["2022-ag-9205", "Khazima"],
      ["2022-ag-9207", "Arslan Saeed"], ["2022-ag-9209", "Ali Hasnain Zubair"], ["2022-ag-9211", "M. Irfan"],
      ["2022-ag-9213", "Maryam"], ["2022-ag-9219", "Sohail Asghar"], ["2022-ag-9221", "Nabeela Niaz"],
      ["2022-ag-9225", "Mohsin Ali"], ["2022-ag-9227", "Irfan Jilani"], ["2022-ag-9233", "Shahzaib Asghar"],
      ["2022-ag-9235", "Junaid Majeed"], ["2022-ag-9237", "Khalid Farooq"], ["2022-ag-9238", "Filza Ameer"],
      ["2022-ag-9239", "Abeera Ahmad"], ["2022-ag-9245", "M. Umair Masood"], ["2022-ag-9249", "Faiza Zakria"],
      ["2022-ag-9251", "Ghulam Raza"], ["2022-ag-9255", "M. Aazim"], ["2022-ag-9257", "Jhanzaib Mumtaz"],
      ["2022-ag-9259", "Adil Hussain"], ["2022-ag-9261", "Ayesha Shoukat"], ["2022-ag-9266", "Hamad Ahmad Siddiqui"],
      ["2022-ag-9269", "Asad Arshid"], ["2022-ag-9276", "Amina Ramzan"], ["2022-ag-9277", "Laraib Aslam"],
      ["2022-ag-9278", "Saba Jamil"], ["2022-ag-9279", "Abu Umair"]
    ];

    const mappedUsers: User[] = studentData.map(([reg, name]) => ({
      regNo: reg,
      name: name,
      department: reg.includes('ag') ? 'Agriculture' : 'Computer Science',
      avatar: `https://picsum.photos/seed/${reg}/200`,
      password: 'khalid', // Password is now lowercase as requested
      bio: `Student at University of Agriculture. Proud member of UAF Nexus.`
    }));

    // Initial friendships
    const initialFriendships: Friendship[] = [
      { user1: '2022-ag-9237', user2: '2022-ag-9117', requester: '2022-ag-9237', status: 'accepted' },
      { user1: '2022-ag-9237', user2: '2022-ag-9119', requester: '2022-ag-9237', status: 'accepted' },
      { user1: '2022-ag-9237', user2: '2022-ag-8625', requester: '2022-ag-8625', status: 'accepted' },
      { user1: '2022-ag-9117', user2: '2022-ag-9121', requester: '2022-ag-9117', status: 'accepted' },
      { user1: '2022-ag-9119', user2: '2022-ag-9123', requester: '2022-ag-9119', status: 'accepted' },
      { user1: '2022-ag-9121', user2: '2022-ag-9125', requester: '2022-ag-9121', status: 'accepted' },
      { user1: '2022-ag-9123', user2: '2022-ag-9125', requester: '2022-ag-9123', status: 'accepted' },
    ];

    const existingUsers = StorageService.getUsers();
    
    // Logic to force update if password changed or users missing
    const needsRefresh = existingUsers.length === 0 || existingUsers.some(u => u.password === 'Khalid');
    
    if (needsRefresh) {
      StorageService.saveUsers(mappedUsers);
      // Only reset friendships if it's the first time
      if (StorageService.getFriendships().length === 0) {
        StorageService.saveFriendships(initialFriendships);
      }
      
      // Initial posts
      if (StorageService.getPosts().length === 0) {
        StorageService.savePosts([
          {
            id: '1',
            authorRegNo: '2022-ag-9237',
            authorName: 'Khalid Farooq',
            content: 'Welcome to UAF Nexus! This is the start of our digital campus network.',
            timestamp: Date.now() - 1000000
          },
          {
            id: '2',
            authorRegNo: '2021-ag-9423',
            authorName: 'Sharafat Ali',
            content: 'Great to be here. The graph visualization is really helpful for finding classmates.',
            timestamp: Date.now() - 500000
          }
        ]);
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/graph" element={<ProtectedRoute><GraphView /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

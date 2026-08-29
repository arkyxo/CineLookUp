import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Genres from './pages/Genres';
import MovieDetails from './pages/MovieDetails';
import Person from './pages/Person';
import Search from './pages/Search';
import Watchlist from './pages/Watchlist';
import PrivateList from './pages/PrivateList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Logged-out visitors get the marketing landing page at "/";
// once signed in, "/" becomes the browsing home.
function Root() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? <Home /> : <Landing />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-base-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/genres/:genreId" element={<Genres />} />
        <Route path="/search" element={<Search />} />
        <Route path="/:mediaType/:id" element={<MovieDetails />} />
        <Route path="/person/:id" element={<Person />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/private-list"
          element={
            <ProtectedRoute>
              <PrivateList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}
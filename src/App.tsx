import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import Live from './pages/Live';
import Login from './pages/Login';
import MovieDetails from './pages/MovieDetails';
import Movies from './pages/Movies';
import Recent from './pages/Recent';
import Search from './pages/Search';
import SeriesDetails from './pages/SeriesDetails';
import SeriesPage from './pages/Series';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Loading /></div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="live" element={<Live />} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:id" element={<MovieDetails />} />
        <Route path="series" element={<SeriesPage />} />
        <Route path="series/:id" element={<SeriesDetails />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="recent" element={<Recent />} />
        <Route path="search" element={<Search />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Profile } from '../components/Profile';

export default function ProfilePage() {
  const { user, setUser, shippingAddress, setShippingAddress, isNewUser, setIsNewUser } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <main className="flex-1">
      <Profile
        user={user}
        shippingAddress={shippingAddress}
        requireShipping={isNewUser && !shippingAddress}
        onProfileUpdate={(u) => setUser(u)}
        onShippingUpdate={(addr) => {
          setShippingAddress(addr);
          // Clear the new-user flag once shipping is saved
          if (isNewUser) setIsNewUser(false);
        }}
        onNavigate={(page: string) => {
          if (page === 'home') navigate('/');
          else navigate(`/${page}`);
        }}
      />
    </main>
  );
}

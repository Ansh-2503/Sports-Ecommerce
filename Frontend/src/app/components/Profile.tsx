import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api, ShippingInfo, ShippingAddress, UserProfile, getAssetUrl } from '../lib/api';
import { Loader2, User, Calendar, Image as ImageIcon, CheckCircle2, MapPin, Truck } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
  shippingAddress: ShippingAddress | null;
  /** If true, shipping details are mandatory before the user can proceed */
  requireShipping?: boolean;
  onProfileUpdate: (user: UserProfile) => void;
  onShippingUpdate: (addr: ShippingAddress) => void;
  onNavigate: (page: any) => void;
}

const defaultShipping: ShippingInfo = {
  address: '',
  city: '',
  state: '',
  country: 'IN',
  pinCode: 0,
};

export function Profile({
  user,
  shippingAddress,
  requireShipping = false,
  onProfileUpdate,
  onShippingUpdate,
  onNavigate,
}: ProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [shippingSuccess, setShippingSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form states
  const [name, setName] = useState(user.name || '');
  const [gender, setGender] = useState(user.gender || 'male');
  const [dob, setDob] = useState(user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shouldRemovePhoto, setShouldRemovePhoto] = useState(false);

  // Shipping form states
  const [shipping, setShipping] = useState<ShippingInfo>(
    shippingAddress
      ? {
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pinCode: shippingAddress.pinCode,
        }
      : defaultShipping
  );

  // Sync shipping state when prop changes
  useEffect(() => {
    if (shippingAddress) {
      setShipping({
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        pinCode: shippingAddress.pinCode,
      });
    }
  }, [shippingAddress]);

  const updateShipping = (key: keyof ShippingInfo, value: string) => {
    setShipping((current) => ({
      ...current,
      [key]: key === 'pinCode' ? Number(value) : value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setShouldRemovePhoto(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (gender) formData.append('gender', gender);
      if (dob) formData.append('dob', dob);
      if (photoFile) formData.append('photo', photoFile);
      if (shouldRemovePhoto) formData.append('removePhoto', 'true');

      const response = await api.updateProfile(user._id, formData);
      onProfileUpdate(response.user);
      setSuccess('Profile updated successfully!');
      toast.success("Profile updated successfully!");
      
      // Clear file selection
      setPhotoFile(null);
      setShouldRemovePhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred while updating profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsShippingLoading(true);
    setShippingError('');
    setShippingSuccess('');

    if (
      !shipping.address ||
      !shipping.city ||
      !shipping.state ||
      !shipping.country ||
      !shipping.pinCode
    ) {
      setShippingError('Please fill in all shipping fields.');
      setIsShippingLoading(false);
      return;
    }

    try {
      const { shippingAddress: saved } = await api.saveShippingAddress(shipping);
      onShippingUpdate(saved);
      setShippingSuccess('Shipping address saved successfully!');
      toast.success('Shipping address saved!');

      // If this was a mandatory step (new user flow), navigate home after saving
      if (requireShipping) {
        setTimeout(() => onNavigate('home'), 600);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save shipping address';
      setShippingError(msg);
      toast.error(msg);
    } finally {
      setIsShippingLoading(false);
    }
  };

  const currentPhotoUrl = photoPreview 
    ? photoPreview 
    : shouldRemovePhoto 
      ? getAssetUrl(undefined, user.name) 
      : getAssetUrl(user.photo, user.name);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShouldRemovePhoto(true);
  };

  const isShippingComplete = !!(
    shipping.address &&
    shipping.city &&
    shipping.state &&
    shipping.country &&
    shipping.pinCode
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl space-y-8">

      {/* Mandatory Shipping Notice */}
      {requireShipping && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Truck className="h-6 w-6" />
            <h3 className="text-lg font-bold">Welcome! One more step</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Before you start shopping, please add your shipping address. This helps us deliver your orders to the right place.
          </p>
        </div>
      )}

      {/* ── Profile Card ── */}
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          <CardDescription>
            Update your personal information and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
              <div className="relative group">
                <img 
                  src={currentPhotoUrl} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-full object-cover border-4 border-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ImageIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h3 className="font-medium text-lg">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Click the image or the button below to upload a new photo.
                </p>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </Button>
                  {(user.photo || photoPreview) && !shouldRemovePhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    required
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      className="pl-9"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  value={user.email}
                  className="bg-secondary/50 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>
            </div>

            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            {success && (
              <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <Button className="w-full sm:w-auto" type="submit" disabled={isLoading || (!name && !gender && !dob && !photoFile && !shouldRemovePhoto)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Shipping Address Card ── */}
      <Card className={`border-0 shadow-xl bg-card/50 backdrop-blur-sm ${requireShipping && !shippingAddress ? 'ring-2 ring-primary/50' : ''}`}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Shipping Address
            {requireShipping && !shippingAddress && (
              <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-2">
                Required
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {shippingAddress
              ? 'Your saved shipping address. Update it anytime.'
              : 'Add your shipping address for faster checkout.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-address">Street Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="shipping-address"
                  placeholder="123 Main Street, Apt 4B"
                  required
                  className="pl-9"
                  value={shipping.address}
                  onChange={(e) => updateShipping('address', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping-city">City</Label>
                <Input
                  id="shipping-city"
                  placeholder="Mumbai"
                  required
                  value={shipping.city}
                  onChange={(e) => updateShipping('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-state">State</Label>
                <Input
                  id="shipping-state"
                  placeholder="Maharashtra"
                  required
                  value={shipping.state}
                  onChange={(e) => updateShipping('state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping-country">Country</Label>
                <Input
                  id="shipping-country"
                  placeholder="India"
                  required
                  value={shipping.country}
                  onChange={(e) => updateShipping('country', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-pincode">PIN Code</Label>
                <Input
                  id="shipping-pincode"
                  type="number"
                  placeholder="400001"
                  required
                  value={shipping.pinCode || ''}
                  onChange={(e) => updateShipping('pinCode', e.target.value)}
                />
              </div>
            </div>

            {shippingError && <div className="text-sm font-medium text-destructive">{shippingError}</div>}
            {shippingSuccess && (
              <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {shippingSuccess}
              </div>
            )}

            <Button
              type="submit"
              className={`w-full sm:w-auto ${requireShipping && !shippingAddress ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md' : ''}`}
              disabled={isShippingLoading || !isShippingComplete}
            >
              {isShippingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Address
                </>
              ) : shippingAddress ? (
                'Update Address'
              ) : (
                'Save Address'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

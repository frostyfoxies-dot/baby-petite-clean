'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Lock, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProfile, changePassword, deleteAccount, uploadAvatar } from '@/actions/user';
import { signOut } from 'next-auth/react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  emailVerified: Date | null;
  createdAt: Date;
}

interface ProfileClientProps {
  profile: UserProfile;
}

/**
 * Account profile page client component
 * Allows users to update their profile information and change password
 */
export default function ProfileClient({ profile }: ProfileClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [firstName, setFirstName] = React.useState(profile.firstName || '');
  const [lastName, setLastName] = React.useState(profile.lastName || '');
  const [phone, setPhone] = React.useState(profile.phone || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(profile.avatar);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setMessage(null);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File is too large. Maximum size is 5MB.' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await uploadAvatar(formData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload avatar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm deletion' });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount({ password: deletePassword });

      if (result.success) {
        // Sign out and redirect to home
        await signOut({ callbackUrl: '/' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete account' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Message alert */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Profile header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Profile Information
        </h2>
        <p className="text-gray-600">
          Update your account information and preferences.
        </p>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-lg p-6">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploadingAvatar}
                >
                  Change Photo
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, GIF or PNG. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Personal information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <Input
                type="email"
                label="Email Address"
                value={profile.email}
                leftIcon={<Mail className="w-4 h-4" />}
                disabled
                helperText="Email cannot be changed"
              />
            </div>
            <div className="mt-4">
              <Input
                type="tel"
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              setFirstName(profile.firstName || '');
              setLastName(profile.lastName || '');
              setPhone(profile.phone || '');
            }}>
              Reset
            </Button>
            <Button type="submit" loading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-lg p-6">
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  helperText="Minimum 8 characters"
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={isChangingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-lg p-6 border border-red-200">
        <h3 className="text-sm font-semibold text-red-900 mb-2">
          Danger Zone
        </h3>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter your password to confirm account deletion:
            </p>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="max-w-xs"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDeleteAccount}
                loading={isDeleting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

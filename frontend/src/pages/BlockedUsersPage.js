import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, UserX, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FloatingNav from '@/components/FloatingNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function BlockedUsersPage() {
  const { token } = useAuthStore();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadBlockedUsers();
  }, []);
  
  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/blocked-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data);
    } catch (error) {
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUnblock = async (userId) => {
    try {
      await axios.delete(`${API_URL}/block/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User unblocked');
      loadBlockedUsers();
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              data-testid="back-button"
              onClick={() => navigate('/profile')}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-heading font-bold">Blocked Users</h1>
          </div>
        </header>
        
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : blockedUsers.length === 0 ? (
            <Card className="glass-effect border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <UserX className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No blocked users</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`blocked-user-${user.user_id}`}
                >
                  <Card className="glass-effect border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.profile_picture} />
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              data-testid={`unblock-button-${user.user_id}`}
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                            >
                              <Unlock className="w-4 h-4 mr-2" />
                              Unblock
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unblock {user.username}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This user will be able to send you messages and see your stories again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUnblock(user.user_id)}>
                                Unblock
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <FloatingNav />
    </div>
  );
}
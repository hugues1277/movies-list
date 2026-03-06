import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth, REGISTRATION_ENABLED } from '@/contexts/AuthContext';
import { LogIn, LogOut, Shield, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function LoginDialog() {
  const { user, isAdmin, login, register, logout, error } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = isRegister
      ? await register(email, password)
      : await login(email, password);
    setSubmitting(false);
    if (success) {
      toast.success(isRegister ? 'Compte créé !' : 'Connecté !');
      setOpen(false);
      setEmail('');
      setPassword('');
      setIsRegister(false);
    }
  };

  if (isAdmin && user) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={async () => { await logout(); toast.info('Déconnecté'); }}>
        <LogOut size={16} />
        <span className="hidden sm:inline">Déconnexion</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setIsRegister(false); setEmail(''); setPassword(''); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <LogIn size={16} />
          <span className="hidden sm:inline">Connexion</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRegister ? <UserPlus size={18} className="text-primary" /> : <Shield size={18} className="text-primary" />}
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={6} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? '...' : isRegister ? 'Créer le compte' : 'Se connecter'}
          </Button>
          {REGISTRATION_ENABLED && (
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

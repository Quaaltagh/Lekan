import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Token tidak ditemukan.' });
    return;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Token tidak valid atau sudah expired.' });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  (req as any).user = { id: user.id, email: user.email, role: profile?.role };
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: `Akses ditolak. Hanya untuk: ${roles.join(', ')}.` });
      return;
    }
    next();
  };
};
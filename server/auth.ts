import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

// Extend SessionData to include passport property used by passport.js
declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: number;
    };
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const parsePreferences = (preferences: unknown): Record<string, any> | null => {
  if (!preferences) return null;
  if (typeof preferences === "string") {
    try {
      const parsed = JSON.parse(preferences);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  if (typeof preferences === "object") return preferences as Record<string, any>;
  return null;
};

async function resolveDelegatedUser(user: SelectUser): Promise<SelectUser> {
  const preferences = parsePreferences(user.preferences);
  const delegateForUserId = preferences?.delegateForUserId;
  const delegateType = preferences?.delegateType;

  if (!delegateForUserId || delegateType !== "secretary") return user;

  const ownerId = Number(delegateForUserId);
  if (!Number.isInteger(ownerId) || ownerId === user.id) return user;

  const owner = await storage.getUser(ownerId);
  return owner || user;
}

export function setupAuth(app: Express) {
  // Ensure SESSION_SECRET is set
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renova o cookie a cada requisição
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true, // Cookies de sessão devem ser httpOnly para segurança
      secure: process.env.NODE_ENV === 'production', // HTTPS em produção
      sameSite: 'strict',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Middleware to clean up orphaned sessions (user no longer exists in DB)
  app.use((req, res, next) => {
    // Check if session has a user reference but passport didn't authenticate
    // This happens when deserializeUser returns false (user not found in DB)
    if (req.session && req.session.passport?.user && !req.user) {
      console.log('[AUTH] Cleaning up orphaned session for missing user:', req.session.passport.user);

      // Destroy the invalid session
      req.session.destroy((err) => {
        if (err) {
          console.error('[AUTH] Error destroying orphaned session:', err);
        }

        // Clear all auth-related cookies
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('auth_token', { path: '/' });
        res.clearCookie('auth_user_id', { path: '/' });

        // Continue to the next middleware - the user will see the login page
        next();
      });
    } else {
      next();
    }
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email', // Change to use email field
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          console.log(`[AUTH] Login attempt for email: ${email}`);
          const user = await storage.getUserByEmail(email);

          if (!user) {
            console.log(`[AUTH] User not found with email: ${email}`);
            return done(null, false, { message: 'Esta conta não existe.' });
          }

          console.log(`[AUTH] User found: ${email} (id: ${user.id})`);

          const passwordMatch = await comparePasswords(password, user.password);
          console.log(`[AUTH] Password match result: ${passwordMatch}`);

          if (!passwordMatch) {
            console.log(`[AUTH] Password mismatch for user: ${email}`);
            return done(null, false, { message: 'Email ou senha incorretos' });
          }

          console.log(`[AUTH] Login successful for user: ${email}`);
          return done(null, user);
        } catch (error) {
          console.error(`[AUTH] Error during login:`, error);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => {
    console.log(`[AUTH] Serializing user session: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[AUTH] Deserializing session for user id: ${id}`);
      const user = await storage.getUser(id);
      if (user) {
        console.log(`[AUTH] Session restored for user: ${user.email || user.username}`);
        done(null, user);
      } else {
        console.log(`[AUTH] User not found for session id: ${id} - invalidating session`);
        // Return false to indicate invalid session (user no longer exists)
        // This prevents the "Failed to deserialize user" error
        done(null, false);
      }
    } catch (error) {
      console.error(`[AUTH] Error deserializing session:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { fullName, email, password } = req.body;

      // Validate required fields
      if (!fullName || !email || !password) {
        return res.status(400).json({ message: "Nome completo, email e senha são obrigatórios" });
      }

      console.log(`[AUTH] Registration attempt for email: ${email}`);

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log(`[AUTH] Registration failed - email already exists: ${email}`);
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      const hashedPassword = await hashPassword(password);
      console.log(`[AUTH] Password hashed successfully for: ${email}`);

      // Generate username from email (use part before @)
      const username = email.split('@')[0] + '_' + Date.now().toString(36);

      const user = await storage.createUser({
        username,
        fullName,
        email,
        password: hashedPassword,
      });

      console.log(`[AUTH] User created in database - id: ${user.id}, email: ${user.email}`);

      // Create welcome notification
      await storage.createNotification({
        userId: user.id,
        title: "Bem-vindo ao VitaView",
        message: "Envie seus exames médicos para análise e obtenha insights valiosos sobre sua saúde.",
        read: false
      });

      req.login(user, (err) => {
        if (err) {
          console.error(`[AUTH] Session creation failed for user ${user.id}:`, err);
          return next(err);
        }
        console.log(`[AUTH] Session created successfully for user: ${user.id}`);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error(`[AUTH] Registration error:`, error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log(`[AUTH] Login route - user authenticated, setting cookies for user: ${req.user!.id}`);
    const { password, ...userWithoutPassword } = req.user as SelectUser;

    // Definir um cookie auxiliar simplificado para autenticação
    res.cookie('auth_user_id', req.user!.id.toString(), {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
      httpOnly: false, // Acessível via JavaScript
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    // Manter o cookie original também por compatibilidade
    res.cookie('auth_token', JSON.stringify({ id: req.user!.id }), {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
      httpOnly: false, // Acessível via JavaScript
      secure: false,
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);

      // Limpar os cookies auxiliares
      res.clearCookie('auth_token', {
        path: '/',
        sameSite: 'lax'
      });

      res.clearCookie('auth_user_id', {
        path: '/',
        sameSite: 'lax'
      });

      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const loggedInUser = req.user as SelectUser;
      const preferences = parsePreferences(loggedInUser.preferences);
      const isSecretary = preferences?.delegateType === "secretary" && preferences?.delegateForUserId;

      const resolvedUser = await resolveDelegatedUser(loggedInUser);
      const { password: _, ...resolvedWithoutPassword } = resolvedUser;

      // If secretary is logged in, include their info
      if (isSecretary && loggedInUser.id !== resolvedUser.id) {
        res.json({
          ...resolvedWithoutPassword,
          loggedInAs: {
            id: loggedInUser.id,
            name: loggedInUser.fullName || loggedInUser.username,
            role: "secretary"
          }
        });
      } else {
        res.json(resolvedWithoutPassword);
      }
    } catch (error) {
      const { password, ...userWithoutPassword } = req.user as SelectUser;
      res.json(userWithoutPassword);
    }
  });

  // Endpoint para recuperação de senha
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Por enquanto, vamos apenas simular o envio de email
      // Em produção, você deve:
      // 1. Verificar se o usuário existe
      // 2. Gerar um token único de recuperação
      // 3. Salvar o token no banco com tempo de expiração
      // 4. Enviar email real com link de recuperação

      console.log(`Email de recuperação de senha seria enviado para: ${email}`);

      // Simula sucesso no envio
      res.status(200).json({
        message: "Se este email estiver cadastrado, você receberá instruções de recuperação de senha."
      });
    } catch (error) {
      console.error("Erro ao processar recuperação de senha:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Update user preferences
  app.patch("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const { preferences } = req.body;

      if (!preferences) {
        return res.status(400).json({ message: "Preferences object is required" });
      }

      const user = await storage.getUser(userId);
      const currentPreferences = (user?.preferences as any) || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };

      const updatedUser = await storage.updateUser(userId, { preferences: updatedPreferences });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

}

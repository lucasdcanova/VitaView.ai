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

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[AUTH] Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log(`[AUTH] User not found: ${username}`);
          return done(null, false);
        }

        console.log(`[AUTH] User found: ${username} (id: ${user.id})`);

        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`[AUTH] Password match result: ${passwordMatch}`);

        if (!passwordMatch) {
          console.log(`[AUTH] Password mismatch for user: ${username}`);
          return done(null, false);
        }

        console.log(`[AUTH] Login successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`[AUTH] Error during login:`, error);
        return done(error);
      }
    }),
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
        console.log(`[AUTH] Session restored for user: ${user.username}`);
      } else {
        console.log(`[AUTH] User not found for session id: ${id}`);
      }
      done(null, user);
    } catch (error) {
      console.error(`[AUTH] Error deserializing session:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log(`[AUTH] Registration attempt for username: ${req.body.username}`);

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log(`[AUTH] Registration failed - username already exists: ${req.body.username}`);
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log(`[AUTH] Password hashed successfully for: ${req.body.username}`);

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      console.log(`[AUTH] User created in database - id: ${user.id}, username: ${user.username}`);

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
        const { password, ...userWithoutPassword } = user;
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
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

      const updatedUser = await storage.updateUser(userId, { preferences });

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

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
    interface User extends SelectUser {}
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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "healthanalytics-secret-key",
    resave: true,
    saveUninitialized: true,
    rolling: true, // Renova o cookie a cada requisição
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true, // Cookies de sessão devem ser httpOnly para segurança
      secure: false, // Mudar para true em produção
      sameSite: 'lax',
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
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create default health metrics for the new user
      const defaultMetrics = [
        { name: "colesterol", value: "180", unit: "mg/dL", status: "normal", change: "-5" },
        { name: "glicemia", value: "95", unit: "mg/dL", status: "atenção", change: "+3" },
        { name: "hemoglobina", value: "14.2", unit: "g/dL", status: "normal", change: "+0.1" },
        { name: "vitamina_d", value: "32", unit: "ng/mL", status: "baixo", change: "-2" }
      ];

      for (const metric of defaultMetrics) {
        await storage.createHealthMetric({
          userId: user.id,
          ...metric
        });
      }

      // Create welcome notification
      await storage.createNotification({
        userId: user.id,
        title: "Bem-vindo ao HealthAnalytics",
        message: "Envie seus exames médicos para análise e obtenha insights valiosos sobre sua saúde.",
        read: false
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
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
    res.cookie('auth_token', JSON.stringify({id: req.user!.id}), {
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
}

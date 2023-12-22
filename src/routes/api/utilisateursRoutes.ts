import express, { NextFunction, Request, Response } from 'express';
import prisma from '../../db/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { authenticateJwt } from '../../middlewares/authMiddleware';

const router = express.Router();

// Middleware pour gérer les erreurs
const handleErrors = (fn: any) => async (req: Request, res: Response) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
};

// Middleware pour valider les paramètres d'ID
const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ erreur: 'ID invalide' });
  } else {
    // Convertissez l'ID en nombre et vérifiez s'il est fini
    const parsedId = Number(id);

    if (isNaN(parsedId) || !Number.isInteger(parsedId)) {
      res.status(400).json({ erreur: 'ID invalide' });
    } else {
      req.params.id = parsedId.toString(); // Met à jour le paramètre d'ID pour être un nombre
      next();
    }
  }
};

router.get('/utilisateurs/liste', handleErrors(async (req: any, res: {
  [x: string]: any; json: (arg0: { id: number; nom: string; prenom: string; email: string; motDePasse: string; role: string; }[]) => void; 
}) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany();
    res.json(utilisateurs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

router.get('/utilisateurs/:id', validateIdParam, handleErrors(async (req: { params: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { erreur: string; }): void; new(): any; }; }; json: (arg0: { id: number; nom: string; prenom: string; email: string; motDePasse: string; role: string; }) => void; }) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        commandes: true,
        _count: true,
      },
    });
    if (!utilisateur) {
      res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    } else {
      res.json(utilisateur);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

router.post('/utilisateurs', handleErrors(async (req: { body: any; }, res: {
  [x: string]: any; json: (arg0: { id: number; nom: string; prenom: string; email: string; motDePasse: string; role: string; }) => void; 
}) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(motDePasse, 10); // You can adjust the salt rounds (10 is a common value)

    const nouvelUtilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword, // Store the hashed password
        role,
      },
    });

    res.json(nouvelUtilisateur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

router.patch('/utilisateurs/:id', validateIdParam, handleErrors(async (req: { params: { id: any; }; body: any; }, res: {
  [x: string]: any; json: (arg0: { id: number; nom: string; prenom: string; email: string; motDePasse: string; role: string; }) => void; 
}) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;

    // Hash the password if it's provided in the request
    let hashedPassword;
    if (motDePasse) {
      hashedPassword = await bcrypt.hash(motDePasse, 10);
    }

    // Build the data object based on provided values
    const data: {
      nom?: string;
      prenom?: string;
      email?: string;
      motDePasse?: string;
      role?: string;
    } = {};

    if (nom !== null && nom !== undefined) {
      data.nom = nom;
    }

    if (prenom !== null && prenom !== undefined) {
      data.prenom = prenom;
    }

    if (email !== null && email !== undefined) {
      data.email = email;
    }

    if (hashedPassword !== null && hashedPassword !== undefined) {
      data.motDePasse = hashedPassword;
    }

    if (role !== null && role !== undefined) {
      data.role = role;
    }

    const utilisateurModifie = await prisma.utilisateur.update({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        commandes: true,
        _count: true,
      },
      data,
    });

    // Vérifiez si l'utilisateur a été modifié avec succès
    if (!utilisateurModifie) {
      return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    }

    res.json(utilisateurModifie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));


router.delete('/utilisateurs/:id', validateIdParam, handleErrors(async (req: { params: { id: any; }; }, res: {
  [x: string]: any; json: (arg0: { id: number; nom: string; prenom: string; email: string; motDePasse: string; role: string; }) => void; 
}) => {
  try {
    const utilisateurSupprime = await prisma.utilisateur.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    res.json(utilisateurSupprime);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

export default router;

// authRoutes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from './../../utils/jsonwebtoken'
import prisma from '../../db/config';

const router = express.Router();

router.post('/inscription', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, email, motDePasse } = req.body;
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({
        codeStatus: 400,
        message: 'Veuillez remplir tous les champs',
      });
    }

    const utilisateurExist = await prisma.utilisateur.findUnique({
      where: {
        email,
      },
    });
    if (utilisateurExist) {
      return res.status(400).json({
        codeStatus: 400,
        message: 'Veuillez réessayer avec un autre email',
      });
    }

    const nouveauUtilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
      },
    });

    res.json({ nouveauUtilisateur, message: 'Inscription réussie' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      codeStatus: 500,
      message: "Une erreur est survenue : " + error,
    });
  }
});

router.post('/connexion', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!utilisateur || !(await bcrypt.compare(motDePasse, utilisateur.motDePasse))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const accessToken = generateAccessToken(utilisateur.id.toString(), utilisateur.role);
    const refreshToken = await generateRefreshToken();

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken },
    });

    res.json({ accessToken: "Bearer " + accessToken, refreshToken: "Bearer " + refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      codeStatus: 500,
      message: "Une erreur est survenue : " + error,
    });
  }
});

export default router;

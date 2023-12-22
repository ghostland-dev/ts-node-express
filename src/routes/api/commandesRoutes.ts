import express, { Request, Response } from 'express';
import prisma from '../../db/config';
import { Prisma, Produit, ProduitCommande } from '@prisma/client';

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
const validateIdParam = (req: Request, res: Response, next: any) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ erreur: 'ID invalide' });
  } else {
    req.params.id = id.toString(); // Met à jour le paramètre d'ID pour être un nombre
    next();
  }
};

router.get('/commandes/liste', handleErrors(async (req: any, res: { json: (arg0: { id: number; date: Date; utilisateurId: number; }[]) => void; }) => {
  const commandes = await prisma.commande.findMany();
  res.json(commandes);
}));

router.get('/commandes/:id', validateIdParam, handleErrors(async (req: { params: { id: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { erreur: string; }): void; new(): any; }; }; json: (arg0: { id: number; date: Date; utilisateurId: number; }) => void; }) => {
  try {
    const commande = await prisma.commande.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        produits: true, // inclut les produits liés à la commande
        utilisateur: true,
      },
    });
    if (!commande) {
      res.status(404).json({ erreur: 'Commande non trouvée' });
    } else {
      res.json(commande);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

router.post('/commandes', handleErrors(async (req: { body: any; }, res: {
  [x: string]: any; json: (arg0: { id: number; date: Date; utilisateurId: number; }) => void;
}) => {
  const { date, utilisateurId, produits } = req.body;

  try {
    const nouvelleCommande = await prisma.commande.create({
      data: {
        date,
        utilisateurId,
        produits: {
          create: produits.map((produit: { quantite: any; produitId: any; }) => ({
            quantite: produit.quantite,
            produit: { connect: { id: produit.produitId } },
          })),
        },
      },
      include: {
        produits: {
          include: {
            produit: true,
          },
        },
      },
    });

    res.json(nouvelleCommande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

router.put('/commandes/:id', validateIdParam, async (req: Request, res: Response) => {
  try {
    // Get request data
    const { utilisateurId, produits } : {utilisateurId:number, produits:Array<ProduitCommande>} =  req.body;

    // Create correct structure for the `produits` field
    const produitsUpdateData = produits.map((produit) => ({
      data: {
        quantite: produit.quantite,
        produitId: produit.produitId,
      },
      where: {
        produitId: produit.produitId,
        commandeId: parseInt(req.params.id), // Use the current commandeId from the URL parameter
      },
    }));

    // Perform the update
    const commandeModifiee = await prisma.commande.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        utilisateurId,
        produits: {
          updateMany: produitsUpdateData,
        },
      },
      include: {
        produits: true,
        utilisateur: true,
      },
    });

    res.json(commandeModifiee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});



router.delete('/commandes/:id', validateIdParam, handleErrors(async (req: { params: { id: any; }; }, res: {
  [x: string]: any; json: (arg0: { id: number; date: Date; utilisateurId: number; }) => void;
}) => {
  try {
    const commandeSupprimee = await prisma.commande.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (!commandeSupprimee) {
      res.status(404).json({ erreur: 'Commande non trouvée' });
    } else {
      res.status(204).json({ messgae: " La Commande supprimée avec succès" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
}));

export default router;

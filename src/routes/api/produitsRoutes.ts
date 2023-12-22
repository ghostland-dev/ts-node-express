import express, { NextFunction, Request, Response } from 'express';
import { validateIdParam } from './../../middlewares/idValidationMiddleware';
import fs from 'fs/promises';
import prisma from '../../db/config';
import multer from 'multer';
import path from 'path';
import { upload } from '../../middlewares/uploadMiddleware';

const router = express.Router();

router.get('/produits/liste', async (req: Request, res: Response) => {
  try {
    const produits = await prisma.produit.findMany();
    res.json(produits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});

router.get('/produits/:id', validateIdParam, async (req: Request, res: Response) => {
  try {
    const produit = await prisma.produit.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    if (!produit) {
      res.status(404).json({ erreur: 'Produit non trouvé' });
    } else {
      res.json(produit);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});

router.post('/produits', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let uploadedFile: any;
    let imagePath: string = '';

    const { nom, description, prix } = req.body;

    // Construct the correct image path
    if (req.file) {
      uploadedFile = req.file || null;
      imagePath = '/uploads/' + uploadedFile.filename;
    }

    // Save the product with the constructed image path
    const nouveauProduit = await prisma.produit.create({
      data: {
        nom,
        description,
        prix: parseFloat(prix),
        image: imagePath ? imagePath : '',
      },
    });

    res.json(nouveauProduit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});


router.patch('/produits/:id', upload.single('image'), validateIdParam, async (req: Request, res: Response) => {
  try {
    const uploadedFile = req.file;

    // Pas besoin de vérifier si uploadedFile existe
    // Continuez la requête même si aucun fichier n'a été téléchargé

    const prix = parseFloat(req.body.prix);
    const produitModifie = await prisma.produit.update({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        ProduitCommande: true,
        _count: true,
      },
      data: {
        ...req.body,prix: prix,
        // Vérifiez si uploadedFile existe, sinon utilisez la valeur existante dans la base de données
        image: uploadedFile ? uploadedFile.path : undefined,
      },
    });

    res.json(produitModifie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});


router.delete('/produits/:id', validateIdParam, async (req: Request, res: Response) => {
  try {
    const produit = await prisma.produit.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!produit) {
      res.status(404).json({ erreur: 'Produit non trouvé' });
      return;
    }

    if (produit.image) {
      try {
        await fs.unlink(produit.image);
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'image : ${error}`);
      }
    }

    const produitSupprime = await prisma.produit.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    res.json(produitSupprime);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});

export default router;
